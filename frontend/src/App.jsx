import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Signup from './components/Signup';
import Signin from './components/Signin';
import AuctioneerDashboard from './components/AuctioneerDashboard';
import BidderDashboard from './components/BidderDashboard';
import PostAuction from './components/PostAuction'; 
import WelcomePage from './components/WelcomePage';
import LoggedinHomepage from './components/LoggedinHomepage';
import ProfilePage from './components/ProfilePage'; 
import ViewAuction from './components/ViewAuction';
import EndAuction from './components/EndAuction'; // Import the EndAuction component

const ProtectedRoute = ({ element, isAuthenticated }) => {
  return isAuthenticated ? element : <Navigate to="/signin" />;
};

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'; 
  const userRole = localStorage.getItem('userRole'); 

  const isWelcomePage = location.pathname === '/';

  // Redirect user based on their role when they try to access "/dashboard"
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/dashboard') {
      if (userRole === 'auctioneer') {
        navigate('/auctioneer-dashboard');
      } else if (userRole === 'bidder') {
        navigate('/bidder-dashboard');
      }
    }
  }, [isAuthenticated, location.pathname, navigate, userRole]);

  return (
    <>
      {/* Navbar is visible for all pages except Sign In, Sign Up, and Welcome */}
      {!isWelcomePage && !location.pathname.includes("/signin") && !location.pathname.includes("/signup") && <Navbar />}

      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />

        {/* Protect Dashboard routes: Only accessible if authenticated */}
        <Route
          path="/auctioneer-dashboard"
          element={
            <ProtectedRoute
              element={<AuctioneerDashboard />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/view-auction/:auctionId"
          element={
            <ProtectedRoute
              element={<ViewAuction />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/end-auction/:auctionId" // New route to end auction
          element={
            <ProtectedRoute
              element={<EndAuction />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/bidder-dashboard"
          element={
            <ProtectedRoute
              element={<BidderDashboard />}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        <Route
          path="/post-auction"
          element={<ProtectedRoute element={<PostAuction />} isAuthenticated={isAuthenticated} />}
        />
        <Route
          path="/home"
          element={<LoggedinHomepage />}
        />
        
        {/* Add Profile route */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute
              element={<ProfilePage />}
              isAuthenticated={isAuthenticated}
            />
          }
        />

        {/* Handle unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default App;
