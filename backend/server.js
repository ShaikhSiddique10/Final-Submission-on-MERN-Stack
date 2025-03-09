const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Set up static file serving for images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store images in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Save with a unique name
  },
});

const upload = multer({ storage });

// MongoDB Connection
mongoose.connect('mongodb://0.0.0.0:27017/auctionDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// User Schema Definition
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contact: { type: String, required: true, unique: true },
  role: { type: String, required: true, enum: ['auctioneer', 'bidder'], default: 'bidder' },
  photo: { type: String },  // Store the path to the user's photo
  otp: { type: String },  // Store OTP temporarily for verification
  username: { type: String },
  address: { type: String },
});

const User = mongoose.model('User', userSchema);

// Auction Schema Definition (Using auctionitems collection)
const auctionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  startPrice: { type: Number, required: true },
  auctionDate: { type: Date, required: true },
  auctioneerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // auctioneerId
  photo: { type: String },  // Store the path to the auction photo
  currentBid: { type: Number, default: 0 },  // Track the highest bid
  status: { type: String, enum: ['Active', 'Ended'], default: 'Active' },  // Auction status
});

const AuctionItem = mongoose.model('auctionitems', auctionSchema); // Using the 'auctionitems' collection

// Helper function to generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, 'secret_key', { expiresIn: '1h' });
};

// Middleware to verify JWT Token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from Authorization header

  if (!token) {
    return res.status(401).json({ message: 'Access denied, no token provided' });
  }

  jwt.verify(token, 'secret_key', (err, user) => {  // Verify token using secret key
    if (err) {
      return res.status(403).json({ message: 'Invalid token' }); // Invalid token
    }
    req.user = user; // Attach user info to the request
    next(); // Proceed to the next middleware/route handler
  });
};

app.post('/end-auction/:auctionId', authenticateToken, async (req, res) => {
  const { auctionId } = req.params;
  const userId = req.user.userId;

  try {
    const auction = await AuctionItem.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.status === 'Ended') {
      return res.status(400).json({ message: 'Auction has already ended' });
    }

    if (auction.auctioneerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You are not authorized to end this auction' });
    }

    auction.status = 'Ended';
    await auction.save();

    res.status(200).json({ message: 'Auction ended successfully', auction });
  } catch (error) {
    console.error('Error ending auction:', error);
    res.status(500).json({ message: 'Error ending auction', error: error.message });
  }
});


// Sign-up Route
app.post('/signup', async (req, res) => {
  const { email, password, contact, role } = req.body;

  if (!email || !password || !contact) {
    return res.status(400).json({ message: 'Email, password, and contact number are required' });
  }

  try {
    const existingContact = await User.findOne({ contact });
    if (existingContact) {
      return res.status(400).json({ message: 'Contact number is already registered' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      contact,
      role,
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Sign-in Route
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid password' });

    const token = generateToken(user._id);
    res.status(200).json({ message: 'Signed in successfully', token, role: user.role });
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ message: 'Error signing in', error: error.message });
  }
});

// Forgot Password Route (with OTP directly in response)
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide your email address' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist' });
    }

    const otp = uuidv4().slice(0, 6); // Generate a 6-digit fake OTP
    user.otp = otp;
    await user.save();

    res.status(200).json({ message: 'OTP generated successfully', otp });
  } catch (error) {
    console.error('Error processing forgot password:', error);
    res.status(500).json({ message: 'Error processing forgot password', error: error.message });
  }
});

// Verify OTP Route and Allow Password Reset
app.post('/verify-otp', async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (!email || !otp || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Please provide email, OTP, new password, and confirm password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;

    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
});

// Profile route to get the user's profile data
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Route to update user profile
app.post('/update-profile', authenticateToken, async (req, res) => {
  const { username, address } = req.body;

  if (!username || !address) {
    return res.status(400).json({ message: 'Both username and address are required' });
  }

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.username = username;
    user.address = address;
    await user.save();

    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Route to upload profile photo
app.post('/update-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.photo = `/uploads/${req.file.filename}`; // Save the file path in the user's photo field
    await user.save();

    res.status(200).json({ message: 'Photo uploaded successfully', photo: user.photo });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ message: 'Error uploading photo', error: error.message });
  }
});

// Post Auction Route
app.post('/post-auction', authenticateToken, upload.single('image'), async (req, res) => {
  const { name, description, startPrice, auctionDate } = req.body;

  if (!name || !description || !startPrice || !auctionDate) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const auctionPhoto = req.file ? `/uploads/${req.file.filename}` : undefined;

    const newAuction = new AuctionItem({
      name,
      description,
      startPrice,
      auctionDate,
      auctioneerId: req.user.userId, // The auctioneer ID is obtained from the JWT token
      photo: auctionPhoto, // Store the path to the uploaded image
    });

    await newAuction.save();

    res.status(201).json({
      message: 'Auction posted successfully',
      auction: newAuction,
    });
  } catch (error) {
    console.error('Error posting auction:', error);
    res.status(500).json({
      message: 'An error occurred while posting the auction',
      error: error.message,
    });
  }
});

// Route to get all auctions
app.get('/auctions', async (req, res) => {
  try {
    const auctions = await AuctionItem.find();
    res.status(200).json(auctions);
  } catch (error) {
    console.error('Error fetching auctions:', error);
    res.status(500).json({ message: 'Error fetching auctions', error: error.message });
  }
});

