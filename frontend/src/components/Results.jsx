import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import "./ResultsStyles.css";

const Results = () => {
  const { shareableLink } = useParams();
  const [results, setResults] = useState(null);
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResults();
  }, [shareableLink]);

  const fetchResults = async () => {
    try {
      // Fetch poll details
      const pollResponse = await axios.get(
        `${API_URL}/api/polls/${shareableLink}`
      );
      setPoll(pollResponse.data);

      // Fetch results
      const resultsResponse = await axios.get(
        `${API_URL}/api/polls/${shareableLink}/results`
      );
      setResults(resultsResponse.data);
    } catch (err) {
      console.error("Error fetching results:", err);
      setError(err.response?.data?.error || "Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="results-page">Loading results...</div>;
  }

  if (error) {
    return (
      <div className="results-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!results || !poll) {
    return <div className="results-page">Results not available</div>;
  }

  return (
    <div className="results-page">
      <h1>{poll.title}</h1>
      {poll.description && <p className="description">{poll.description}</p>}

      {results.winner ? (
        <div className="winner-section">
          <h2>🏆 Winner</h2>
          <div className="winner-card">
            <h3>{results.winner.optionText}</h3>
            <p className="vote-count">
              {results.winner.finalVoteCount} votes
            </p>
          </div>
        </div>
      ) : (
        <div className="winner-section">
          <h2>No Clear Winner</h2>
          <p>All candidates were eliminated or there was a tie.</p>
        </div>
      )}

      <div className="rounds-section">
        <h2>Round-by-Round Breakdown</h2>
        <p className="total-ballots">
          Total Ballots: {results.totalBallots}
        </p>

        {results.rounds.map((round, index) => (
          <div key={index} className="round">
            <h3>Round {round.roundNumber}</h3>
            <div className="tallies">
              {Object.entries(round.tallies).map(([option, votes]) => (
                <div key={option} className="tally-item">
                  <span className="option-name">{option}</span>
                  <span className="vote-count">{votes} votes</span>
                  <div className="vote-bar">
                    <div
                      className="vote-fill"
                      style={{
                        width: `${
                          (votes / results.totalBallots) * 100 || 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {round.eliminated && round.eliminated.length > 0 && (
              <div className="eliminated">
                <strong>Eliminated:</strong> {round.eliminated.join(", ")}
              </div>
            )}
            {round.winner && (
              <div className="round-winner">
                <strong>Winner:</strong> {round.winner}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Results;
