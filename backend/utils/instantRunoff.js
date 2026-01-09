/**
 * Instant Runoff Voting (IRV) Algorithm
 * 
 * Algorithm:
 * 1. Count first-choice votes for each option
 * 2. If an option has >50%, they win
 * 3. Otherwise, eliminate option with fewest votes
 * 4. Redistribute eliminated votes to next choice
 * 5. Repeat until winner found
 */

function calculateInstantRunoff(ballots, pollOptions) {
  const rounds = [];
  let activeOptions = [...pollOptions];
  let currentBallots = ballots.map(b => ({ ...b })); // Copy ballots to avoid mutation
  
  // Handle edge case: single option (no rounds needed)
  if (activeOptions.length === 1) {
    const winner = activeOptions[0];
    // Count votes for the single option
    let voteCount = 0;
    currentBallots.forEach(ballot => {
      if (ballot.rankings && ballot.rankings.length > 0) {
        const sortedRankings = [...ballot.rankings].sort((a, b) => a.rank - b.rank);
        if (sortedRankings[0] && sortedRankings[0].pollOptionId === winner.id) {
          voteCount++;
        }
      }
    });
    
    return {
      winner: {
        id: winner.id,
        optionText: winner.optionText || winner.text,
        finalVoteCount: voteCount,
      },
      rounds: [],
      eliminated: [],
    };
  }
  
  // Handle edge case: no options
  if (activeOptions.length === 0) {
    return {
      winner: null,
      rounds: [],
      eliminated: [],
    };
  }
  
  let roundNumber = 1;
  
  while (activeOptions.length > 1) {
    // Count first-choice votes for each active option
    const tallies = {};
    activeOptions.forEach(option => {
      tallies[option.id] = 0;
    });
    
    // Count votes
    currentBallots.forEach(ballot => {
      if (ballot.rankings && ballot.rankings.length > 0) {
        // Find the highest ranked option that's still active
        const sortedRankings = [...ballot.rankings].sort((a, b) => a.rank - b.rank);
        for (const ranking of sortedRankings) {
          if (activeOptions.find(opt => opt.id === ranking.pollOptionId)) {
            tallies[ranking.pollOptionId] = (tallies[ranking.pollOptionId] || 0) + 1;
            break;
          }
        }
      }
    });
    
    const totalVotes = Object.values(tallies).reduce((sum, count) => sum + count, 0);
    const threshold = totalVotes / 2;
    
    // Check for majority winner
    let winner = null;
    for (const optionId in tallies) {
      if (tallies[optionId] > threshold) {
        winner = pollOptions.find(opt => opt.id === optionId);
        break;
      }
    }
    
    // Format tallies for display (using optionText)
    const formattedTallies = {};
    activeOptions.forEach(option => {
      const optionText = option.optionText || option.text || option.id;
      formattedTallies[optionText] = tallies[option.id] || 0;
    });
    
    const round = {
      roundNumber,
      tallies: formattedTallies,
    };
    
    if (winner) {
      round.winner = winner.optionText || winner.text || winner.id;
      round.finalVoteCount = tallies[winner.id];
      rounds.push(round);
      return {
        winner: {
          id: winner.id,
          optionText: winner.optionText || winner.text,
          finalVoteCount: tallies[winner.id],
        },
        rounds,
        eliminated: rounds.flatMap(r => r.eliminated || []),
      };
    }
    
    // Find option(s) with lowest votes
    const voteCounts = activeOptions.map(opt => ({
      option: opt,
      votes: tallies[opt.id] || 0,
    }));
    
    const minVotes = Math.min(...voteCounts.map(v => v.votes));
    const eliminatedOptions = voteCounts
      .filter(v => v.votes === minVotes)
      .map(v => v.option);
    
    // Handle tie - if all remaining options are tied, eliminate all but one (or all)
    if (eliminatedOptions.length === activeOptions.length && activeOptions.length > 1) {
      // All tied - eliminate all but the first one (or could be random)
      // splice(1) removes everything from index 1 onwards, keeping only index 0 (first element)
      eliminatedOptions.splice(1);
    }
    
    const eliminatedTexts = eliminatedOptions.map(opt => opt.optionText || opt.text || opt.id);
    round.eliminated = eliminatedTexts;
    rounds.push(round);
    
    // Remove eliminated options from active list
    activeOptions = activeOptions.filter(
      opt => !eliminatedOptions.find(eo => eo.id === opt.id)
    );
    
    // If no active options left, break
    if (activeOptions.length === 0) {
      break;
    }
    
    roundNumber++;
  }
  
  // If we have one option left, it's the winner
  if (activeOptions.length === 1) {
    const winner = activeOptions[0];
    // Safely get vote count from last round, or count directly if no rounds
    let winnerVotes = 0;
    if (rounds.length > 0) {
      const lastRound = rounds[rounds.length - 1];
      winnerVotes = lastRound.tallies[winner.optionText || winner.text || winner.id] || 0;
    } else {
      // Edge case: count votes directly if no rounds were executed
      currentBallots.forEach(ballot => {
        if (ballot.rankings && ballot.rankings.length > 0) {
          const sortedRankings = [...ballot.rankings].sort((a, b) => a.rank - b.rank);
          if (sortedRankings[0] && sortedRankings[0].pollOptionId === winner.id) {
            winnerVotes++;
          }
        }
      });
    }
    
    return {
      winner: {
        id: winner.id,
        optionText: winner.optionText || winner.text,
        finalVoteCount: winnerVotes,
      },
      rounds,
      eliminated: rounds.flatMap(r => r.eliminated || []),
    };
  }
  
  // No clear winner
  return {
    winner: null,
    rounds,
    eliminated: rounds.flatMap(r => r.eliminated || []),
  };
}

module.exports = { calculateInstantRunoff };
