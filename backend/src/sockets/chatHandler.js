const roomStore = require('../models/roomStore');

function registerChatHandlers(io, socket) {
  // Send chat message
  socket.on('send-message', ({ roomId, text }) => {
    if (!roomId || !text || !text.trim()) return;

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId: socket.id,
      sender: socket.username || 'Anonymous',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHost: roomStore.isHost(roomId, socket.id)
    };

    roomStore.addChatMessage(roomId, message);
    io.to(roomId).emit('receive-message', message);
  });

  // Floating Cinema Emoji Reaction (e.g. 🍿, ❤️, 🔥, 😂, 👏, 🚀)
  socket.on('send-reaction', ({ roomId, emoji }) => {
    if (!roomId || !emoji) return;

    const reaction = {
      id: `reaction-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      emoji,
      sender: socket.username,
      xOffset: Math.floor(Math.random() * 80) + 10 // 10% to 90% across the video screen
    };

    io.to(roomId).emit('new-reaction', reaction);
  });

  // Typing indicator
  socket.on('typing', ({ roomId, isTyping }) => {
    if (!roomId) return;
    socket.to(roomId).emit('user-typing', {
      userId: socket.id,
      username: socket.username,
      isTyping
    });
  });
}

module.exports = registerChatHandlers;
