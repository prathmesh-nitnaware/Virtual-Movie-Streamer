const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const config = require('./src/config');
const initializeSockets = require('./src/sockets');
const logger = require('./src/utils/logger');

const server = http.createServer(app);

// Socket.IO with production-tuned transport, origin validation, and ping intervals
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, internal container health checks)
      if (!origin) return callback(null, true);

      const isAllowed = config.CLIENT_ORIGINS.some((allowed) => {
        if (allowed === '*') return true;
        // Match exact or protocol-agnostic origin
        return origin === allowed || origin.replace(/^https?:\/\//, '') === allowed.replace(/^https?:\/\//, '');
      });

      if (isAllowed || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Origin not allowed by Socket.IO'));
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 15000,
  transports: ['websocket', 'polling']
});

// Optional Redis pub/sub clustering for horizontal multi-container scaling
if (process.env.REDIS_URL || process.env.REDIS_HOST) {
  try {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const { createClient } = require('redis');
    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info(`⚡ Redis Pub/Sub Adapter connected: ${redisUrl}`);
    }).catch((err) => {
      logger.warn(`⚠️ Redis connection failed (${err.message}). Using in-memory adapter fallback.`);
    });
  } catch (err) {
    logger.info('ℹ️ Redis adapter optional dependencies not loaded. Running with high-performance in-memory room store.');
  }
} else {
  logger.info('ℹ️ Running in standalone mode with high-performance in-memory room store.');
}

// Initialize socket handlers
initializeSockets(io);

// Server startup
server.listen(config.PORT, () => {
  logger.info(`==================================================`);
  logger.info(`🎬 WatchVerse Backend Server Ready!`);
  logger.info(`🚀 Listening on Port: ${config.PORT}`);
  logger.info(`🌐 Allowed Origins: ${config.CLIENT_ORIGINS.join(', ')}`);
  logger.info(`==================================================`);
});

// Graceful termination handling
const shutdown = (signal) => {
  logger.info(`${signal} received: closing HTTP and WebSocket server...`);
  io.close(() => {
    logger.info('Socket.IO connections closed.');
    server.close(() => {
      logger.info('HTTP server terminated.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, server, io };
