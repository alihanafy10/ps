const Device = require('../models/Device');

// @desc    Get all devices for a lounge
// @route   GET /api/devices
// @access  Private (OWNER & STAFF)
const getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ loungeId: req.user.loungeId });
    res.status(200).json(devices);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching devices' });
  }
};

// @desc    Create a new device
// @route   POST /api/devices
// @access  Private (OWNER only)
const createDevice = async (req, res) => {
  const { name, type, priceSingle, priceMulti } = req.body;

  if (!name || !type || !priceSingle || !priceMulti) {
    return res.status(400).json({ message: 'Please add all required fields' });
  }

  try {
    const device = await Device.create({
      name,
      type,
      priceSingle,
      priceMulti,
      loungeId: req.user.loungeId, // Extracted from token
    });
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating device' });
  }
};

// @desc    Update a device
// @route   PUT /api/devices/:id
// @access  Private (OWNER only)
const updateDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Ensure the device belongs to the user's lounge
    if (device.loungeId.toString() !== req.user.loungeId.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedDevice = await Device.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updatedDevice);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating device' });
  }
};

// @desc    Delete a device
// @route   DELETE /api/devices/:id
// @access  Private (OWNER only)
const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Ensure the device belongs to the user's lounge
    if (device.loungeId.toString() !== req.user.loungeId.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await device.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting device' });
  }
};

module.exports = {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
};
