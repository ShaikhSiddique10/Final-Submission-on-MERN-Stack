import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { format } from 'date-fns';  // Importing date-fns for date formatting
import './auctioneerDashboard.css';

const AuctioneerDashboard = () => {
  const [auctions, setAuctions] = useState([]);
  const navigate = useNavigate();
  const socket = io('http://localhost:5000');  

  useEffect(() => {
    const fetchAuctions = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:5000/user-auctions', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch auctions');
        }

        const data = await response.json();
        setAuctions(data);
      } catch (error) {
        console.error('Error fetching auctions:', error);
      }
    };

    fetchAuctions();

    socket.on('bidUpdate', (data) => {
      console.log('Received bid update:', data);  // Log the bid update
    
      setAuctions((prevAuctions) =>
        prevAuctions.map((auction) =>
          auction._id === data.auctionId
            ? {
                ...auction,
                currentBid: data.newBid,
                highestBidder: { username: data.highestBidder }, // Ensure the highest bidder is set properly
              }
            : auction
        )
      );
    });

    return () => {
      socket.off('auctionUpdate');
    };
  }, []);

  const handleViewAuction = (auctionId) => {
    navigate(`/view-auction/${auctionId}`);
  };

  const handleEndAuction = async (auctionId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/end-auction/${auctionId}`, {
        method: 'POST',  
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to end auction');
      }
  
      setAuctions((prevAuctions) => prevAuctions.filter(auction => auction._id !== auctionId));
  
      alert('Auction ended successfully!');
    } catch (error) {
      console.error('Error ending auction:', error);
      alert('There was an issue ending the auction.');
    }
  };

  return (
    <div className="auctioneer-dashboard">
      <h2 className="text-center my-4">Auctioneer Dashboard</h2>
      <div className="d-flex justify-content-end mb-4">
        <NavLink to="/post-auction" className="btn btn-primary">
          Post Auction
        </NavLink>
      </div>

      <div className="row">
        {auctions.length > 0 ? (
          auctions.map((auction) => (
            <div key={auction._id} className="col-md-4 mb-4">
              <div className="card h-100">
                <img 
                  src={`http://localhost:5000${auction.photo || '/default-image.jpg'}`} 
                  className="card-img-top" 
                  alt={auction.name} 
                />
                <div className="card-body">
                  <h5 className="card-title">{auction.name}</h5>
                  <p className="card-text">
                    <strong>Status:</strong> {auction.status} <br />
                    <strong>Current Bid:</strong> ${auction.currentBid || auction.startPrice} <br />
                  
                  </p>
                  <button 
                    className="btn btn-primary w-100" 
                    onClick={() => handleViewAuction(auction._id)}
                  >
                    View Details
                  </button>
                  <button 
                    className="btn btn-danger w-100 mt-2" 
                    onClick={() => handleEndAuction(auction._id)}
                  >
                    End Auction
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <p>No auctions available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctioneerDashboard;
