const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);

// ✅ Enable CORS for local + deployed frontend
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://virtual-movie-streamer.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
});

// Store room users (for name display & host logic)
const rooms = {};

io.on('connection', (socket) => {
  console.log(`🔌 Connected: ${socket.id}`);

  // JOIN ROOM
  socket.on('join-room', ({ roomId, username }) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ id: socket.id, name: username });
    io.to(roomId).emit('room-users', rooms[roomId]);
  });

  // CHAT
  socket.on('send-message', ({ roomId, message }) => {
    socket.to(roomId).emit('receive-message', message);
  });

  // VIDEO SYNC EVENTS
  socket.on('video-state', ({ roomId, state }) => {
    socket.to(roomId).emit('video-state', state);
  });

  // WEBRTC: JOIN
  socket.on('join-video-room', (roomId) => {
    socket.join(roomId);

    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    const otherUsers = usersInRoom.filter(id => id !== socket.id);

    socket.emit('all-users', otherUsers);
    socket.to(roomId).emit('user-joined', {
      signal: null,
      callerID: socket.id,
    });
  });

  socket.on('send-signal', ({ userToSignal, signal }) => {
    io.to(userToSignal).emit('receive-signal', { signal, from: socket.id });
  });

  socket.on('return-signal', ({ to, signal }) => {
    io.to(to).emit('signal-accepted', { signal, from: socket.id });
  });

  // HOST: Mute All
  socket.on('mute-all', ({ roomId }) => {
    io.to(roomId).emit('force-mute');
  });

  // HOST: Mute Individual User
  socket.on('mute-user', ({ targetId }) => {
    io.to(targetId).emit('force-mute-user');
  });

  // HOST: End Room
  socket.on('end-room', ({ roomId }) => {
    io.to(roomId).emit('room-ended');
    io.in(roomId).socketsLeave(roomId);
    delete rooms[roomId];
  });

  // CLEANUP ON DISCONNECT
  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(user => user.id !== socket.id);
      io.to(roomId).emit('room-users', rooms[roomId]);
    }
    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

// ✅ Use dynamic port from Render or fallback to 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
