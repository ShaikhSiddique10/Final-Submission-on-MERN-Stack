import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuctionDetails = ({ auctionId }) => {
  const [auction, setAuction] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/auction/${auctionId}`);
        setAuction(response.data);
      } catch (error) {
        console.error('Error fetching auction details:', error);
        setErrorMessage('Failed to fetch auction details');
      }
    };

    fetchAuction();
  }, [auctionId]);

  const handleEndAuction = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/end-auction/${auctionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert('Auction ended successfully!');
      setAuction(response.data.auction); // Update the auction state
    } catch (error) {
      console.error('Error ending auction:', error);
      alert('Error ending auction');
    }
  };

  if (!auction) return <p>Loading...</p>;

  return (
    <div>
      <h2>{auction.name}</h2>
      <p>{auction.description}</p>
      <p>Start Price: {auction.startPrice}</p>
      <p>Auction Date: {new Date(auction.auctionDate).toLocaleString()}</p>
      <p>Status: {auction.status}</p>

      {auction.status === 'Active' && auction.auctioneerId === localStorage.getItem('userId') && (
        <button onClick={handleEndAuction}>End Auction</button>
      )}

      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
};

export default AuctionDetails;
