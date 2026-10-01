import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import socket from '../api/socket';
import soundEffects from '../utils/soundEffects';

const RoomContext = createContext(null);

export function RoomProvider({ roomId, username, password, children }) {
  const [roomName, setRoomName] = useState('');
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState('PARTICIPANT'); // 'HOST' | 'MODERATOR' | 'PARTICIPANT'
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState(null);
  const [hostName, setHostName] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected' | 'reconnecting' | 'disconnected'
  const [joinError, setJoinError] = useState(null);

  const [videoState, setVideoState] = useState({
    mediaId: 'default',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Big Buck Bunny (Animation 4K)',
    type: 'direct',
    subtitleUrl: null,
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1,
    stateVersion: 1
  });

  const [chatMessages, setChatMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [roomEndedMessage, setRoomEndedMessage] = useState(null);
  const [systemAlert, setSystemAlert] = useState(null);
  const [micForcedMuted, setMicForcedMuted] = useState(false);

  const localStateVersion = useRef(1);

  // Auto-reconnect & join handling
  useEffect(() => {
    if (!roomId) return;

    const currentName = username || `Viewer-${Math.floor(1000 + Math.random() * 9000)}`;

    const performJoin = () => {
      setConnectionStatus('connected');
      socket.emit('join-room', {
        roomId,
        username: currentName,
        password: password || null
      });
    };

    if (!socket.connected) {
      socket.connect();
    } else {
      performJoin();
    }

    const onConnect = () => {
      performJoin();
    };

    const onDisconnect = () => {
      setConnectionStatus('reconnecting');
    };

    const onJoinError = ({ message }) => {
      setJoinError(message || 'Failed to enter theater.');
    };

    // Handle full initial room state from server
    const handleRoomState = (state) => {
      setJoinError(null);
      setRoomName(state.roomName || `Room ${roomId}`);
      setHostId(state.hostId);
      setHostName(state.hostName);
      setUserRole(state.userRole || (state.isHost ? 'HOST' : 'PARTICIPANT'));
      setIsHost(state.isHost);
      setIsLocked(Boolean(state.isLocked));
      setHasPassword(Boolean(state.hasPassword));
      setUsers(state.users || []);

      if (state.videoState) {
        localStateVersion.current = state.videoState.stateVersion || 1;
        setVideoState(state.videoState);
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
        setIsHost(me.isHost || me.role === 'HOST');
        setUserRole(me.role || (me.isHost ? 'HOST' : 'PARTICIPANT'));
      }
    };

    // Host reassignment
    const handleHostChanged = ({ newHostId, newHostName, users: updatedUsers }) => {
      setHostId(newHostId);
      setHostName(newHostName);
      const isMe = newHostId === socket.id;
      setIsHost(isMe);
      if (isMe) setUserRole('HOST');
      if (updatedUsers) setUsers(updatedUsers);
    };

    // Role update for self
    const handleRoleUpdated = ({ role }) => {
      setUserRole(role);
      setIsHost(role === 'HOST');
    };

    // Room lock change
    const handleRoomLockChanged = ({ isLocked: locked }) => {
      setIsLocked(locked);
    };

    // Versioned video state changes (play, pause, seek, rate)
    const handleVideoState = (remoteState) => {
      // Discard stale out-of-order state if version is older
      if (remoteState.stateVersion && remoteState.stateVersion < localStateVersion.current) {
        return;
      }
      if (remoteState.stateVersion) {
        localStateVersion.current = remoteState.stateVersion;
      }

      setVideoState((prev) => ({
        ...prev,
        ...remoteState,
        currentTime: remoteState.currentTime !== undefined ? remoteState.currentTime : prev.currentTime
      }));
    };

    // Video source changed by host
    const handleVideoChanged = (newSource) => {
      if (newSource.stateVersion) {
        localStateVersion.current = newSource.stateVersion;
      }
      setVideoState((prev) => ({
        ...prev,
        ...newSource
      }));
    };

    // Periodic sync heartbeat from host
    const handleSyncHeartbeat = ({ currentTime, isPlaying, stateVersion }) => {
      if (stateVersion && stateVersion < localStateVersion.current) {
        return;
      }
      setVideoState((prev) => {
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
      if (message.senderId !== socket.id) {
        soundEffects.playChatPing();
      }
    };

    // Floating emoji reaction
    const handleNewReaction = (reaction) => {
      setReactions((prev) => [...prev, reaction]);
      soundEffects.playPopcornSound();
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 3000);
    };

    // User joined room chime
    const handleUserJoined = () => {
      soundEffects.playJoinSound();
    };

    // Moderation events
    const handleForceMute = () => {
      setMicForcedMuted(true);
      setSystemAlert('You were muted by a theater moderator.');
      setTimeout(() => setSystemAlert(null), 4000);
    };

    const handleRoomEnded = ({ reason }) => {
      setRoomEndedMessage(reason || 'The host has ended this theater session.');
    };

    const handleErrorMsg = (msg) => {
      setSystemAlert(msg);
      setTimeout(() => setSystemAlert(null), 4000);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('join-error', onJoinError);
    socket.on('room-state', handleRoomState);
    socket.on('room-users', handleRoomUsers);
    socket.on('user-joined-room', handleUserJoined);
    socket.on('host-changed', handleHostChanged);
    socket.on('role-updated', handleRoleUpdated);
    socket.on('room-lock-changed', handleRoomLockChanged);
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
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('join-error', onJoinError);
      socket.off('room-state', handleRoomState);
      socket.off('room-users', handleRoomUsers);
      socket.off('user-joined-room', handleUserJoined);
      socket.off('host-changed', handleHostChanged);
      socket.off('role-updated', handleRoleUpdated);
      socket.off('room-lock-changed', handleRoomLockChanged);
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
  }, [roomId, username, password]);

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
    (url, title, type, subtitleUrl) => {
      if (!isHost) return;
      socket.emit('change-video', { roomId, url, title, type, subtitleUrl });
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
  const isModerator = userRole === 'HOST' || userRole === 'MODERATOR';

  const muteAll = useCallback(() => {
    if (!isModerator) return;
    socket.emit('mute-all', { roomId });
  }, [roomId, isModerator]);

  const muteUser = useCallback(
    (targetId) => {
      if (!isModerator) return;
      socket.emit('mute-user', { roomId, targetId });
    },
    [roomId, isModerator]
  );

  const kickUser = useCallback(
    (targetId) => {
      if (!isModerator) return;
      socket.emit('kick-user', { roomId, targetId });
    },
    [roomId, isModerator]
  );

  const setRole = useCallback(
    (targetId, role) => {
      if (!isHost) return;
      socket.emit('set-role', { roomId, targetId, role });
    },
    [roomId, isHost]
  );

  const toggleRoomLock = useCallback(() => {
    if (!isHost) return;
    socket.emit('toggle-room-lock', { roomId });
  }, [roomId, isHost]);

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
    roomName,
    users,
    userRole,
    isHost,
    isModerator,
    hostId,
    hostName,
    isLocked,
    hasPassword,
    connectionStatus,
    joinError,
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
    kickUser,
    setRole,
    toggleRoomLock,
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
