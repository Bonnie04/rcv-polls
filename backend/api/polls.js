const express = require("express");
const router = express.Router();
const { Poll, PollOption, Ballot, Ranking, User } = require("../database");
const { authenticateJWT } = require("../auth");
const { calculateInstantRunoff } = require("../utils/instantRunoff");
const crypto = require("crypto");

// Helper function to generate unique shareable link
function generateShareableLink() {
  return crypto.randomBytes(16).toString("hex");
}

// GET /api/polls - Get all polls for authenticated user
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const polls = await Poll.findAll({
      where: { creatorId: userId },
      order: [["createdAt", "DESC"]],
    });

    res.json(polls);
  } catch (error) {
    console.error("Error fetching polls:", error);
    res.status(500).json({ error: "Failed to fetch polls" });
  }
});

// POST /api/polls - Create a new poll
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { title, description, options } = req.body;
    const creatorId = req.user.id;

    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        error: "Title and at least 2 options are required",
      });
    }

    // Generate unique shareable link
    let shareableLink = generateShareableLink();
    let linkExists = await Poll.findOne({ where: { shareableLink } });
    while (linkExists) {
      shareableLink = generateShareableLink();
      linkExists = await Poll.findOne({ where: { shareableLink } });
    }

    // Create poll
    const poll = await Poll.create({
      title,
      description,
      creatorId,
      shareableLink,
      isOpen: true,
    });

    // Create poll options
    const pollOptions = await Promise.all(
      options.map((optionText, index) =>
        PollOption.create({
          pollId: poll.id,
          optionText,
          displayOrder: index,
        })
      )
    );

    res.status(201).json({
      id: poll.id,
      title: poll.title,
      shareableLink: poll.shareableLink,
      isOpen: poll.isOpen,
    });
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({ error: "Failed to create poll" });
  }
});

// GET /api/polls/:shareableLink/results - Get poll results (IRV)
// This must come before the general /:shareableLink route
router.get("/:shareableLink/results", async (req, res) => {
  try {
    const { shareableLink } = req.params;

    const poll = await Poll.findOne({
      where: { shareableLink },
      include: [{ model: PollOption, as: "options" }],
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.isOpen) {
      return res.status(403).json({ error: "Poll is still open. Results available after closing." });
    }

    // Get all ballots with rankings
    const ballots = await Ballot.findAll({
      where: { pollId: poll.id },
      include: [
        {
          model: Ranking,
          as: "rankings",
          include: [{ model: PollOption, as: "pollOption" }],
        },
      ],
    });

    // Format ballots for IRV algorithm
    const formattedBallots = ballots.map((ballot) => ({
      id: ballot.id,
      rankings: ballot.rankings.map((ranking) => ({
        pollOptionId: ranking.pollOptionId,
        rank: ranking.rank,
      })),
    }));

    // Format options for IRV algorithm
    const formattedOptions = poll.options.map((opt) => ({
      id: opt.id,
      optionText: opt.optionText,
      text: opt.optionText, // Alias for algorithm compatibility
    }));

    // Calculate IRV results
    const results = calculateInstantRunoff(formattedBallots, formattedOptions);

    res.json({
      winner: results.winner,
      rounds: results.rounds,
      totalBallots: ballots.length,
    });
  } catch (error) {
    console.error("Error calculating results:", error);
    res.status(500).json({ error: "Failed to calculate results" });
  }
});

// GET /api/polls/:shareableLink - Get poll details
router.get("/:shareableLink", async (req, res) => {
  try {
    const { shareableLink } = req.params;

    const poll = await Poll.findOne({
      where: { shareableLink },
      include: [
        {
          model: PollOption,
          as: "options",
          order: [["displayOrder", "ASC"]],
        },
      ],
      order: [[PollOption, "displayOrder", "ASC"]],
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    // Get total ballots count
    const totalBallots = await Ballot.count({ where: { pollId: poll.id } });

    res.json({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      options: poll.options.map((opt) => ({
        id: opt.id,
        optionText: opt.optionText,
        displayOrder: opt.displayOrder,
      })),
      isOpen: poll.isOpen,
      totalBallots,
    });
  } catch (error) {
    console.error("Error fetching poll:", error);
    res.status(500).json({ error: "Failed to fetch poll" });
  }
});

// POST /api/polls/:shareableLink/vote - Submit a ballot
router.post("/:shareableLink/vote", async (req, res) => {
  try {
    const { shareableLink } = req.params;
    const { voterId, rankings } = req.body;

    // Find poll
    const poll = await Poll.findOne({
      where: { shareableLink },
      include: [{ model: PollOption, as: "options" }],
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (!poll.isOpen) {
      return res.status(400).json({ error: "Poll is closed" });
    }

    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) {
      return res.status(400).json({ error: "Rankings are required" });
    }

    // Validate rankings
    const rankValues = rankings.map((r) => r.rank);
    const uniqueRanks = new Set(rankValues);
    if (rankValues.length !== uniqueRanks.size) {
      return res.status(400).json({ error: "All ranks must be unique" });
    }

    // Validate all option IDs exist
    const pollOptionIds = poll.options.map((opt) => opt.id);
    const rankingOptionIds = rankings.map((r) => r.pollOptionId);
    const invalidOptions = rankingOptionIds.filter(
      (id) => !pollOptionIds.includes(id)
    );
    if (invalidOptions.length > 0) {
      return res.status(400).json({ error: "Invalid poll option IDs" });
    }

    // Create ballot
    const ballot = await Ballot.create({
      pollId: poll.id,
      voterId: voterId || null,
      submittedAt: new Date(),
    });

    // Create rankings
    await Promise.all(
      rankings.map((ranking) =>
        Ranking.create({
          ballotId: ballot.id,
          pollOptionId: ranking.pollOptionId,
          rank: ranking.rank,
        })
      )
    );

    res.status(201).json({
      ballotId: ballot.id,
      message: "Vote submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting vote:", error);
    res.status(500).json({ error: "Failed to submit vote" });
  }
});

// POST /api/polls/:id/close - Close a poll (creator only)
router.post("/:id/close", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const poll = await Poll.findByPk(id);

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll.creatorId !== userId) {
      return res.status(403).json({ error: "Only the creator can close this poll" });
    }

    poll.isOpen = false;
    poll.closedAt = new Date();
    await poll.save();

    res.json({
      message: "Poll closed successfully",
      poll: {
        id: poll.id,
        isOpen: poll.isOpen,
        closedAt: poll.closedAt,
      },
    });
  } catch (error) {
    console.error("Error closing poll:", error);
    res.status(500).json({ error: "Failed to close poll" });
  }
});

module.exports = router;
