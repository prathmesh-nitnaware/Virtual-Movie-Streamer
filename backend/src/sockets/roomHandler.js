const roomStore = require('../models/roomStore');
const { ROLES } = require('../services/roomService');

function registerRoomHandlers(io, socket) {
  // Join or Create a room with username, optional avatar, password, and room name
  socket.on('join-room', ({ roomId, username, avatar, password, roomName, initialMovie }) => {
    if (!roomId || typeof roomId !== 'string' || roomId.trim().length === 0) {
      return socket.emit('join-error', { message: 'Invalid room identifier.' });
    }

    const cleanRoomId = roomId.trim().slice(0, 64);
    const cleanUsername = (typeof username === 'string' && username.trim())
      ? username.trim().slice(0, 32)
      : `User-${socket.id.slice(0, 4)}`;

    // Verify room access (password, lock status)
    const accessCheck = roomStore.verifyRoomAccess(cleanRoomId, password);
    if (!accessCheck.allowed) {
      return socket.emit('join-error', { message: accessCheck.reason });
    }

    socket.join(cleanRoomId);
    socket.roomId = cleanRoomId;
    socket.username = cleanUsername;

    const roomOptions = {
      name: roomName ? roomName.trim().slice(0, 50) : null,
      password: password ? password.trim() : null
    };

    if (initialMovie) {
      roomOptions.initialUrl = initialMovie.url;
      roomOptions.initialTitle = initialMovie.title;
      roomOptions.initialType = initialMovie.type;
      roomOptions.subtitleUrl = initialMovie.subtitleUrl;
    }

    const room = roomStore.getOrCreateRoom(cleanRoomId, socket.id, socket.username, roomOptions);
    const addedUser = roomStore.addUserToRoom(cleanRoomId, {
      id: socket.id,
      name: socket.username,
      avatar: typeof avatar === 'string' ? avatar.slice(0, 500) : null
    });

    console.log(`👤 User joined [${cleanRoomId}]: ${socket.username} (${socket.id}) - Role: ${addedUser.role}`);

    // Compute live video playback timestamp for late joiner
    const currentVideoTime = roomStore.getCalculatedCurrentTime(room.videoState);

    // Send complete initial room state to the newly joined client
    socket.emit('room-state', {
      roomId: cleanRoomId,
      roomName: room.name,
      hostId: room.hostId,
      hostName: room.hostName,
      userRole: addedUser.role,
      isHost: room.hostId === socket.id,
      isLocked: Boolean(room.isLocked),
      hasPassword: Boolean(room.password),
      users: room.users,
      stateVersion: room.stateVersion || 1,
      videoState: {
        ...room.videoState,
        currentTime: currentVideoTime,
        stateVersion: room.stateVersion || 1
      },
      chatHistory: room.chatHistory
    });

    // Notify others in room
    socket.to(cleanRoomId).emit('user-joined-room', {
      user: addedUser,
      users: room.users
    });

    // Emit system chat message
    const sysMsg = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'System',
      isSystem: true,
      text: `${socket.username} joined WatchVerse theater.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    roomStore.addChatMessage(cleanRoomId, sysMsg);
    io.to(cleanRoomId).emit('receive-message', sysMsg);

    // Send updated user list
    io.to(cleanRoomId).emit('room-users', room.users);
  });

  // Host: Mute All Non-Host Participants
  socket.on('mute-all', ({ roomId }) => {
    if (!roomId || typeof roomId !== 'string') return;
    if (!roomStore.isModeratorOrHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the room host or moderator can mute all participants.');
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

  // Host or Moderator: Mute Specific User
  socket.on('mute-user', ({ roomId, targetId }) => {
    if (!roomId || !targetId || typeof targetId !== 'string') return;
    if (!roomStore.isModeratorOrHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the room host or moderator can mute participants.');
    }
    io.to(targetId).emit('force-mute-user');
  });

  // Host or Moderator: Kick Participant
  socket.on('kick-user', ({ roomId, targetId }) => {
    if (!roomId || !targetId || typeof targetId !== 'string') return;
    if (!roomStore.isModeratorOrHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the room host or moderator can remove participants.');
    }
    const room = roomStore.getRoom(roomId);
    if (!room || room.hostId === targetId) {
      return socket.emit('error-msg', 'Cannot remove the room host.');
    }

    const kickedUser = room.users.find((u) => u.id === targetId);
    if (kickedUser) {
      io.to(targetId).emit('room-ended', { reason: 'You were removed from the room by moderation.' });
      io.in(targetId).socketsLeave(roomId);
      roomStore.removeUserFromRoom(roomId, targetId);

      io.to(roomId).emit('room-users', room.users);
      io.to(roomId).emit('user-left-room', { userId: targetId, name: kickedUser.name });
      io.to(roomId).emit('peer-disconnected', { peerId: targetId });

      const sysMsg = {
        id: `sys-${Date.now()}`,
        sender: 'System',
        isSystem: true,
        text: `🛡️ ${kickedUser.name} was removed by a moderator.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      roomStore.addChatMessage(roomId, sysMsg);
      io.to(roomId).emit('receive-message', sysMsg);
    }
  });

  // Host: Promote/Demote Moderator Role
  socket.on('set-role', ({ roomId, targetId, role }) => {
    if (!roomId || !targetId || !role) return;
    if (!roomStore.isHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the room host can change participant roles.');
    }
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    const updatedUser = roomStore.setUserRole(roomId, targetId, role);
    if (updatedUser) {
      io.to(roomId).emit('room-users', room.users);
      io.to(targetId).emit('role-updated', { role: updatedUser.role });

      const sysMsg = {
        id: `sys-${Date.now()}`,
        sender: 'System',
        isSystem: true,
        text: `🛡️ ${updatedUser.name} is now a ${updatedUser.role}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      roomStore.addChatMessage(roomId, sysMsg);
      io.to(roomId).emit('receive-message', sysMsg);
    }
  });

  // Host: Transfer Host Role
  socket.on('transfer-host', ({ roomId, targetId }) => {
    if (!roomId || !targetId || typeof targetId !== 'string') return;
    if (!roomStore.isHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the current host can transfer host privileges.');
    }
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    const targetUser = room.users.find((u) => u.id === targetId);
    if (!targetUser) return;

    room.users.forEach((u) => {
      u.role = u.id === targetId ? ROLES.HOST : u.role === ROLES.HOST ? ROLES.PARTICIPANT : u.role;
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

  // Host: Lock or Unlock Room
  socket.on('toggle-room-lock', ({ roomId }) => {
    if (!roomId || typeof roomId !== 'string') return;
    if (!roomStore.isHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the host can lock or unlock the room.');
    }
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    const isLocked = roomStore.setRoomLock(roomId, !room.isLocked);
    io.to(roomId).emit('room-lock-changed', { isLocked });

    const sysMsg = {
      id: `sys-${Date.now()}`,
      sender: 'System',
      isSystem: true,
      text: isLocked ? `🔒 Theater locked by host.` : `🔓 Theater unlocked.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    roomStore.addChatMessage(roomId, sysMsg);
    io.to(roomId).emit('receive-message', sysMsg);
  });

  // Host: End Room
  socket.on('end-room', ({ roomId }) => {
    if (!roomId || typeof roomId !== 'string') return;
    if (!roomStore.isHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the host can end the room.');
    }

    io.to(roomId).emit('room-ended', { reason: 'Host has closed the WatchVerse theater session.' });
    io.in(roomId).socketsLeave(roomId);
    roomStore.deleteRoom(roomId);
    console.log(`🛑 Room ended: ${roomId}`);
  });

  // Client updates mic/camera/screen status (for UI badges)
  socket.on('media-status-change', ({ roomId, micMuted, camMuted, screenSharing }) => {
    if (!roomId || typeof roomId !== 'string') return;
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    const user = room.users.find((u) => u.id === socket.id);
    if (user) {
      if (typeof micMuted === 'boolean') user.micMuted = micMuted;
      if (typeof camMuted === 'boolean') user.camMuted = camMuted;
      if (typeof screenSharing === 'boolean') user.screenSharing = screenSharing;
      socket.to(roomId).emit('user-media-status', {
        userId: socket.id,
        micMuted: user.micMuted,
        camMuted: user.camMuted,
        screenSharing: user.screenSharing
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
        text: `👑 ${newHost.name} is now the theater host.`,
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
