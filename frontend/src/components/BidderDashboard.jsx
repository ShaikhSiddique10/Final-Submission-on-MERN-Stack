import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { format } from 'date-fns';  // Importing date-fns for date formatting
import './bidderDashboard.css';

const BidderDashboard = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const socket = io('http://localhost:5000');  // Connect to the WebSocket server

  // Listen for auction updates
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const response = await fetch('http://localhost:5000/auctions');
        if (!response.ok) {
          throw new Error('Failed to fetch auctions');
        }
        const data = await response.json();
        console.log("Fetched Auctions Data: ", data); // Log the data for debugging
        setAuctions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
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
      socket.off('bidUpdate');
    };
  }, []);

  const handlePlaceBid = async (auctionId) => {
    const token = localStorage.getItem('token');  

    if (!token) {
      alert('You must be logged in to place a bid.');
      return;
    }

    if (!bidAmount || isNaN(bidAmount) || bidAmount <= 0) {
      alert('Please enter a valid bid amount.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/place-bid/${auctionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bidAmount: parseFloat(bidAmount) }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to place bid');
      }

      console.log('Bid placed successfully:', result);

      // Optionally emit bidUpdate event if the backend is set up to handle this
      socket.emit('bidUpdate', result);

      alert(`Bid placed successfully on auction ${auctionId}`);
      setBidAmount('');
    } catch (err) {
      console.error('Error placing bid:', err);
      alert(`Error placing bid: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="text-center">Loading auctions...</div>;
  }

  if (error) {
    return <div className="text-center">Error: {error}</div>;
  }

  return (
    <div className="bidder-dashboard">
      <h2 className="text-center my-4">Bidder Dashboard</h2>
      <div className="auction-list row">
        {auctions.length > 0 ? (
          auctions.map((auction) => (
            <div key={auction._id} className="col-md-4 mb-4">
              <div className="card">
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

                    <strong>Description:</strong> {auction.description || 'No description available'}
                  </p>
                  <div className="d-flex justify-content-between align-items-center">
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Enter bid amount"
                      min={auction.currentBid + 1}
                      className="form-control"
                    />
                    <button 
                      className="btn btn-primary mt-2" 
                      onClick={() => handlePlaceBid(auction._id)}
                    >
                      Place Bid
                    </button>
                  </div>
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

export default BidderDashboard;
