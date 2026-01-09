import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import "./DashboardStyles.css";

const Dashboard = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      // Get current user
      const userResponse = await axios.get(`${API_URL}/auth/me`, {
        withCredentials: true,
      });

      if (!userResponse.data.user) {
        setError("Please log in to view your polls");
        setLoading(false);
        return;
      }

      const userId = userResponse.data.user.id;

      // Fetch all polls and filter by creator
      // Note: In a production app, you'd want a dedicated endpoint like GET /api/polls?creatorId=...
      // For now, we'll fetch all polls (this is not ideal for large datasets)
      const response = await axios.get(`${API_URL}/api/polls`, {
        withCredentials: true,
      });

      // Filter polls by creatorId
      const userPolls = response.data.filter(
        (poll) => poll.creatorId === userId
      );

      // For each poll, get ballot count
      const pollsWithCounts = await Promise.all(
        userPolls.map(async (poll) => {
          try {
            const pollDetails = await axios.get(
              `${API_URL}/api/polls/${poll.shareableLink}`
            );
            return {
              ...poll,
              totalBallots: pollDetails.data.totalBallots || 0,
            };
          } catch {
            return { ...poll, totalBallots: 0 };
          }
        })
      );

      setPolls(pollsWithCounts);
    } catch (err) {
      console.error("Error fetching polls:", err);
      setError("Failed to load polls");
    } finally {
      setLoading(false);
    }
  };

  const handleClosePoll = async (pollId) => {
    if (!window.confirm("Are you sure you want to close this poll?")) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/polls/${pollId}/close`,
        {},
        { withCredentials: true }
      );
      fetchPolls(); // Refresh list
    } catch (err) {
      console.error("Error closing poll:", err);
      alert(err.response?.data?.error || "Failed to close poll");
    }
  };

  if (loading) {
    return <div className="dashboard">Loading...</div>;
  }

  if (error) {
    return <div className="dashboard error">{error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Polls</h1>
        <button
          onClick={() => navigate("/create")}
          className="create-poll-btn"
        >
          + Create New Poll
        </button>
      </div>

      {polls.length === 0 ? (
        <div className="no-polls">
          <p>You haven't created any polls yet.</p>
          <button
            onClick={() => navigate("/create")}
            className="create-poll-btn"
          >
            Create Your First Poll
          </button>
        </div>
      ) : (
        <div className="polls-list">
          {polls.map((poll) => (
            <div key={poll.id} className="poll-card">
              <div className="poll-header">
                <h3>{poll.title}</h3>
                <span
                  className={`status ${poll.isOpen ? "open" : "closed"}`}
                >
                  {poll.isOpen ? "Open" : "Closed"}
                </span>
              </div>
              {poll.description && (
                <p className="poll-description">{poll.description}</p>
              )}
              <div className="poll-stats">
                <span>Votes: {poll.totalBallots}</span>
                <span>Link: {poll.shareableLink}</span>
              </div>
              <div className="poll-actions">
                <button
                  onClick={() => navigate(`/vote/${poll.shareableLink}`)}
                >
                  View Poll
                </button>
                {poll.isOpen ? (
                  <>
                    <button
                      onClick={() => handleClosePoll(poll.id)}
                      className="close-btn"
                    >
                      Close Poll
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate(`/results/${poll.shareableLink}`)}
                    className="results-btn"
                  >
                    View Results
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
