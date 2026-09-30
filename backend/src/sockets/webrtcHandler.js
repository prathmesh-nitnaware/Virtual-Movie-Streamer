const roomStore = require('../models/roomStore');

function registerWebRTCHandlers(io, socket) {
  // Join video mesh
  socket.on('join-video-room', ({ roomId, username }) => {
    if (!roomId) return;

    socket.join(`video-${roomId}`);
    roomStore.addVideoUser(roomId, socket.id);

    // Get all existing participants in the video room (excluding this socket)
    const existingVideoUsers = roomStore
      .getVideoUsers(roomId)
      .filter((id) => id !== socket.id);

    console.log(`📹 Video mesh join: ${socket.id} in [${roomId}]. Existing peers:`, existingVideoUsers);

    // Send list of current peers to the joining socket so it can initiate offers
    socket.emit('all-video-users', existingVideoUsers);

    // Tell all existing video users that a new peer has joined
    socket.to(`video-${roomId}`).emit('user-joined-video', {
      callerId: socket.id,
      username: username || socket.username
    });
  });

  // Relay WebRTC Offer
  socket.on('send-offer', ({ targetId, offer }) => {
    io.to(targetId).emit('receive-offer', {
      offer,
      callerId: socket.id,
      username: socket.username
    });
  });

  // Relay WebRTC Answer
  socket.on('send-answer', ({ targetId, answer }) => {
    io.to(targetId).emit('receive-answer', {
      answer,
      callerId: socket.id
    });
  });

  // Relay ICE Candidate
  socket.on('send-ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('receive-ice-candidate', {
      candidate,
      fromId: socket.id
    });
  });

  // Leave video mesh
  socket.on('leave-video-room', ({ roomId }) => {
    if (!roomId) return;
    socket.leave(`video-${roomId}`);
    roomStore.removeVideoUser(roomId, socket.id);
    socket.to(`video-${roomId}`).emit('user-left-video', { peerId: socket.id });
  });
}

module.exports = registerWebRTCHandlers;
