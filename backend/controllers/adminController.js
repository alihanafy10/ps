const User = require('../models/User');
const Lounge = require('../models/Lounge');

// @desc    Get all lounges and owners
// @route   GET /api/admin/lounges
// @access  Private (SUPER_ADMIN)
const getLounges = async (req, res) => {
  try {
    const lounges = await Lounge.find().populate('ownerId', 'name email subscriptionEndsAt');
    res.status(200).json(lounges);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching lounges' });
  }
};

// @desc    Extend subscription for an owner
// @route   POST /api/admin/extend-subscription
// @access  Private (SUPER_ADMIN)
const extendSubscription = async (req, res) => {
  const { userId, daysToAdd } = req.body;

  if (!userId || !daysToAdd) {
    return res.status(400).json({ message: 'Please provide userId and daysToAdd' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let currentEnd = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : new Date();
    // If subscription already expired long ago, start from today
    if (currentEnd < new Date()) {
      currentEnd = new Date();
    }

    currentEnd.setDate(currentEnd.getDate() + parseInt(daysToAdd));
    user.subscriptionEndsAt = currentEnd;
    user.subscriptionActive = true; // Ensure it is active
    await user.save();

    res.status(200).json({ message: `Subscription extended by ${daysToAdd} days`, subscriptionEndsAt: user.subscriptionEndsAt });
  } catch (error) {
    res.status(500).json({ message: 'Server error extending subscription' });
  }
};

module.exports = { getLounges, extendSubscription };
