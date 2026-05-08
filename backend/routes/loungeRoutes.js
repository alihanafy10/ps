const express = require('express');
const router = express.Router();
const { searchLounges, getLoungeStatus } = require('../controllers/loungeController');

router.get('/search', searchLounges);
router.get('/:loungeId/status', getLoungeStatus);

module.exports = router;
