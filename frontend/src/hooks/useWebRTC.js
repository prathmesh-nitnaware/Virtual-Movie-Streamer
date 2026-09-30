import { useEffect, useRef, useState, useCallback } from 'react';
import socket from '../api/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function useWebRTC(roomId, username, micForcedMuted) {
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState({}); // { [peerId]: { stream, username } }
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  const localStreamRef = useRef(null);
  const peerConnections = useRef({}); // { [peerId]: RTCPeerConnection }
  const screenTrackRef = useRef(null);

  // Helper to create RTCPeerConnection for a target peer
  const createPeerConnection = useCallback((targetId, isInitiator) => {
    if (peerConnections.current[targetId]) {
      return peerConnections.current[targetId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetId] = pc;

    // Add local tracks to peer connection if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('send-ice-candidate', {
          targetId,
          candidate: event.candidate
        });
      }
    };

    // Remote Track handler
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setRemotePeers((prev) => ({
          ...prev,
          [targetId]: {
            stream: remoteStream,
            username: prev[targetId]?.username || `Peer-${targetId.slice(0, 4)}`
          }
        }));
      }
    };

    // Connection state logging
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        closePeer(targetId);
      }
    };

    return pc;
  }, []);

  const closePeer = useCallback((peerId) => {
    if (peerConnections.current[peerId]) {
      peerConnections.current[peerId].close();
      delete peerConnections.current[peerId];
    }
    setRemotePeers((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }, []);

  // Initialize Local Media Stream
  useEffect(() => {
    let mounted = true;

    async function setupLocalMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } },
          audio: true
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Join video room after obtaining media
        socket.emit('join-video-room', { roomId, username });
      } catch (err) {
        console.warn('⚠️ Camera/Mic unavailable or permission denied:', err.message);
        setMediaError(err.name === 'NotAllowedError' ? 'Camera/Mic permission denied' : 'No camera/mic found');
        setIsCamOn(false);
        setIsMicOn(false);

        // Still join video room as listener / avatar viewer
        socket.emit('join-video-room', { roomId, username });
      }
    }

    if (roomId) {
      setupLocalMedia();
    }

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.keys(peerConnections.current).forEach((peerId) => {
        peerConnections.current[peerId].close();
      });
      peerConnections.current = {};
      socket.emit('leave-video-room', { roomId });
    };
  }, [roomId, username]);

  // Handle WebRTC Signaling Events
  useEffect(() => {
    // 1. Existing users in video room -> newly joined client initiates offers
    const handleAllVideoUsers = async (users) => {
      for (const targetId of users) {
        const pc = createPeerConnection(targetId, true);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('send-offer', { targetId, offer });
        } catch (err) {
          console.error('Error creating offer for peer:', targetId, err);
        }
      }
    };

    // 2. Incoming offer from a peer
    const handleReceiveOffer = async ({ offer, callerId, username: peerName }) => {
      const pc = createPeerConnection(callerId, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        setRemotePeers((prev) => ({
          ...prev,
          [callerId]: {
            ...prev[callerId],
            username: peerName || `Peer-${callerId.slice(0, 4)}`
          }
        }));

        socket.emit('send-answer', { targetId: callerId, answer });
      } catch (err) {
        console.error('Error handling offer from peer:', callerId, err);
      }
    };

    // 3. Incoming answer from peer
    const handleReceiveAnswer = async ({ answer, callerId }) => {
      const pc = peerConnections.current[callerId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error setting remote description for answer:', err);
        }
      }
    };

    // 4. Incoming ICE candidate
    const handleReceiveCandidate = async ({ candidate, fromId }) => {
      const pc = peerConnections.current[fromId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding received ice candidate:', err);
        }
      }
    };

    // 5. Peer leaves video
    const handleUserLeftVideo = ({ peerId }) => {
      closePeer(peerId);
    };

    socket.on('all-video-users', handleAllVideoUsers);
    socket.on('receive-offer', handleReceiveOffer);
    socket.on('receive-answer', handleReceiveAnswer);
    socket.on('receive-ice-candidate', handleReceiveCandidate);
    socket.on('user-left-video', handleUserLeftVideo);
    socket.on('peer-disconnected', ({ peerId }) => closePeer(peerId));

    return () => {
      socket.off('all-video-users', handleAllVideoUsers);
      socket.off('receive-offer', handleReceiveOffer);
      socket.off('receive-answer', handleReceiveAnswer);
      socket.off('receive-ice-candidate', handleReceiveCandidate);
      socket.off('user-left-video', handleUserLeftVideo);
      socket.off('peer-disconnected');
    };
  }, [createPeerConnection, closePeer]);

  // Handle Forced Mute from Host
  useEffect(() => {
    if (micForcedMuted && localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = false;
        setIsMicOn(false);
      }
    }
  }, [micForcedMuted]);

  // Toggle Mic
  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  }, []);

  // Toggle Camera
  const toggleCam = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOn(videoTrack.enabled);
    }
  }, []);

  // Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // Replace video track in all active peer connections
        Object.values(peerConnections.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // When user stops screen sharing from browser bar
        screenTrack.onended = () => {
          stopScreenShareInternal();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
      }
    } else {
      stopScreenShareInternal();
    }
  }, [isScreenSharing]);

  const stopScreenShareInternal = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    const originalVideoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (originalVideoTrack) {
      Object.values(peerConnections.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(originalVideoTrack);
        }
      });
    }
    setIsScreenSharing(false);
  };

  return {
    localStream,
    remotePeers,
    isMicOn,
    isCamOn,
    isScreenSharing,
    mediaError,
    toggleMic,
    toggleCam,
    toggleScreenShare
  };
}

export default useWebRTC;
