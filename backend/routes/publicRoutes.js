const express = require('express');
const router = express.Router();
const { getPublicMenu, placeOrder, getDeviceInfo } = require('../controllers/publicController');

router.get('/menu/:loungeId', getPublicMenu);
router.post('/order', placeOrder);
router.get('/device/:deviceId', getDeviceInfo);

module.exports = router;
