const express = require('express');
const router = express.Router();
const { createStaff, getStaff, updateStaff, deleteStaff } = require('../controllers/staffController');
const { protect, ownerOnly } = require('../middleware/authMiddleware');

router.post('/', protect, ownerOnly, createStaff);
router.get('/', protect, ownerOnly, getStaff);
router.put('/:id', protect, ownerOnly, updateStaff);
router.delete('/:id', protect, ownerOnly, deleteStaff);

module.exports = router;
