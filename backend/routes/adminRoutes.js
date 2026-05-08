const express = require('express');
const router = express.Router();
const { getLounges, extendSubscription } = require('../controllers/adminController');
const { protect, superAdminOnly } = require('../middleware/authMiddleware');

router.get('/lounges', protect, superAdminOnly, getLounges);
router.post('/extend-subscription', protect, superAdminOnly, extendSubscription);

module.exports = router;
