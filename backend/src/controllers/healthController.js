const os = require('os');
const roomService = require('../services/roomService');

function getHealth(req, res) {
  const roomsSummary = roomService.getAllRoomsSummary();
  res.json({
    status: 'ok',
    service: 'WatchVerse Backend API',
    tagline: 'Watch together. Anywhere.',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    activeRooms: roomsSummary.length,
    activeUsers: roomsSummary.reduce((acc, r) => acc + (r.viewerCount || 0), 0),
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  getHealth
};
