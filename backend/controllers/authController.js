const User = require('../models/User');
const Lounge = require('../models/Lounge');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id, role, loungeId) => {
  return jwt.sign({ id, role, loungeId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new owner and lounge
// @route   POST /api/auth/register
// @access  Public
const registerOwner = async (req, res) => {
  const { name, email, password, loungeName } = req.body;

  if (!name || !email || !password || !loungeName) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate IDs beforehand to solve circular dependency
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId();
    const loungeId = new mongoose.Types.ObjectId();

    // Calculate 7 days trial
    const subscriptionEndsAt = new Date();
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 7);

    // Create user with predefined loungeId
    const user = await User.create({
      _id: userId,
      name,
      email,
      password,
      role: 'OWNER',
      loungeId: loungeId,
      subscriptionEndsAt,
    });

    if (user) {
      // Create Lounge with predefined ownerId
      const lounge = await Lounge.create({
        _id: loungeId,
        name: loungeName,
        ownerId: userId,
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        loungeId: user.loungeId,
        subscriptionEndsAt: user.subscriptionEndsAt,
        token: generateToken(user._id, user.role, user.loungeId),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const now = new Date();
      let subEndsAt = user.subscriptionEndsAt;
      let subActive = user.subscriptionActive;
      let ownerToUpdate = user;

      // If STAFF, fetch owner's subscription data
      if (user.role === 'STAFF') {
         const owner = await User.findOne({ loungeId: user.loungeId, role: 'OWNER' });
         if (owner) {
            subEndsAt = owner.subscriptionEndsAt;
            subActive = owner.subscriptionActive;
            ownerToUpdate = owner;
         }
      }

      // Sync subscriptionActive flag on login
      if (subEndsAt) {
        const isExpired = new Date(subEndsAt) < now;
        if (isExpired && subActive) {
          ownerToUpdate.subscriptionActive = false;
          await ownerToUpdate.save();
        } else if (!isExpired && !subActive) {
          ownerToUpdate.subscriptionActive = true;
          await ownerToUpdate.save();
        }
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        loungeId: user.loungeId,
        subscriptionEndsAt: subEndsAt,
        token: generateToken(user._id, user.role, user.loungeId),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id, updatedUser.role, updatedUser.loungeId),
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    if (req.body.password) {
      user.password = req.body.password;
    } else {
      return res.status(400).json({ message: 'Please provide a new password' });
    }

    await user.save();
    res.json({ message: 'Password updated successfully' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

module.exports = {
  registerOwner,
  loginUser,
  updateProfile,
  updatePassword,
};
