const express = require('express');
const router = express.Router();
const {
  startSession,
  addOrderToSession,
  stopSession,
  convertSessionToOpen,
  switchSessionMode,
  getActiveSessions,
  getPublicSessionByDevice,
} = require('../controllers/sessionController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

router.post('/start', protect, checkSubscription, startSession);
router.post('/order', protect, checkSubscription, addOrderToSession);
router.post('/stop', protect, checkSubscription, stopSession);
router.post('/convert-to-open', protect, checkSubscription, convertSessionToOpen);
router.patch('/switch/:sessionId', protect, checkSubscription, switchSessionMode);
router.get('/active', protect, checkSubscription, getActiveSessions);

router.get('/public/device/:deviceId', getPublicSessionByDevice);

module.exports = router;