// Route to get all auction items by user
app.get('/user-auctions', authenticateToken, async (req, res) => {
  try {
    const auctions = await AuctionItem.find({ auctioneerId: req.user.userId })
      .populate('auctioneerId', 'email username contact role');  // Populate auctioneer details
    res.status(200).json(auctions);  // Send populated auction items
  } catch (error) {
    console.error('Error fetching user auctions:', error);
    res.status(500).json({ message: 'Error fetching user auctions', error: error.message });
  }
});

// Route to view a specific auction
app.get('/auction/:id', async (req, res) => {
  const { id } = req.params;

  // Check if the provided ID is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid auction ID' });
  }

  try {
    // Find the auction and populate the auctioneer data
    const auction = await AuctionItem.findById(id)
      .populate('auctioneerId', 'email username contact role');  // Populate auctioneer details
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    res.status(200).json(auction);  // Return the populated auction data
  } catch (error) {
    console.error('Error fetching auction:', error);
    res.status(500).json({ message: 'Error fetching auction', error: error.message });
  }
});

// Route to place a bid on an auction (for bidders)
app.post('/bid/:auctionId', authenticateToken, async (req, res) => {
  const { auctionId } = req.params;
  const { bidAmount } = req.body;

  // Validate bid amount
  if (!bidAmount || bidAmount <= 0) {
    return res.status(400).json({ message: 'Bid amount must be greater than 0' });
  }

  try {
    const auction = await AuctionItem.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Ensure auction is active
    if (auction.status !== 'Active') {
      return res.status(400).json({ message: 'Auction is not active' });
    }

    // Ensure bid is higher than current highest bid
    if (bidAmount <= auction.currentBid) {
      return res.status(400).json({ message: 'Bid must be higher than the current highest bid' });
    }

    // Update the auction with the new bid
    auction.currentBid = bidAmount;
    await auction.save();

    res.status(200).json({
      message: 'Bid placed successfully',
      newBid: bidAmount,
      auction,
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ message: 'Error placing bid', error: error.message });
  }
});

// Route to place a bid on an auction (for bidders)
app.post('/place-bid/:auctionId', authenticateToken, async (req, res) => {
  const { auctionId } = req.params;  // Get auctionId from route parameters
  const { bidAmount } = req.body;  // Get bidAmount from request body
  const user = req.user;  // The authenticated user from the token (set by authenticateToken middleware)

  // Validate bid amount
  if (!bidAmount || bidAmount <= 0) {
    return res.status(400).json({ message: 'Bid amount must be greater than 0' });
  }

  try {
    const auction = await AuctionItem.findById(auctionId);  // Find auction by ID
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Ensure auction is active
    if (auction.status !== 'Active') {
      return res.status(400).json({ message: 'Auction is not active' });
    }

    // Ensure bid is higher than current highest bid
    if (bidAmount <= auction.currentBid) {
      return res.status(400).json({ message: 'Bid must be higher than the current highest bid' });
    }

    // Update the auction with the new bid
    auction.currentBid = bidAmount;
    await auction.save();

    res.status(200).json({
      message: 'Bid placed successfully',
      newBid: bidAmount,
      auction,
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ message: 'Error placing bid', error: error.message });
  }
});

// Sample backend endpoint for auctions
app.get('/auctions', async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate('highestBidder', 'username') // Assuming highestBidder is a reference to a User model
      .exec();
    res.json(auctions);
  } catch (err) {
    res.status(500).send({ message: 'Failed to fetch auctions', error: err });
  }
});

// Assuming Auction model and User model exist and user is authenticated
app.post('/place-bid/:auctionId', async (req, res) => {
  const { auctionId } = req.params;
  const { bidAmount } = req.body;
  const userId = req.user.id;  // Assuming user is authenticated and `req.user` contains the user data
  const username = req.user.username;  // Get username of the bidder

  try {
    // Find the auction by ID
    const auction = await Auction.findById(auctionId);

    if (!auction) {
      return res.status(404).send('Auction not found');
    }

    // Ensure bid amount is higher than the current bid
    if (bidAmount <= auction.currentBid) {
      return res.status(400).send('Bid amount must be higher than the current bid');
    }

    // Update the auction's current bid and highest bidder
    auction.currentBid = bidAmount;
    auction.highestBidder = { userId, username };  // Store the highest bidder's info

    // Save the updated auction
    await auction.save();

    // Emit the updated auction data to clients using WebSocket
    io.emit('bidUpdate', {
      auctionId,
      newBid: bidAmount,
      highestBidder: { userId, username },
    });

    res.status(200).send('Bid placed successfully');
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).send('Server error');
  }
});

// Route to place a bid on an auction (for bidders)
app.post('/place-bid/:auctionId', authenticateToken, async (req, res) => {
  const { auctionId } = req.params;
  const { bidAmount } = req.body;

  if (!bidAmount || bidAmount <= 0) {
    return res.status(400).json({ message: 'Bid amount must be greater than 0' });
  }

  try {
    const auction = await AuctionItem.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Ensure auction is active
    if (auction.status !== 'Active') {
      return res.status(400).json({ message: 'Auction is not active' });
    }

    // Ensure bid is higher than current highest bid
    if (bidAmount <= auction.currentBid) {
      return res.status(400).json({ message: 'Bid must be higher than the current highest bid' });
    }

    // Update the auction with the new bid and highest bidder
    auction.currentBid = bidAmount;
    auction.highestBidder = {
      userId: req.user.userId,
      username: req.user.username,
    };

    await auction.save();

    // Emit the updated auction data to clients using WebSocket
    io.emit('auctionUpdate', auction);

    res.status(200).json({
      message: 'Bid placed successfully',
      newBid: bidAmount,
      auction,
    });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ message: 'Error placing bid', error: error.message });
  }
});


app.listen(5000, () => console.log('Server running on port 5000'));
