const Lounge = require('../models/Lounge');
const User = require('../models/User');

// @desc    Search active lounges by name or area
// @route   GET /api/lounges/search
// @access  Public
const searchLounges = async (req, res) => {
  const { query } = req.query;

  try {
    // Find owners whose subscription is still active
    const activeOwners = await User.find({
      role: 'OWNER',
      subscriptionEndsAt: { $gt: new Date() }
    }).select('_id');

    const activeOwnerIds = activeOwners.map(owner => owner._id);

    // Build search query
    let searchQuery = { ownerId: { $in: activeOwnerIds } };
    
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { area: { $regex: query, $options: 'i' } }
      ];
    }

    const lounges = await Lounge.find(searchQuery).select('name area');
    
    res.status(200).json(lounges);
  } catch (error) {
    res.status(500).json({ message: 'Server error searching lounges' });
  }
};

const Device = require('../models/Device');
const Session = require('../models/Session');

// @desc    Get public status of devices in a lounge
// @route   GET /api/lounges/:loungeId/status
// @access  Public
const getLoungeStatus = async (req, res) => {
  try {
    const { loungeId } = req.params;

    const lounge = await Lounge.findById(loungeId).select('name area');
    if (!lounge) {
      return res.status(404).json({ message: 'Lounge not found' });
    }

    const devices = await Device.find({ loungeId }).select('name type');
    const activeSessions = await Session.find({ loungeId, status: 'Active' }).select('deviceId');

    const activeDeviceIds = activeSessions.map(s => s.deviceId.toString());

    const devicesStatus = devices.map(device => {
      return {
        _id: device._id,
        name: device.name,
        type: device.type,
        isAvailable: !activeDeviceIds.includes(device._id.toString())
      };
    });

    res.status(200).json({
      loungeName: lounge.name,
      area: lounge.area,
      devices: devicesStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching lounge status' });
  }
};

module.exports = { searchLounges, getLoungeStatus };
