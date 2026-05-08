const express = require('express');
const router = express.Router();
const { registerOwner, loginUser, updateProfile, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerOwner);
router.post('/login', loginUser);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
