const Shift = require('../models/Shift');
const Session = require('../models/Session');
const Order = require('../models/Order');

// @desc    Start a new shift
// @route   POST /api/shifts/start
// @access  Private (OWNER & STAFF)
const startShift = async (req, res) => {
  const { startingCash } = req.body;

  try {
    // Check if there's already an open shift for this lounge
    const existingShift = await Shift.findOne({
      loungeId: req.user.loungeId,
      status: 'Open',
    });

    if (existingShift) {
      return res.status(400).json({ message: 'Shift is already active. Please ask the previous staff to End their shift first.' });
    }

    const shift = await Shift.create({
      staffId: req.user._id,
      loungeId: req.user.loungeId,
      startingCash: startingCash || 0,
    });

    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ message: 'Server error starting shift' });
  }
};

// @desc    End the active shift
// @route   POST /api/shifts/end
// @access  Private (OWNER & STAFF)
const endShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({
      loungeId: req.user.loungeId,
      status: 'Open',
    });

    if (!shift) {
      return res.status(404).json({ message: 'No active shift found' });
    }

    shift.endTime = Date.now();
    shift.status = 'Closed';
    await shift.save();

    res.status(200).json(shift);
  } catch (error) {
    res.status(500).json({ message: 'Server error ending shift' });
  }
};

// @desc    Get active shift
// @route   GET /api/shifts/active
// @access  Private (OWNER & STAFF)
const getActiveShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({
      loungeId: req.user.loungeId,
      status: 'Open',
    }).populate('staffId', 'name');

    if (!shift) {
      return res.status(200).json(null);
    }

    res.status(200).json(shift);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching active shift' });
  }
};

module.exports = {
  startShift,
  endShift,
  getActiveShift,
};
