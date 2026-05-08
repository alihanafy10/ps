const express = require('express');
const router = express.Router();
const {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
} = require('../controllers/deviceController');
const { protect, ownerOnly, checkSubscription } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, checkSubscription, getDevices)
  .post(protect, ownerOnly, checkSubscription, createDevice);

router.route('/:id')
  .put(protect, ownerOnly, checkSubscription, updateDevice)
  .delete(protect, ownerOnly, checkSubscription, deleteDevice);

module.exports = router;
