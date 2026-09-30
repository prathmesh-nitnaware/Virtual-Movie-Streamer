const roomStore = require('../models/roomStore');

function registerRoomHandlers(io, socket) {
  // Join a room with username & optional avatar
  socket.on('join-room', ({ roomId, username, avatar }) => {
    if (!roomId) return;

    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username || `User-${socket.id.slice(0, 4)}`;

    const room = roomStore.getOrCreateRoom(roomId, socket.id, socket.username);
    const addedUser = roomStore.addUserToRoom(roomId, {
      id: socket.id,
      name: socket.username,
      avatar
    });

    console.log(`👤 User joined [${roomId}]: ${socket.username} (${socket.id}) - Host: ${room.hostId === socket.id}`);

    // Compute live video playback timestamp for late joiner
    const currentVideoTime = roomStore.getCalculatedCurrentTime(room.videoState);

    // Send complete initial room state to the newly joined client
    socket.emit('room-state', {
      roomId,
      hostId: room.hostId,
      hostName: room.hostName,
      isHost: room.hostId === socket.id,
      users: room.users,
      videoState: {
        ...room.videoState,
        currentTime: currentVideoTime
      },
      chatHistory: room.chatHistory
    });

    // Notify others in room
    socket.to(roomId).emit('user-joined-room', {
      user: addedUser,
      users: room.users
    });

    // Emit system chat message
    const sysMsg = {
      id: `sys-${Date.now()}-${Math.random()}`,
      sender: 'System',
      isSystem: true,
      text: `${socket.username} joined the theater.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    roomStore.addChatMessage(roomId, sysMsg);
    io.to(roomId).emit('receive-message', sysMsg);

    // Send updated user list
    io.to(roomId).emit('room-users', room.users);
  });

  // Host: Mute All Non-Host Participants
  socket.on('mute-all', ({ roomId }) => {
    if (!roomStore.isHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the room host can mute all participants.');
    }
    socket.to(roomId).emit('force-mute');

    const sysMsg = {
      id: `sys-${Date.now()}`,
      sender: 'System',
      isSystem: true,
      text: `Host muted all participants.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    roomStore.addChatMessage(roomId, sysMsg);
    io.to(roomId).emit('receive-message', sysMsg);
  });

  // Host: Mute Specific User
  socket.on('mute-user', ({ roomId, targetId }) => {
    if (!roomStore.isHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the room host can mute participants.');
    }
    io.to(targetId).emit('force-mute-user');
  });

  // Host: Transfer Host Role
  socket.on('transfer-host', ({ roomId, targetId }) => {
    if (!roomStore.isHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the current host can transfer host privileges.');
    }
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    const targetUser = room.users.find((u) => u.id === targetId);
    if (!targetUser) return;

    room.users.forEach((u) => {
      u.isHost = u.id === targetId;
    });
    room.hostId = targetId;
    room.hostName = targetUser.name;

    io.to(roomId).emit('host-changed', {
      newHostId: targetId,
      newHostName: targetUser.name,
      users: room.users
    });

    const sysMsg = {
      id: `sys-${Date.now()}`,
      sender: 'System',
      isSystem: true,
      text: `👑 Host transferred to ${targetUser.name}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    roomStore.addChatMessage(roomId, sysMsg);
    io.to(roomId).emit('receive-message', sysMsg);
  });

  // Host: End Room
  socket.on('end-room', ({ roomId }) => {
    if (!roomStore.isHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the host can end the room.');
    }

    io.to(roomId).emit('room-ended', { reason: 'Host has closed the theater session.' });
    io.in(roomId).socketsLeave(roomId);
    roomStore.deleteRoom(roomId);
    console.log(`🛑 Room ended: ${roomId}`);
  });

  // Client updates mic/camera status (for UI badges)
  socket.on('media-status-change', ({ roomId, micMuted, camMuted }) => {
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    const user = room.users.find((u) => u.id === socket.id);
    if (user) {
      if (typeof micMuted === 'boolean') user.micMuted = micMuted;
      if (typeof camMuted === 'boolean') user.camMuted = camMuted;
      socket.to(roomId).emit('user-media-status', {
        userId: socket.id,
        micMuted: user.micMuted,
        camMuted: user.camMuted
      });
    }
  });

  // Cleanup on disconnect
  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (!roomId) return;

    const result = roomStore.removeUserFromRoom(roomId, socket.id);
    if (!result) return;

    if (result.roomEmpty) {
      console.log(`🧹 Room empty & cleaned up: ${roomId}`);
      return;
    }

    const { departingUser, newHost, remainingUsers } = result;
    const name = departingUser ? departingUser.name : 'A participant';

    // Broadcast updated users
    io.to(roomId).emit('room-users', remainingUsers);
    io.to(roomId).emit('user-left-room', { userId: socket.id, name });

    // WebRTC cleanup notification
    socket.to(roomId).emit('peer-disconnected', { peerId: socket.id });

    // If host changed, broadcast update
    if (newHost) {
      io.to(roomId).emit('host-changed', {
        newHostId: newHost.id,
        newHostName: newHost.name,
        users: remainingUsers
      });

      const hostMsg = {
        id: `sys-${Date.now()}-host`,
        sender: 'System',
        isSystem: true,
        text: `👑 ${newHost.name} is now the host.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      roomStore.addChatMessage(roomId, hostMsg);
      io.to(roomId).emit('receive-message', hostMsg);
    }

    const leaveMsg = {
      id: `sys-${Date.now()}-left`,
      sender: 'System',
      isSystem: true,
      text: `${name} left the theater.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    roomStore.addChatMessage(roomId, leaveMsg);
    io.to(roomId).emit('receive-message', leaveMsg);

    console.log(`❌ Disconnected: ${socket.id} from [${roomId}]`);
  });
}

module.exports = registerRoomHandlers;
