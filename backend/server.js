const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const config = require('./src/config');
const initializeSockets = require('./src/sockets');
const logger = require('./src/utils/logger');

const server = http.createServer(app);

// Socket.IO with production-tuned transport and ping intervals
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 30000,
  pingInterval: 15000,
  transports: ['websocket', 'polling']
});

// Initialize socket handlers
initializeSockets(io);

// Server startup
server.listen(config.PORT, () => {
  logger.info(`==================================================`);
  logger.info(`🎬 Virtual Movie Streamer Backend Server Ready!`);
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
