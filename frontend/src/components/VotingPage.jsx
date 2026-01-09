import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import "./VotingPageStyles.css";

const VotingPage = () => {
  const { shareableLink } = useParams();
  const [poll, setPoll] = useState(null);
  const [rankings, setRankings] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, [shareableLink]);

  const fetchPoll = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/polls/${shareableLink}`);
      setPoll(response.data);
      
      // Initialize rankings object
      const initialRankings = {};
      response.data.options.forEach((opt) => {
        initialRankings[opt.id] = null;
      });
      setRankings(initialRankings);
    } catch (err) {
      console.error("Error fetching poll:", err);
      setError(err.response?.data?.error || "Failed to load poll");
    } finally {
      setLoading(false);
    }
  };

  const handleRankChange = (optionId, rank) => {
    const newRankings = { ...rankings };
    
    // Check if this rank is already assigned to another option
    const existingOptionId = Object.keys(newRankings).find(
      (id) => newRankings[id] === parseInt(rank) && id !== optionId
    );
    
    if (existingOptionId) {
      newRankings[existingOptionId] = null;
    }
    
    newRankings[optionId] = rank === "" ? null : parseInt(rank);
    setRankings(newRankings);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Validate rankings
    const rankedOptions = Object.entries(rankings)
      .filter(([_, rank]) => rank !== null)
      .map(([optionId, rank]) => ({ pollOptionId: optionId, rank }));

    if (rankedOptions.length === 0) {
      setError("Please rank at least one option");
      setSubmitting(false);
      return;
    }

    // Check for duplicate ranks
    const ranks = rankedOptions.map((r) => r.rank);
    if (new Set(ranks).size !== ranks.length) {
      setError("Each option must have a unique rank");
      setSubmitting(false);
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/polls/${shareableLink}/vote`,
        {
          rankings: rankedOptions,
        },
        { withCredentials: true }
      );

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting vote:", err);
      setError(err.response?.data?.error || "Failed to submit vote");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="voting-page">Loading poll...</div>;
  }

  if (error && !poll) {
    return <div className="voting-page error">{error}</div>;
  }

  if (!poll) {
    return <div className="voting-page">Poll not found</div>;
  }

  if (submitted) {
    return (
      <div className="voting-page">
        <div className="success-message">
          <h2>✓ Vote Submitted Successfully!</h2>
          <p>Thank you for voting.</p>
        </div>
      </div>
    );
  }

  if (!poll.isOpen) {
    return (
      <div className="voting-page">
        <div className="poll-closed">
          <h2>{poll.title}</h2>
          <p>This poll is closed.</p>
        </div>
      </div>
    );
  }

  const maxRank = poll.options.length;
  const rankOptions = Array.from({ length: maxRank }, (_, i) => i + 1);

  return (
    <div className="voting-page">
      <h1>{poll.title}</h1>
      {poll.description && <p className="description">{poll.description}</p>}

      <form onSubmit={handleSubmit}>
        <div className="ranking-form">
          <p className="instructions">
            Rank your choices (1 = first choice, {maxRank} = last choice)
          </p>
          {poll.options.map((option) => (
            <div key={option.id} className="option-row">
              <span className="option-text">{option.optionText}</span>
              <select
                value={rankings[option.id] || ""}
                onChange={(e) => handleRankChange(option.id, e.target.value)}
                className="rank-select"
              >
                <option value="">--</option>
                {rankOptions.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        <button
          type="submit"
          disabled={submitting}
          className="submit-vote-btn"
        >
          {submitting ? "Submitting..." : "Submit Vote"}
        </button>
      </form>
    </div>
  );
};

export default VotingPage;
