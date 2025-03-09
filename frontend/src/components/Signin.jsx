import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './signin.css';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [contactError, setContactError] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false); // New state to track OTP verification
  const navigate = useNavigate();

  // Handle submit for login
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        const userRole = data.role;
        if (userRole === 'auctioneer') {
          navigate('/auctioneer-dashboard');
        } else if (userRole === 'bidder') {
          navigate('/bidder-dashboard');
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error signing in. Please try again.');
    }
  };

  // Handle forgotten password and send OTP
  const handleForgotPassword = async () => {
    if (!contactNumber) {
      setContactError('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contactNumber }), // Send email instead of contact
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedOtp(data.otp); // Store the OTP received from the server
        setContactError(''); // Clear any previous error messages
        alert(`OTP sent successfully! Your OTP is: ${data.otp}`); // Show OTP in alert
      } else {
        setContactError('Wrong email. Please try again.'); // Show error message for incorrect email
      }
    } catch (err) {
      setContactError('Error sending OTP. Please try again.');
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    if (otp === generatedOtp) {
      setIsOtpVerified(true); // Mark OTP as verified
      setOtpError(''); // Clear OTP error
      alert('OTP verified successfully!');
    } else {
      setOtpError('Incorrect OTP. Please try again.');
    }
  };

  // Handle password change after OTP is verified
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, // The email the OTP was sent to
          otp, // OTP entered by user
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Password reset successfully!');
        setIsForgotPassword(false); // Close forgot password popup
      } else {
        setPasswordError(data.message);
      }
    } catch (err) {
      setPasswordError('Error resetting password. Please try again.');
    }
  };

  return (
    <div className="signin-container d-flex justify-content-center align-items-center">
      <div className="card shadow-lg p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <h3 className="text-center mb-4 text-primary">Sign In</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          <button type="submit" className="btn btn-primary w-100">Sign In</button>
        </form>
        <div className="mt-3 text-center">
          <a href="/signup" className="text-decoration-none text-primary">Don't have an account? Sign Up</a>
          <br />
          <a href="#" className="text-decoration-none text-primary" onClick={() => setIsForgotPassword(true)}>
            Forgot Password?
          </a>
        </div>
      </div>

      {/* Forgot Password Popup */}
      {isForgotPassword && (
        <div className="popup">
          <div className="popup-inner">
            <h4>Enter your email</h4>
            <input
              type="email"
              className="form-control"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Email"
            />
            <button className="btn btn-primary" onClick={handleForgotPassword}>Send OTP</button>
            {contactError && <div className="alert alert-danger" role="alert">{contactError}</div>}

            {/* OTP Verification */}
            {generatedOtp && (
              <>
                <input
                  type="text"
                  className="form-control"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                />
                <button className="btn btn-primary" onClick={handleVerifyOtp}>Verify OTP</button>
                {otpError && <div className="alert alert-danger" role="alert">{otpError}</div>}
              </>
            )}

            {/* New Password and Confirm Password (only after OTP verification) */}
            {isOtpVerified && (
              <>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {passwordError && <div className="alert alert-danger" role="alert">{passwordError}</div>}
                <button className="btn btn-primary" onClick={handlePasswordChange}>Reset Password</button>
              </>
            )}

            <button className="btn btn-secondary" onClick={() => setIsForgotPassword(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
