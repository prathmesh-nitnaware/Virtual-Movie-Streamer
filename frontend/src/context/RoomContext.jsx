import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import socket from '../api/socket';

const RoomContext = createContext(null);

export function RoomProvider({ roomId, username, children }) {
  const [users, setUsers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState(null);
  const [hostName, setHostName] = useState('');
  const [videoState, setVideoState] = useState({
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Big Buck Bunny (Animation 4K)',
    type: 'direct',
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [roomEndedMessage, setRoomEndedMessage] = useState(null);
  const [systemAlert, setSystemAlert] = useState(null);
  const [micForcedMuted, setMicForcedMuted] = useState(false);

  // Connect socket and register listeners on room mount
  useEffect(() => {
    if (!roomId) return;

    if (!socket.connected) {
      socket.connect();
    }

    const currentName = username || `Viewer-${Math.floor(1000 + Math.random() * 9000)}`;

    socket.emit('join-room', {
      roomId,
      username: currentName
    });

    // Handle full initial room state from server
    const handleRoomState = (state) => {
      setHostId(state.hostId);
      setHostName(state.hostName);
      setIsHost(state.isHost);
      setUsers(state.users || []);
      if (state.videoState) {
        setVideoState((prev) => ({
          ...prev,
          ...state.videoState
        }));
      }
      if (state.chatHistory) {
        setChatMessages(state.chatHistory);
      }
    };

    // User updates
    const handleRoomUsers = (updatedUsers) => {
      setUsers(updatedUsers);
      const me = updatedUsers.find((u) => u.id === socket.id);
      if (me) {
        setIsHost(me.isHost);
      }
    };

    // Host reassignment
    const handleHostChanged = ({ newHostId, newHostName, users: updatedUsers }) => {
      setHostId(newHostId);
      setHostName(newHostName);
      setIsHost(newHostId === socket.id);
      if (updatedUsers) setUsers(updatedUsers);
    };

    // Video state changes (play, pause, seek, rate)
    const handleVideoState = (remoteState) => {
      setVideoState((prev) => ({
        ...prev,
        ...remoteState,
        currentTime: remoteState.currentTime !== undefined ? remoteState.currentTime : prev.currentTime
      }));
    };

    // Video source changed by host
    const handleVideoChanged = (newSource) => {
      setVideoState((prev) => ({
        ...prev,
        ...newSource
      }));
    };

    // Periodic sync heartbeat from host
    const handleSyncHeartbeat = ({ currentTime, isPlaying }) => {
      setVideoState((prev) => {
        // Only update if difference is noticeable (> 1.2s drift) to prevent jitter
        const diff = Math.abs(prev.currentTime - currentTime);
        if (diff > 1.2 || prev.isPlaying !== isPlaying) {
          return { ...prev, currentTime, isPlaying };
        }
        return prev;
      });
    };

    // Real-time chat messages
    const handleReceiveMessage = (message) => {
      setChatMessages((prev) => [...prev, message]);
    };

    // Floating emoji reaction
    const handleNewReaction = (reaction) => {
      setReactions((prev) => [...prev, reaction]);
      // Remove reaction after 3 seconds when animation completes
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3000);
    };

    // Moderation events
    const handleForceMute = () => {
      setMicForcedMuted(true);
      setSystemAlert('You were muted by the room host.');
      setTimeout(() => setSystemAlert(null), 4000);
    };

    const handleRoomEnded = ({ reason }) => {
      setRoomEndedMessage(reason || 'The host has ended this room.');
    };

    const handleErrorMsg = (msg) => {
      setSystemAlert(msg);
      setTimeout(() => setSystemAlert(null), 4000);
    };

    socket.on('room-state', handleRoomState);
    socket.on('room-users', handleRoomUsers);
    socket.on('host-changed', handleHostChanged);
    socket.on('video-state', handleVideoState);
    socket.on('video-changed', handleVideoChanged);
    socket.on('sync-heartbeat', handleSyncHeartbeat);
    socket.on('receive-message', handleReceiveMessage);
    socket.on('new-reaction', handleNewReaction);
    socket.on('force-mute', handleForceMute);
    socket.on('force-mute-user', handleForceMute);
    socket.on('room-ended', handleRoomEnded);
    socket.on('error-msg', handleErrorMsg);

    return () => {
      socket.off('room-state', handleRoomState);
      socket.off('room-users', handleRoomUsers);
      socket.off('host-changed', handleHostChanged);
      socket.off('video-state', handleVideoState);
      socket.off('video-changed', handleVideoChanged);
      socket.off('sync-heartbeat', handleSyncHeartbeat);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('new-reaction', handleNewReaction);
      socket.off('force-mute', handleForceMute);
      socket.off('force-mute-user', handleForceMute);
      socket.off('room-ended', handleRoomEnded);
      socket.off('error-msg', handleErrorMsg);
    };
  }, [roomId, username]);

  // Video Control Methods (Host Only)
  const emitVideoControl = useCallback(
    (action, state = {}) => {
      if (!isHost) return;
      socket.emit('video-state', {
        roomId,
        state: { action, ...state }
      });
    },
    [roomId, isHost]
  );

  const changeVideoSource = useCallback(
    (url, title, type) => {
      if (!isHost) return;
      socket.emit('change-video', { roomId, url, title, type });
    },
    [roomId, isHost]
  );

  const emitSyncHeartbeat = useCallback(
    (currentTime, isPlaying) => {
      if (!isHost) return;
      socket.emit('sync-heartbeat', { roomId, currentTime, isPlaying });
    },
    [roomId, isHost]
  );

  // Participant asks for sync
  const requestSync = useCallback(() => {
    socket.emit('request-sync', { roomId });
  }, [roomId]);

  // Social Methods
  const sendMessage = useCallback(
    (text) => {
      if (!text.trim()) return;
      socket.emit('send-message', { roomId, text });
    },
    [roomId]
  );

  const sendReaction = useCallback(
    (emoji) => {
      socket.emit('send-reaction', { roomId, emoji });
    },
    [roomId]
  );

  // Moderation Methods
  const muteAll = useCallback(() => {
    if (!isHost) return;
    socket.emit('mute-all', { roomId });
  }, [roomId, isHost]);

  const muteUser = useCallback(
    (targetId) => {
      if (!isHost) return;
      socket.emit('mute-user', { roomId, targetId });
    },
    [roomId, isHost]
  );

  const transferHost = useCallback(
    (targetId) => {
      if (!isHost) return;
      socket.emit('transfer-host', { roomId, targetId });
    },
    [roomId, isHost]
  );

  const endRoom = useCallback(() => {
    if (!isHost) return;
    socket.emit('end-room', { roomId });
  }, [roomId, isHost]);

  const value = {
    socketId: socket.id,
    roomId,
    users,
    isHost,
    hostId,
    hostName,
    videoState,
    setVideoState,
    chatMessages,
    reactions,
    roomEndedMessage,
    systemAlert,
    micForcedMuted,
    setMicForcedMuted,
    emitVideoControl,
    changeVideoSource,
    emitSyncHeartbeat,
    requestSync,
    sendMessage,
    sendReaction,
    muteAll,
    muteUser,
    transferHost,
    endRoom
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}
