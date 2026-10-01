/**
 * WatchVerse — Media Transport Layer
 * Clean abstraction decoupling WebRTC media transport from React components.
 * Supports native P2P MeshTransport now and defines the SFUTransport interface for future scalability.
 */

export const PEER_CONNECTION_STATES = {
  NEW: 'new',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
  CLOSED: 'closed'
};

export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
  iceCandidatePoolSize: 10
};

/**
 * Base MediaTransport Interface
 */
export class MediaTransport {
  constructor(socket, roomId, localStream) {
    this.socket = socket;
    this.roomId = roomId;
    this.localStream = localStream;
    this.peerStates = new Map(); // peerId -> { state, stream, username }
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn(this.getPeersSnapshot()));
  }

  getPeersSnapshot() {
    const obj = {};
    for (const [id, val] of this.peerStates.entries()) {
      obj[id] = val;
    }
    return obj;
  }

  /* Abstract methods to be implemented by Mesh or SFU */
  join() { throw new Error('join() must be implemented'); }
  leave() { throw new Error('leave() must be implemented'); }
  replaceVideoTrack(track) { throw new Error('replaceVideoTrack() must be implemented'); }
}

/**
 * Native WebRTC Full Mesh Transport Implementation
 */
export class MeshTransport extends MediaTransport {
  constructor(socket, roomId, localStream, username) {
    super(socket, roomId, localStream);
    this.username = username;
    this.peerConnections = new Map();
    this.pendingIceCandidates = new Map();
    this.isJoined = false;

    this.bindSocketEvents();
  }

  bindSocketEvents() {
    this.onAllVideoUsers = this.handleAllVideoUsers.bind(this);
    this.onReceiveOffer = this.handleReceiveOffer.bind(this);
    this.onReceiveAnswer = this.handleReceiveAnswer.bind(this);
    this.onReceiveCandidate = this.handleReceiveCandidate.bind(this);
    this.onUserLeft = this.handleUserLeft.bind(this);

    this.socket.on('all-video-users', this.onAllVideoUsers);
    this.socket.on('receive-offer', this.onReceiveOffer);
    this.socket.on('receive-answer', this.onReceiveAnswer);
    this.socket.on('receive-ice-candidate', this.onReceiveCandidate);
    this.socket.on('user-left-video', this.onUserLeft);
    this.socket.on('peer-disconnected', ({ peerId }) => this.closePeer(peerId));
  }

  join() {
    if (this.isJoined) return;
    this.isJoined = true;
    this.socket.emit('join-video-room', { roomId: this.roomId, username: this.username });
  }

  createPeerConnection(targetId, isInitiator = false) {
    if (this.peerConnections.has(targetId)) {
      return this.peerConnections.get(targetId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(targetId, pc);
    if (!this.pendingIceCandidates.has(targetId)) {
      this.pendingIceCandidates.set(targetId, []);
    }

    // Add local tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, this.localStream);
        } catch (e) {
          console.warn('[MeshTransport] Error adding track:', e);
        }
      });
    }

    // ICE Candidate emission
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('send-ice-candidate', {
          targetId,
          candidate: event.candidate
        });
      }
    };

    // Remote track arrival
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        const existing = this.peerStates.get(targetId) || {};
        this.peerStates.set(targetId, {
          ...existing,
          stream: remoteStream,
          state: PEER_CONNECTION_STATES.CONNECTED,
          username: existing.username || `Peer-${targetId.slice(0, 4)}`
        });
        this.notify();
      }
    };

    // Connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      const existing = this.peerStates.get(targetId);
      if (existing) {
        this.peerStates.set(targetId, { ...existing, state });
        this.notify();
      }
      if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        // Attempt ICE restart or cleanup if closed
        if (state === 'closed') {
          this.closePeer(targetId);
        }
      }
    };

    return pc;
  }

  async processPendingCandidates(peerId, pc) {
    const queue = this.pendingIceCandidates.get(peerId);
    if (queue && queue.length > 0) {
      for (const cand of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn(`[MeshTransport] Queued ICE error for ${peerId}:`, e);
        }
      }
      this.pendingIceCandidates.set(peerId, []);
    }
  }

  async handleAllVideoUsers(users) {
    for (const targetId of users) {
      const pc = this.createPeerConnection(targetId, true);
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);
        this.socket.emit('send-offer', { targetId, offer });
      } catch (err) {
        console.error('[MeshTransport] Error creating offer:', err);
      }
    }
  }

  async handleReceiveOffer({ offer, callerId, username: peerName }) {
    const pc = this.createPeerConnection(callerId, false);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await this.processPendingCandidates(callerId, pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const existing = this.peerStates.get(callerId) || {};
      this.peerStates.set(callerId, {
        ...existing,
        username: peerName || `Peer-${callerId.slice(0, 4)}`,
        state: PEER_CONNECTION_STATES.CONNECTING
      });
      this.notify();

      this.socket.emit('send-answer', { targetId: callerId, answer });
    } catch (err) {
      console.error('[MeshTransport] Error handling offer:', err);
    }
  }

  async handleReceiveAnswer({ answer, callerId }) {
    const pc = this.peerConnections.get(callerId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await this.processPendingCandidates(callerId, pc);
      } catch (err) {
        console.error('[MeshTransport] Error setting answer remote description:', err);
      }
    }
  }

  async handleReceiveCandidate({ candidate, fromId }) {
    const pc = this.peerConnections.get(fromId);
    if (!candidate) return;

    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('[MeshTransport] Direct addIceCandidate error:', e);
      }
    } else {
      if (!this.pendingIceCandidates.has(fromId)) {
        this.pendingIceCandidates.set(fromId, []);
      }
      this.pendingIceCandidates.get(fromId).push(candidate);
    }
  }

  handleUserLeft({ peerId }) {
    this.closePeer(peerId);
  }

  closePeer(peerId) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      try {
        pc.close();
      } catch (e) {
        // ignore
      }
      this.peerConnections.delete(peerId);
    }
    this.pendingIceCandidates.delete(peerId);
    this.peerStates.delete(peerId);
    this.notify();
  }

  replaceVideoTrack(newTrack) {
    this.peerConnections.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(newTrack);
      }
    });
  }

  leave() {
    this.socket.off('all-video-users', this.onAllVideoUsers);
    this.socket.off('receive-offer', this.onReceiveOffer);
    this.socket.off('receive-answer', this.onReceiveAnswer);
    this.socket.off('receive-ice-candidate', this.onReceiveCandidate);
    this.socket.off('user-left-video', this.onUserLeft);
    this.socket.off('peer-disconnected');

    this.peerConnections.forEach((pc) => {
      try {
        pc.close();
      } catch (e) {
        // ignore
      }
    });
    this.peerConnections.clear();
    this.pendingIceCandidates.clear();
    this.peerStates.clear();
    this.socket.emit('leave-video-room', { roomId: this.roomId });
    this.isJoined = false;
  }
}

/**
 * Future SFU Transport Interface (Mediasoup / LiveKit Bridge)
 */
export class SFUTransport extends MediaTransport {
  constructor(socket, roomId, localStream, sfuEndpoint) {
    super(socket, roomId, localStream);
    this.sfuEndpoint = sfuEndpoint;
  }

  join() {
    console.info('[SFUTransport] Ready for SFU routing via:', this.sfuEndpoint);
  }

  leave() {
    // SFU disconnect logic
  }

  replaceVideoTrack(track) {
    // SFU track replace logic
  }
}
