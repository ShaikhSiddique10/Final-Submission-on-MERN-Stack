import React from 'react';
import './LoggedinHomepage.css'; // Ensure to link this CSS file

const LoggedinHomepage = () => {
  return (
    <div className="loggedin-homepage">
      <div className="container text-center">
        <h1 className="homepage-title">Welcome to BidNova</h1>
        <p className="homepage-intro">
          At BidNova, we provide a seamless and exciting platform for online auctions. Whether you're looking to bid on your favorite items or host your own auction, we've got you covered!
        </p>
        <p className="homepage-description">
          Join us today and experience the thrill of bidding and winning. Here's why BidNova is the right choice for you:
        </p>
        <div className="features">
          <div className="feature">
            <h3 className="feature-title">Exclusive Auctions</h3>
            <p className="feature-text">Gain access to exclusive, hand-picked auctions. Bid on unique items and experiences that you won’t find anywhere else!</p>
          </div>
          <div className="feature">
            <h3 className="feature-title">Secure Bidding</h3>
            <p className="feature-text">We prioritize your security. Our platform ensures safe and transparent bidding with reliable payment options and user protection.</p>
          </div>
          <div className="feature">
            <h3 className="feature-title">Real-Time Updates</h3>
            <p className="feature-text">Stay updated with real-time notifications on auction statuses, winning bids, and upcoming opportunities so you never miss out.</p>
          </div>
        </div>
        <footer>
          <p className="footer-text">BidNova © 2025 | All rights reserved</p>
        </footer>
      </div>
    </div>
  );
};

export default LoggedinHomepage;
