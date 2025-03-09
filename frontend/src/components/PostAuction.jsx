import React, { useState } from 'react';
import axios from 'axios';

const PostAuction = () => {
  const [auctionData, setAuctionData] = useState({
    name: '',
    description: '',
    startPrice: '',
    auctionDate: '',
    startTime: '',
    endTime: '',
  });
  const [auctionImage, setAuctionImage] = useState(null);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAuctionData({ ...auctionData, [name]: value });
  };

  // Handle image file change
  const handleImageChange = (e) => {
    setAuctionImage(e.target.files[0]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', auctionData.name);
    formData.append('description', auctionData.description);
    formData.append('startPrice', auctionData.startPrice);
    formData.append('auctionDate', auctionData.auctionDate);
    formData.append('startTime', auctionData.startTime);
    formData.append('endTime', auctionData.endTime);
    if (auctionImage) {
      formData.append('image', auctionImage);
    }

    try {
      const token = localStorage.getItem('token'); // Adjust token storage according to your setup
      const response = await axios.post('http://localhost:5000/post-auction', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log(response.data);
      alert('Auction posted successfully!');
    } catch (error) {
      console.error('Error posting auction:', error);
      alert('Error posting auction');
    }
  };

  return (
    <div className="container my-5 bg-light p-4 rounded shadow-sm">
      <form onSubmit={handleSubmit} className="row g-3">
        <div className="col-12">
          <label className="form-label">Item Name</label>
          <input
            type="text"
            name="name"
            value={auctionData.name}
            onChange={handleInputChange}
            required
            className="form-control"
            placeholder="Enter item name"
          />
        </div>
        <div className="col-12">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={auctionData.description}
            onChange={handleInputChange}
            required
            className="form-control"
            placeholder="Enter a detailed description"
          ></textarea>
        </div>
        <div className="col-md-6">
          <label className="form-label">Start Price</label>
          <input
            type="number"
            name="startPrice"
            value={auctionData.startPrice}
            onChange={handleInputChange}
            required
            className="form-control"
            placeholder="Enter starting price"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Auction Date</label>
          <input
            type="datetime-local"
            name="auctionDate"
            value={auctionData.auctionDate}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Start Time</label>
          <input
            type="time"
            name="startTime"
            value={auctionData.startTime}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">End Time</label>
          <input
            type="time"
            name="endTime"
            value={auctionData.endTime}
            onChange={handleInputChange}
            required
            className="form-control"
          />
        </div>
        <div className="col-12">
          <label className="form-label">Upload Auction Image</label>
          <input
            type="file"
            name="image"
            onChange={handleImageChange}
            accept="image/*"
            className="form-control"
          />
        </div>
        <div className="col-12">
          <button type="submit" className="btn btn-success w-100 py-2">Post Auction</button>
        </div>
      </form>
    </div>
  );
};

export default PostAuction;
