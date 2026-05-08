const express = require('express');
const router = express.Router();
const { startShift, endShift, getActiveShift } = require('../controllers/shiftController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

router.post('/start', protect, checkSubscription, startShift);
router.post('/end', protect, checkSubscription, endShift);
router.get('/active', protect, checkSubscription, getActiveShift);

module.exports = router;
