const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const roomService = require('../src/services/roomService');
const { ROLES } = require('../src/services/roomService');

describe('WatchVerse — RoomService Unit Tests', () => {
  const ROOM_ID = 'test-room-101';

  beforeEach(() => {
    roomService.deleteRoom(ROOM_ID);
  });

  it('should create a room with default authoritative video state and version 1', () => {
    const room = roomService.getOrCreateRoom(ROOM_ID, 'socket-host-1', 'Alice', {
      name: 'Alice Cinema',
      initialTitle: 'Cosmic Voyage'
    });

    assert.strictEqual(room.id, ROOM_ID);
    assert.strictEqual(room.name, 'Alice Cinema');
    assert.strictEqual(room.hostId, 'socket-host-1');
    assert.strictEqual(room.stateVersion, 1);
    assert.strictEqual(room.videoState.isPlaying, false);
    assert.strictEqual(room.videoState.title, 'Cosmic Voyage');
  });

  it('should assign HOST role to first user and PARTICIPANT role to second user', () => {
    roomService.getOrCreateRoom(ROOM_ID, 'socket-host-1', 'Alice');

    const hostUser = roomService.addUserToRoom(ROOM_ID, {
      id: 'socket-host-1',
      name: 'Alice'
    });
    assert.strictEqual(hostUser.role, ROLES.HOST);
    assert.strictEqual(hostUser.isHost, true);

    const viewerUser = roomService.addUserToRoom(ROOM_ID, {
      id: 'socket-viewer-2',
      name: 'Bob'
    });
    assert.strictEqual(viewerUser.role, ROLES.PARTICIPANT);
    assert.strictEqual(viewerUser.isHost, false);
  });

  it('should increment stateVersion on video state updates', () => {
    roomService.getOrCreateRoom(ROOM_ID, 'socket-host-1', 'Alice');

    const updated1 = roomService.updateVideoState(ROOM_ID, {
      isPlaying: true,
      currentTime: 45
    });
    assert.strictEqual(updated1.stateVersion, 2);
    assert.strictEqual(updated1.isPlaying, true);
    assert.strictEqual(updated1.currentTime, 45);

    const updated2 = roomService.updateVideoState(ROOM_ID, {
      currentTime: 90
    });
    assert.strictEqual(updated2.stateVersion, 3);
    assert.strictEqual(updated2.currentTime, 90);
  });

  it('should accurately calculate current playback offset for late joiners', () => {
    const pastTimestamp = Date.now() - 10000; // 10 seconds ago
    const videoState = {
      isPlaying: true,
      currentTime: 20,
      playbackRate: 1.5,
      updatedAt: pastTimestamp
    };

    const calculated = roomService.getCalculatedCurrentTime(videoState);
    // 20 + 10s * 1.5 = 35 seconds (allow +/- 0.5s for test execution time)
    assert.ok(calculated >= 34.5 && calculated <= 36.5, `Calculated time was ${calculated}`);
  });

  it('should enforce password and lock verification', () => {
    roomService.getOrCreateRoom(ROOM_ID, 'socket-host-1', 'Alice', {
      password: 'secret-party-pass'
    });

    const checkBadPass = roomService.verifyRoomAccess(ROOM_ID, 'wrong-pass');
    assert.strictEqual(checkBadPass.allowed, false);

    const checkGoodPass = roomService.verifyRoomAccess(ROOM_ID, 'secret-party-pass');
    assert.strictEqual(checkGoodPass.allowed, true);

    roomService.setRoomLock(ROOM_ID, true);
    const checkLocked = roomService.verifyRoomAccess(ROOM_ID, 'secret-party-pass');
    assert.strictEqual(checkLocked.allowed, false);
  });

  it('should correctly evaluate host and moderator authorization', () => {
    roomService.getOrCreateRoom(ROOM_ID, 'socket-host-1', 'Alice');
    roomService.addUserToRoom(ROOM_ID, { id: 'socket-host-1', name: 'Alice' });
    roomService.addUserToRoom(ROOM_ID, { id: 'socket-mod-2', name: 'Bob' });
    roomService.addUserToRoom(ROOM_ID, { id: 'socket-guest-3', name: 'Charlie' });

    roomService.setUserRole(ROOM_ID, 'socket-mod-2', ROLES.MODERATOR);

    assert.strictEqual(roomService.isHost(ROOM_ID, 'socket-host-1'), true);
    assert.strictEqual(roomService.isHost(ROOM_ID, 'socket-mod-2'), false);
    assert.strictEqual(roomService.isModeratorOrHost(ROOM_ID, 'socket-host-1'), true);
    assert.strictEqual(roomService.isModeratorOrHost(ROOM_ID, 'socket-mod-2'), true);
    assert.strictEqual(roomService.isModeratorOrHost(ROOM_ID, 'socket-guest-3'), false);
  });

  it('should reject invalid role assignments', () => {
    roomService.getOrCreateRoom(ROOM_ID, 'socket-host-1', 'Alice');
    roomService.addUserToRoom(ROOM_ID, { id: 'socket-guest-2', name: 'Bob' });

    const result = roomService.setUserRole(ROOM_ID, 'socket-guest-2', 'SUPERADMIN');
    assert.strictEqual(result, null);
  });

  it('should enforce 100-message chat history FIFO boundary', () => {
    roomService.getOrCreateRoom(ROOM_ID, 'socket-host-1', 'Alice');

    for (let i = 1; i <= 120; i++) {
      roomService.addChatMessage(ROOM_ID, {
        id: `msg-${i}`,
        text: `Message ${i}`,
        sender: 'Alice'
      });
    }

    const room = roomService.getRoom(ROOM_ID);
    assert.strictEqual(room.chatHistory.length, 100);
    // Oldest 20 messages should have been evicted
    assert.strictEqual(room.chatHistory[0].text, 'Message 21');
    assert.strictEqual(room.chatHistory[99].text, 'Message 120');
  });

  it('should manage video mesh peer tracking lifecycle', () => {
    roomService.getOrCreateRoom(ROOM_ID, 'socket-host-1', 'Alice');

    roomService.addVideoUser(ROOM_ID, 'peer-1');
    roomService.addVideoUser(ROOM_ID, 'peer-2');

    let videoPeers = roomService.getVideoUsers(ROOM_ID);
    assert.deepStrictEqual(videoPeers, ['peer-1', 'peer-2']);

    roomService.removeVideoUser(ROOM_ID, 'peer-1');
    videoPeers = roomService.getVideoUsers(ROOM_ID);
    assert.deepStrictEqual(videoPeers, ['peer-2']);
  });

  it('should automatically promote moderator or oldest participant when host leaves', () => {
    roomService.getOrCreateRoom(ROOM_ID, 'host-1', 'Alice');
    roomService.addUserToRoom(ROOM_ID, { id: 'host-1', name: 'Alice' });
    roomService.addUserToRoom(ROOM_ID, { id: 'viewer-2', name: 'Bob' });
    roomService.addUserToRoom(ROOM_ID, { id: 'mod-3', name: 'Charlie' });

    // Promote Charlie to MODERATOR
    roomService.setUserRole(ROOM_ID, 'mod-3', ROLES.MODERATOR);

    // Host leaves
    const result = roomService.removeUserFromRoom(ROOM_ID, 'host-1');
    assert.strictEqual(result.roomEmpty, false);
    assert.strictEqual(result.newHost.id, 'mod-3'); // Moderator Charlie should be prioritized
    assert.strictEqual(result.newHost.role, ROLES.HOST);

    // When all remaining leave, room is deleted
    roomService.removeUserFromRoom(ROOM_ID, 'mod-3');
    const finalResult = roomService.removeUserFromRoom(ROOM_ID, 'viewer-2');
    assert.strictEqual(finalResult.roomEmpty, true);
    assert.strictEqual(roomService.getRoom(ROOM_ID), undefined);
  });
});
