const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  socket.on('join-room', ({ roomId, username }) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ id: socket.id, name: username });
    io.to(roomId).emit('room-users', rooms[roomId]);
  });

  socket.on('send-message', ({ roomId, message }) => {
    socket.to(roomId).emit('receive-message', message);
  });

  socket.on('video-state', ({ roomId, state }) => {
    socket.to(roomId).emit('video-state', state);
  });

  socket.on('join-video-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('send-signal', ({ userToSignal, signal }) => {
    io.to(userToSignal).emit('receive-signal', { signal, from: socket.id });
  });

  socket.on('return-signal', ({ to, signal }) => {
    io.to(to).emit('signal-accepted', { signal, from: socket.id });
  });

  // Host controls
  socket.on('mute-all', ({ roomId }) => {
    io.to(roomId).emit('force-mute');
  });

  socket.on('mute-user', ({ targetId }) => {
    io.to(targetId).emit('force-mute-user');
  });

  socket.on('end-room', ({ roomId }) => {
    io.to(roomId).emit('room-ended');
    io.in(roomId).socketsLeave(roomId);
    delete rooms[roomId];
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(user => user.id !== socket.id);
      io.to(roomId).emit('room-users', rooms[roomId]);
    }
    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});
