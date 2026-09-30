/**
 * RoomService handles in-memory room lifecycle, video synchronization,
 * user sessions, and host moderation.
 */
class RoomService {
  constructor() {
    this.rooms = new Map();
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getAllRoomsSummary() {
    const list = [];
    for (const [id, room] of this.rooms.entries()) {
      list.push({
        id,
        hostName: room.hostName,
        viewerCount: room.users.length,
        currentMovie: room.videoState.title,
        isPlaying: room.videoState.isPlaying,
        createdAt: room.createdAt
      });
    }
    return list;
  }

  getOrCreateRoom(roomId, hostSocketId, hostName) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        hostId: hostSocketId,
        hostName: hostName,
        createdAt: Date.now(),
        users: [],
        videoUsers: new Set(),
        videoState: {
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          title: 'Big Buck Bunny (Animation 4K)',
          type: 'direct',
          isPlaying: false,
          currentTime: 0,
          updatedAt: Date.now(),
          playbackRate: 1
        },
        chatHistory: []
      });
    }
    return this.rooms.get(roomId);
  }

  addUserToRoom(roomId, user) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.users = room.users.filter((u) => u.id !== user.id);

    const isHost = room.users.length === 0 || room.hostId === user.id;
    if (isHost && !room.hostId) {
      room.hostId = user.id;
      room.hostName = user.name;
    }

    const userData = {
      id: user.id,
      name: user.name || `User-${user.id.slice(0, 4)}`,
      avatar: user.avatar || null,
      isHost: room.hostId === user.id,
      micMuted: false,
      camMuted: false,
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
        newHost = room.users[0];
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

  isHost(roomId, socketId) {
    const room = this.rooms.get(roomId);
    return room ? room.hostId === socketId : false;
  }

  getCalculatedCurrentTime(videoState) {
    if (!videoState.isPlaying) {
      return videoState.currentTime;
    }
    const elapsedSeconds = (Date.now() - videoState.updatedAt) / 1000;
    return videoState.currentTime + elapsedSeconds * (videoState.playbackRate || 1);
  }

  updateVideoState(roomId, newState) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.videoState = {
      ...room.videoState,
      ...newState,
      updatedAt: Date.now()
    };

    return room.videoState;
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
