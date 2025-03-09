import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css'; // Import profile page styling

const ProfilePage = () => {
  const [user, setUser] = useState(null); // State to store user data
  const [file, setFile] = useState(null); // State for the uploaded file
  const [errorMessage, setErrorMessage] = useState(''); // State for error messages
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(''); // State for username
  const [address, setAddress] = useState(''); // State for address
  const [isEditing, setIsEditing] = useState(false); // To toggle between editing and viewing profile
  const navigate = useNavigate();

  // Fetch user profile data from backend
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      const response = await axios.get('http://localhost:5000/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(response.data);
      setUsername(response.data.username || ''); // Set username from user data
      setAddress(response.data.address || '');   // Set address from user data
      setLoading(false);
    } catch (error) {
      setErrorMessage('Error fetching profile data.');
      setLoading(false);
    }
  };

  // Handle file change (image selection)
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle photo upload
  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      const response = await axios.post('http://localhost:5000/update-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setUser((prevUser) => ({
        ...prevUser,
        photo: response.data.photo, // Update user photo in state
      }));

      alert('Photo uploaded successfully');
    } catch (error) {
      console.error('Upload Error:', error);
      setErrorMessage('Error uploading photo');
    }
  };

  // Handle profile update (username, address)
  const handleProfileUpdate = async () => {
    if (!username || !address) {
      setErrorMessage('Both username and address are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      const response = await axios.post('http://localhost:5000/update-profile', { username, address }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(response.data.user); // Update user state with the new details
      setIsEditing(false); // Exit editing mode
      alert('Profile updated successfully');
    } catch (error) {
      // Handle error properly
      if (error.response) {
        setErrorMessage(error.response.data.message || 'Error updating profile');
      } else {
        setErrorMessage('Error updating profile');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  if (loading) return <div className="text-center">Loading...</div>;
  if (errorMessage) return <div className="alert alert-danger text-center">{errorMessage}</div>;

  return (
    <div className="container mt-4 profile-page">
      {/* Removed the Profile Page header */}

      {user && (
        <div className="card shadow-sm p-4">
          <div className="text-center">
            {user.photo ? (
              <img
                src={`http://localhost:5000${user.photo}`}
                alt="Profile"
                className="rounded-circle img-fluid"
                style={{ width: '150px', height: '150px' }}
              />
            ) : (
              <div className="rounded-circle img-fluid" style={{ width: '150px', height: '150px', backgroundColor: '#f0f0f0' }}></div>
            )}
          </div>

          <div className="mt-4">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>

            {/* Username */}
            <div className="form-group">
              <label><strong>Username:</strong></label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              ) : (
                <span>{user.username}</span>
              )}
            </div>

            {/* Address */}
            <div className="form-group">
              <label><strong>Address:</strong></label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-control"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              ) : (
                <span>{user.address}</span>
              )}
            </div>

            {/* Edit and Update buttons */}
            <div className="d-flex justify-content-between mt-4">
              {isEditing ? (
                <button className="btn btn-success" onClick={handleProfileUpdate}>Update Profile</button>
              ) : (
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
              )}
            </div>

            {/* File upload for profile photo */}
            <div className="mt-4">
              <label><strong>Upload Profile Photo:</strong></label>
              <div className="d-flex">
                <input
                  type="file"
                  className="form-control"
                  onChange={handleFileChange}
                />
                <button className="btn btn-info ml-2" onClick={handleUpload}>Upload</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
