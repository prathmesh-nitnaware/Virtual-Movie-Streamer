/**
 * WatchVerse — RoomService
 * Manages in-memory room lifecycle, authoritative versioned video synchronization,
 * role-based access control (HOST, MODERATOR, PARTICIPANT), and room security.
 */

const ROLES = {
  HOST: 'HOST',
  MODERATOR: 'MODERATOR',
  PARTICIPANT: 'PARTICIPANT'
};

class RoomService {
  constructor() {
    this.rooms = new Map();
  }

  getRoom(roomId) {
    if (!roomId) return null;
    return this.rooms.get(roomId);
  }

  getAllRoomsSummary() {
    const list = [];
    for (const [id, room] of this.rooms.entries()) {
      list.push({
        id,
        name: room.name || `Room ${id}`,
        hostName: room.hostName,
        viewerCount: room.users.length,
        currentMovie: room.videoState.title,
        isPlaying: room.videoState.isPlaying,
        isPrivate: Boolean(room.password),
        isLocked: Boolean(room.isLocked),
        createdAt: room.createdAt
      });
    }
    return list;
  }

  getOrCreateRoom(roomId, hostSocketId, hostName, options = {}) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        name: options.name || `Room-${roomId.slice(0, 6)}`,
        hostId: hostSocketId,
        hostName: hostName || 'Host',
        password: options.password || null,
        isLocked: false,
        createdAt: Date.now(),
        users: [],
        videoUsers: new Set(),
        stateVersion: 1,
        videoState: {
          mediaId: `media-${Date.now()}`,
          url: options.initialUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          title: options.initialTitle || 'Big Buck Bunny (Animation 4K)',
          type: options.initialType || 'direct',
          subtitleUrl: options.subtitleUrl || null,
          isPlaying: false,
          currentTime: 0,
          updatedAt: Date.now(),
          playbackRate: 1,
          stateVersion: 1
        },
        chatHistory: []
      });
    }
    return this.rooms.get(roomId);
  }

  verifyRoomAccess(roomId, password) {
    const room = this.rooms.get(roomId);
    if (!room) return { allowed: true }; // New room creation
    if (room.isLocked) {
      return { allowed: false, reason: 'This theater is currently locked by the host.' };
    }
    if (room.password && room.password !== password) {
      return { allowed: false, reason: 'Invalid room password.' };
    }
    return { allowed: true };
  }

  addUserToRoom(roomId, user) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.users = room.users.filter((u) => u.id !== user.id);

    const isFirstUser = room.users.length === 0;
    const isHost = isFirstUser || room.hostId === user.id;

    if (isFirstUser || !room.hostId) {
      room.hostId = user.id;
      room.hostName = user.name;
    }

    const userData = {
      id: user.id,
      name: user.name || `User-${user.id.slice(0, 4)}`,
      avatar: user.avatar || null,
      role: isHost ? ROLES.HOST : ROLES.PARTICIPANT,
      isHost: isHost,
      micMuted: false,
      camMuted: false,
      screenSharing: false,
      connectionState: 'connected',
      joinedAt: Date.now()
    };

    room.users.push(userData);
    return userData;
  }

  removeUserFromRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const departingUser = room.users.find((u) => u.id === socketId);
    room.users = room.users.filter((u) => u.id !== socketId);
    room.videoUsers.delete(socketId);

    let newHost = null;

    if (room.hostId === socketId) {
      if (room.users.length > 0) {
        // Promote highest ranking user (MODERATOR first, else oldest participant)
        const moderator = room.users.find((u) => u.role === ROLES.MODERATOR);
        newHost = moderator || room.users[0];
        newHost.role = ROLES.HOST;
        newHost.isHost = true;
        room.hostId = newHost.id;
        room.hostName = newHost.name;
      } else {
        this.rooms.delete(roomId);
        return { roomEmpty: true, departingUser };
      }
    }

    return {
      roomEmpty: room.users.length === 0,
      departingUser,
      newHost,
      remainingUsers: room.users
    };
  }

  getUserRole(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const user = room.users.find((u) => u.id === socketId);
    return user ? user.role : null;
  }

  isHost(roomId, socketId) {
    const room = this.rooms.get(roomId);
    return room ? room.hostId === socketId : false;
  }

  isModeratorOrHost(roomId, socketId) {
    const role = this.getUserRole(roomId, socketId);
    return role === ROLES.HOST || role === ROLES.MODERATOR;
  }

  setUserRole(roomId, targetId, newRole) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const user = room.users.find((u) => u.id === targetId);
    if (!user) return null;
    if (Object.values(ROLES).includes(newRole)) {
      user.role = newRole;
      user.isHost = newRole === ROLES.HOST;
      if (newRole === ROLES.HOST) {
        room.hostId = user.id;
        room.hostName = user.name;
      }
      return user;
    }
    return null;
  }

  getCalculatedCurrentTime(videoState) {
    if (!videoState || !videoState.isPlaying) {
      return videoState ? videoState.currentTime : 0;
    }
    const elapsedSeconds = (Date.now() - videoState.updatedAt) / 1000;
    return videoState.currentTime + elapsedSeconds * (videoState.playbackRate || 1);
  }

  updateVideoState(roomId, newState) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.stateVersion = (room.stateVersion || 1) + 1;

    room.videoState = {
      ...room.videoState,
      ...newState,
      stateVersion: room.stateVersion,
      updatedAt: Date.now()
    };

    return room.videoState;
  }

  setRoomLock(roomId, isLocked) {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.isLocked = Boolean(isLocked);
    return room.isLocked;
  }

  addChatMessage(roomId, message) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.chatHistory.push(message);
    if (room.chatHistory.length > 100) {
      room.chatHistory.shift();
    }
  }

  addVideoUser(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.videoUsers.add(socketId);
    }
  }

  removeVideoUser(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.videoUsers.delete(socketId);
    }
  }

  getVideoUsers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.videoUsers) : [];
  }

  deleteRoom(roomId) {
    this.rooms.delete(roomId);
  }
}

module.exports = new RoomService();
module.exports.ROLES = ROLES;
