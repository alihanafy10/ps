const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const ownerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'OWNER') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an OWNER' });
  }
};

const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as SUPER_ADMIN' });
  }
};

const checkSubscription = async (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }
  
  const now = new Date();
  
  let targetUser = req.user;
  
  // If user is STAFF, we must check the OWNER's subscription
  if (req.user.role === 'STAFF') {
    const owner = await User.findOne({ loungeId: req.user.loungeId, role: 'OWNER' });
    if (!owner) {
      return res.status(403).json({ message: 'Owner not found for this lounge' });
    }
    targetUser = owner;
  }
  
  if (targetUser.subscriptionEndsAt && new Date(targetUser.subscriptionEndsAt) < now) {
    if (targetUser.subscriptionActive) {
      targetUser.subscriptionActive = false;
      await targetUser.save();
    }
    return res.status(402).json({ message: 'Subscription Expired. Please contact support via WhatsApp to reactivate.' });
  }
  
  if (targetUser.subscriptionEndsAt && new Date(targetUser.subscriptionEndsAt) >= now && !targetUser.subscriptionActive) {
    targetUser.subscriptionActive = true;
    await targetUser.save();
  }
  
  next();
};

module.exports = { protect, ownerOnly, superAdminOnly, checkSubscription };
