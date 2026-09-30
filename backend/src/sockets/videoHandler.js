const roomStore = require('../models/roomStore');

function registerVideoHandlers(io, socket) {
  // Host updates video state (play, pause, seek, rate)
  socket.on('video-state', ({ roomId, state }) => {
    if (!roomId || !state) return;

    // Check host permissions
    const isHost = roomStore.isHost(roomId, socket.id);
    if (!isHost) {
      return socket.emit('error-msg', 'Only the room host can control video playback.');
    }

    const room = roomStore.getRoom(roomId);
    if (!room) return;

    const updatedState = roomStore.updateVideoState(roomId, {
      isPlaying: state.isPlaying !== undefined ? state.isPlaying : room.videoState.isPlaying,
      currentTime: state.currentTime !== undefined ? state.currentTime : room.videoState.currentTime,
      playbackRate: state.playbackRate || room.videoState.playbackRate || 1
    });

    // Broadcast to everyone else in the room
    socket.to(roomId).emit('video-state', {
      action: state.action, // 'play', 'pause', 'seek', 'rate'
      currentTime: state.currentTime,
      isPlaying: updatedState.isPlaying,
      playbackRate: updatedState.playbackRate,
      emitterId: socket.id
    });
  });

  // Host changes video source URL or preset
  socket.on('change-video', ({ roomId, url, title, type }) => {
    if (!roomId || !url) return;

    if (!roomStore.isHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the room host can load a new video.');
    }

    const videoType = type || (url.includes('youtube.com') || url.includes('youtu.be') ? 'youtube' : 'direct');
    const videoTitle = title || (videoType === 'youtube' ? 'YouTube Stream' : 'Custom Video');

    const updatedState = roomStore.updateVideoState(roomId, {
      url,
      title: videoTitle,
      type: videoType,
      isPlaying: false,
      currentTime: 0,
      playbackRate: 1
    });

    // Notify ALL users in the room (including host for confirmation)
    io.to(roomId).emit('video-changed', updatedState);

    // Announce in chat
    const sysMsg = {
      id: `sys-${Date.now()}-video`,
      sender: 'System',
      isSystem: true,
      text: `🎬 New video loaded: "${videoTitle}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    roomStore.addChatMessage(roomId, sysMsg);
    io.to(roomId).emit('receive-message', sysMsg);
  });

  // Periodic heartbeat from host to keep all viewers in tight sync without drift
  socket.on('sync-heartbeat', ({ roomId, currentTime, isPlaying }) => {
    if (!roomId) return;
    if (roomStore.isHost(roomId, socket.id)) {
      roomStore.updateVideoState(roomId, {
        currentTime,
        isPlaying
      });
      // Broadcast heartbeat to participants
      socket.to(roomId).emit('sync-heartbeat', {
        currentTime,
        isPlaying,
        timestamp: Date.now()
      });
    }
  });

  // Participant requests immediate sync catchup
  socket.on('request-sync', ({ roomId }) => {
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    const currentCalculatedTime = roomStore.getCalculatedCurrentTime(room.videoState);
    socket.emit('sync-heartbeat', {
      currentTime: currentCalculatedTime,
      isPlaying: room.videoState.isPlaying,
      timestamp: Date.now()
    });
  });
}

module.exports = registerVideoHandlers;
