import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../shared";
import "./CreatePollStyles.css";

const CreatePoll = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [shareableLink, setShareableLink] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const validOptions = options.filter((opt) => opt.trim() !== "");

    if (!title.trim()) {
      setError("Title is required");
      setLoading(false);
      return;
    }

    if (validOptions.length < 2) {
      setError("At least 2 options are required");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/polls`,
        {
          title: title.trim(),
          description: description.trim() || null,
          options: validOptions.map((opt) => opt.trim()),
        },
        { withCredentials: true }
      );

      setShareableLink(response.data.shareableLink);
    } catch (err) {
      console.error("Error creating poll:", err);
      setError(err.response?.data?.error || "Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  if (shareableLink) {
    const pollUrl = `${window.location.origin}/vote/${shareableLink}`;
    return (
      <div className="create-poll">
        <div className="success-message">
          <h2>Poll Created Successfully!</h2>
          <p>Share this link with voters:</p>
          <div className="shareable-link">
            <input
              type="text"
              value={pollUrl}
              readOnly
              onClick={(e) => e.target.select()}
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(pollUrl);
                alert("Link copied to clipboard!");
              }}
            >
              Copy
            </button>
          </div>
          <div className="actions">
            <button onClick={() => navigate(`/vote/${shareableLink}`)}>
              View Poll
            </button>
            <button onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-poll">
      <h1>Create New Poll</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Poll Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Best Pizza Topping"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for your poll"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>Options * (at least 2 required)</label>
          {options.map((option, index) => (
            <div key={index} className="option-input">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="remove-btn"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addOption} className="add-option-btn">
            + Add Option
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Creating..." : "Create Poll"}
        </button>
      </form>
    </div>
  );
};

export default CreatePoll;
