import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css'; // Include the CSS

function WelcomePage() {
  const navigate = useNavigate(); // For navigation

  const handleSignUp = () => {
    // Redirect to SignUp page
    navigate('/signup');
  };

  return (
    <div className="welcome-container">
      <div className="welcome-box">
        <h1>Welcome to <span className="brand-name">BidNova</span>!</h1>
        <p className="welcome-description">
          We are thrilled to have you with us. Join our community of bidders and start your journey with the best auction experience!
        </p>
        <button onClick={handleSignUp} className="welcome-button">
          Get Started
        </button>
      </div>
    </div>
  );
}

export default WelcomePage;
