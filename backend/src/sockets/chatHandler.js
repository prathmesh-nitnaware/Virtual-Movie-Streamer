const roomStore = require('../models/roomStore');

// In-memory rate limiter tracker per socket
const messageTimestamps = new Map();
const reactionTimestamps = new Map();

function isRateLimited(map, socketId, maxPerWindow, windowMs) {
  const now = Date.now();
  let timestamps = map.get(socketId) || [];
  timestamps = timestamps.filter((t) => now - t < windowMs);
  if (timestamps.length >= maxPerWindow) {
    map.set(socketId, timestamps);
    return true;
  }
  timestamps.push(now);
  map.set(socketId, timestamps);
  return false;
}

function registerChatHandlers(io, socket) {
  // Send chat message
  socket.on('send-message', ({ roomId, text }) => {
    if (!roomId || typeof roomId !== 'string') return;
    if (!text || typeof text !== 'string' || !text.trim()) return;

    // Rate limit: max 6 messages per 2 seconds
    if (isRateLimited(messageTimestamps, socket.id, 6, 2000)) {
      return socket.emit('error-msg', 'You are sending messages too quickly. Please slow down.');
    }

    // Limit maximum message length to 500 characters
    const sanitizedText = text.trim().slice(0, 500);

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId: socket.id,
      sender: (socket.username || 'Anonymous').slice(0, 32),
      text: sanitizedText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHost: roomStore.isHost(roomId, socket.id)
    };

    roomStore.addChatMessage(roomId, message);
    io.to(roomId).emit('receive-message', message);
  });

  // Floating Cinema Emoji Reaction (e.g. 🍿, ❤️, 🔥, 😂, 👏, 🚀)
  socket.on('send-reaction', ({ roomId, emoji }) => {
    if (!roomId || typeof roomId !== 'string') return;
    if (!emoji || typeof emoji !== 'string') return;

    // Rate limit: max 4 reactions per 1.5 seconds
    if (isRateLimited(reactionTimestamps, socket.id, 4, 1500)) {
      return; // Silently drop excess spam reactions
    }

    // Sanitize emoji length (max 10 chars for single emoji + modifier)
    const cleanEmoji = emoji.slice(0, 10);

    const reaction = {
      id: `reaction-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      emoji: cleanEmoji,
      sender: (socket.username || 'Viewer').slice(0, 32),
      xOffset: Math.floor(Math.random() * 80) + 10 // 10% to 90% across the video screen
    };

    io.to(roomId).emit('new-reaction', reaction);
  });

  // Typing indicator
  socket.on('typing', ({ roomId, isTyping }) => {
    if (!roomId || typeof roomId !== 'string') return;
    socket.to(roomId).emit('user-typing', {
      userId: socket.id,
      username: (socket.username || 'Viewer').slice(0, 32),
      isTyping: Boolean(isTyping)
    });
  });

  // Cleanup rate limiter on disconnect
  socket.on('disconnect', () => {
    messageTimestamps.delete(socket.id);
    reactionTimestamps.delete(socket.id);
  });
}

module.exports = registerChatHandlers;

