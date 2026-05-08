const express = require('express');
const router = express.Router();
const { getOwnerSummary, getShiftsLog, getShiftDetails } = require('../controllers/reportController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

router.get('/owner-summary', protect, checkSubscription, getOwnerSummary);
router.get('/shifts-log', protect, checkSubscription, getShiftsLog);
router.get('/shift-details/:shiftId', protect, checkSubscription, getShiftDetails);

module.exports = router;
