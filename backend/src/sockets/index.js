const registerRoomHandlers = require('./roomHandler');
const registerVideoHandlers = require('./videoHandler');
const registerWebRTCHandlers = require('./webrtcHandler');
const registerChatHandlers = require('./chatHandler');

function initializeSockets(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Register all domain-specific handlers
    registerRoomHandlers(io, socket);
    registerVideoHandlers(io, socket);
    registerWebRTCHandlers(io, socket);
    registerChatHandlers(io, socket);
  });
}

module.exports = initializeSockets;
