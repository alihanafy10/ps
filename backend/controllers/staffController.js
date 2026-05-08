const User = require('../models/User');

// @desc    Create new staff account
// @route   POST /api/staff
// @access  Private (OWNER only)
const createStaff = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create staff user, associating with owner's loungeId
    const staff = await User.create({
      name,
      email,
      password,
      role: 'STAFF',
      loungeId: req.user.loungeId,
    });

    if (staff) {
      res.status(201).json({
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        loungeId: staff.loungeId,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating staff' });
  }
};

// @desc    Get all staff for the lounge
// @route   GET /api/staff
// @access  Private (OWNER only)
const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ loungeId: req.user.loungeId, role: 'STAFF' }).select('-password');
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching staff' });
  }
};

// @desc    Update staff account
// @route   PUT /api/staff/:id
// @access  Private (OWNER only)
const updateStaff = async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, loungeId: req.user.loungeId, role: 'STAFF' });
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    staff.name = req.body.name || staff.name;
    staff.email = req.body.email || staff.email;

    if (req.body.password) {
      staff.password = req.body.password;
    }

    const updatedStaff = await staff.save();
    
    res.status(200).json({
      _id: updatedStaff._id,
      name: updatedStaff.name,
      email: updatedStaff.email,
      role: updatedStaff.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating staff' });
  }
};

// @desc    Delete staff account
// @route   DELETE /api/staff/:id
// @access  Private (OWNER only)
const deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, loungeId: req.user.loungeId, role: 'STAFF' });
    
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    await User.deleteOne({ _id: staff._id });
    res.status(200).json({ id: req.params.id, message: 'Staff deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting staff' });
  }
};

module.exports = {
  createStaff,
  getStaff,
  updateStaff,
  deleteStaff
};
