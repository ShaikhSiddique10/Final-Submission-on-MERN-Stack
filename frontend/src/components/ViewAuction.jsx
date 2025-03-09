import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ViewAuction = () => {
  const { auctionId } = useParams();  // Get the auction ID from the URL
  const [auction, setAuction] = useState(null);
  const navigate = useNavigate();  // Use navigate for redirection

  useEffect(() => {
    const fetchAuction = async () => {
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch(`http://localhost:5000/auction/${auctionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch auction details');
        }

        const data = await response.json();
        setAuction(data);  // Set the auction data

      } catch (error) {
        console.error('Error fetching auction:', error);
      }
    };

    fetchAuction();
  }, [auctionId]);  // Dependency array ensures this runs when auctionId changes

  const handleBackToAuctions = () => {
    navigate('/auctioneer-dashboard');  // Correctly navigate back to the Auctioneer Dashboard
  };

  if (!auction) {
    return <div>Loading...</div>;
  }

  return (
    <div className="view-auction-container mt-5">
      <div className="card mx-auto" style={{ maxWidth: '800px' }}>
        <h3 className="text-center mb-4">{auction.name}</h3>
        <div className="auction-photo text-center mb-4">
          <img 
            src={`http://localhost:5000${auction.photo || '/default-image.jpg'}`} 
            alt={auction.name} 
            className="img-fluid rounded"
          />
        </div>

        {/* Enhanced Description Section */}
        <div className="auction-description p-3 mb-4 bg-light rounded">
          <p className="text-muted">{auction.description}</p>
        </div>

        <p><strong>Starting Price:</strong> ${auction.startPrice}</p>
        <p><strong>Auction Date:</strong> {new Date(auction.auctionDate).toLocaleDateString()}</p>

        {/* Back to Auctions Button */}
        <div className="d-flex justify-content-center mt-4">
          <button className="btn btn-secondary" onClick={handleBackToAuctions}>
            Back to Auctions
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAuction;
