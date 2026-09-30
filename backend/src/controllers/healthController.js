const os = require('os');

function getHealth(req, res) {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Virtual Movie Streamer API',
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      cpuCount: os.cpus().length
    }
  });
}

module.exports = {
  getHealth
};
