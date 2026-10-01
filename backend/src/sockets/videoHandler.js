const roomStore = require('../models/roomStore');

function registerVideoHandlers(io, socket) {
  // Host updates video state (play, pause, seek, rate)
  socket.on('video-state', ({ roomId, state }) => {
    if (!roomId || typeof roomId !== 'string' || !state || typeof state !== 'object') return;

    // Check host permissions
    const isHost = roomStore.isHost(roomId, socket.id);
    if (!isHost) {
      return socket.emit('error-msg', 'Only the room host can control video playback.');
    }

    const room = roomStore.getRoom(roomId);
    if (!room) return;

    // Validate inputs
    const validCurrentTime =
      typeof state.currentTime === 'number' && Number.isFinite(state.currentTime) && state.currentTime >= 0
        ? state.currentTime
        : room.videoState.currentTime;

    const validPlaybackRate =
      typeof state.playbackRate === 'number' && Number.isFinite(state.playbackRate) && state.playbackRate >= 0.25 && state.playbackRate <= 4
        ? state.playbackRate
        : room.videoState.playbackRate || 1;

    const updatedState = roomStore.updateVideoState(roomId, {
      isPlaying: typeof state.isPlaying === 'boolean' ? state.isPlaying : room.videoState.isPlaying,
      currentTime: validCurrentTime,
      playbackRate: validPlaybackRate
    });

    // Broadcast to everyone else in the room
    socket.to(roomId).emit('video-state', {
      action: typeof state.action === 'string' ? state.action.slice(0, 16) : 'sync',
      currentTime: validCurrentTime,
      isPlaying: updatedState.isPlaying,
      playbackRate: updatedState.playbackRate,
      stateVersion: updatedState.stateVersion,
      serverTimestamp: Date.now(),
      emitterId: socket.id
    });
  });

  // Host changes video source URL or preset
  socket.on('change-video', ({ roomId, url, title, type, subtitleUrl }) => {
    if (!roomId || typeof roomId !== 'string' || !url || typeof url !== 'string' || !url.trim()) return;

    if (!roomStore.isHost(roomId, socket.id)) {
      return socket.emit('error-msg', 'Only the room host can load a new video.');
    }

    const cleanUrl = url.trim();
    const isYt = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
    const videoType = type || (isYt ? 'youtube' : 'direct');
    const videoTitle = (typeof title === 'string' && title.trim())
      ? title.trim().slice(0, 100)
      : (videoType === 'youtube' ? 'YouTube Stream' : 'Custom Video');

    const updatedState = roomStore.updateVideoState(roomId, {
      url: cleanUrl,
      title: videoTitle,
      type: videoType,
      subtitleUrl: typeof subtitleUrl === 'string' ? subtitleUrl.trim() : null,
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
    if (!roomId || typeof roomId !== 'string') return;
    if (typeof currentTime !== 'number' || !Number.isFinite(currentTime) || currentTime < 0) return;

    if (roomStore.isHost(roomId, socket.id)) {
      const room = roomStore.getRoom(roomId);
      const stateVersion = room ? room.stateVersion : 1;
      roomStore.updateVideoState(roomId, {
        currentTime,
        isPlaying: Boolean(isPlaying)
      });
      // Broadcast heartbeat to participants
      socket.to(roomId).emit('sync-heartbeat', {
        currentTime,
        isPlaying: Boolean(isPlaying),
        stateVersion,
        serverTimestamp: Date.now(),
        timestamp: Date.now()
      });
    }
  });

  // Participant requests immediate sync catchup
  socket.on('request-sync', ({ roomId }) => {
    if (!roomId || typeof roomId !== 'string') return;
    const room = roomStore.getRoom(roomId);
    if (!room) return;

    const currentCalculatedTime = roomStore.getCalculatedCurrentTime(room.videoState);
    socket.emit('sync-heartbeat', {
      currentTime: currentCalculatedTime,
      isPlaying: room.videoState.isPlaying,
      stateVersion: room.stateVersion,
      serverTimestamp: Date.now(),
      timestamp: Date.now()
    });
  });
}

module.exports = registerVideoHandlers;

