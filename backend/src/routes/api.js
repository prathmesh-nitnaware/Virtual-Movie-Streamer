const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const roomController = require('../controllers/roomController');

// Health Check Endpoint
router.get('/health', healthController.getHealth);

// Room stats & diagnostics
router.get('/rooms', roomController.getRoomsStats);
router.get('/rooms/:roomId', roomController.getRoomDetails);

module.exports = router;
