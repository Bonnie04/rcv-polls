import React from "react";
import { Link } from "react-router-dom";
import "./HomeStyles.css";

const Home = () => {
  return (
    <div className="home">
      <h1>Ranked Choice Voting</h1>
      <p className="subtitle">Create polls and let voters rank their choices</p>
      
      <div className="features">
        <div className="feature-card">
          <h3>Create Polls</h3>
          <p>Set up polls with multiple options and share with voters</p>
        </div>
        <div className="feature-card">
          <h3>Rank Your Choices</h3>
          <p>Voters rank options from most to least preferred</p>
        </div>
        <div className="feature-card">
          <h3>Instant Runoff</h3>
          <p>Results calculated using IRV algorithm for fair outcomes</p>
        </div>
      </div>

      <div className="cta">
        <Link to="/create" className="cta-button">
          Create Your First Poll
        </Link>
      </div>
    </div>
  );
};

export default Home;
