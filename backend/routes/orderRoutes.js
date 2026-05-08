const express = require('express');
const router = express.Router();
const { createOrder, getShiftOrders, getPendingOrders, confirmPendingOrder, cancelPendingOrder } = require('../controllers/orderController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

router.post('/', protect, checkSubscription, createOrder);
router.get('/shift', protect, checkSubscription, getShiftOrders);
router.get('/pending', protect, checkSubscription, getPendingOrders);
router.patch('/pending/:id/confirm', protect, checkSubscription, confirmPendingOrder);
router.patch('/pending/:id/cancel', protect, checkSubscription, cancelPendingOrder);

module.exports = router;
