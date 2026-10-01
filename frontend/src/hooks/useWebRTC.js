import { useEffect, useRef, useState, useCallback } from 'react';
import socket from '../api/socket';
import { MeshTransport } from '../services/mediaTransport';

export function useWebRTC(roomId, username, micForcedMuted) {
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState({}); // { [peerId]: { stream, username, state } }
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  const localStreamRef = useRef(null);
  const transportRef = useRef(null);
  const screenTrackRef = useRef(null);

  // Initialize Local Media Stream & Transport
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

        // Instantiate Mesh Transport
        const transport = new MeshTransport(socket, roomId, stream, username);
        transportRef.current = transport;

        // Subscribe to peer changes
        const unsubscribe = transport.subscribe((peers) => {
          if (mounted) {
            setRemotePeers(peers);
          }
        });

        transport.join();

        return () => {
          unsubscribe();
        };
      } catch (err) {
        console.warn('⚠️ Camera/Mic permission denied or not available:', err.message);
        if (mounted) {
          setMediaError(err.name === 'NotAllowedError' ? 'Camera/Mic permission denied' : 'No camera/mic found');
          setIsCamOn(false);
          setIsMicOn(false);

          // Still join as avatar / viewer
          const transport = new MeshTransport(socket, roomId, null, username);
          transportRef.current = transport;
          transport.subscribe((peers) => {
            if (mounted) setRemotePeers(peers);
          });
          transport.join();
        }
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
      if (transportRef.current) {
        transportRef.current.leave();
        transportRef.current = null;
      }
    };
  }, [roomId, username]);

  // Handle Forced Mute from Host
  useEffect(() => {
    if (micForcedMuted && localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = false;
        setIsMicOn(false);
        socket.emit('media-status-change', {
          roomId,
          micMuted: true,
          camMuted: !isCamOn,
          screenSharing: isScreenSharing
        });
      }
    }
  }, [micForcedMuted, roomId, isCamOn, isScreenSharing]);

  // Toggle Mic
  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
      socket.emit('media-status-change', {
        roomId,
        micMuted: !audioTrack.enabled,
        camMuted: !isCamOn,
        screenSharing: isScreenSharing
      });
    }
  }, [roomId, isCamOn, isScreenSharing]);

  // Toggle Camera
  const toggleCam = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOn(videoTrack.enabled);
      socket.emit('media-status-change', {
        roomId,
        micMuted: !isMicOn,
        camMuted: !videoTrack.enabled,
        screenSharing: isScreenSharing
      });
    }
  }, [roomId, isMicOn, isScreenSharing]);

  // Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        // Replace video track in transport
        if (transportRef.current) {
          transportRef.current.replaceVideoTrack(screenTrack);
        }

        screenTrack.onended = () => {
          stopScreenShareInternal();
        };

        setIsScreenSharing(true);
        socket.emit('media-status-change', {
          roomId,
          micMuted: !isMicOn,
          camMuted: !isCamOn,
          screenSharing: true
        });
      } catch (err) {
        console.warn('[WebRTC] Screen share cancelled or failed:', err);
      }
    } else {
      stopScreenShareInternal();
    }
  }, [isScreenSharing, roomId, isMicOn, isCamOn]);

  const stopScreenShareInternal = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    const originalVideoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (originalVideoTrack && transportRef.current) {
      transportRef.current.replaceVideoTrack(originalVideoTrack);
    }
    setIsScreenSharing(false);
    socket.emit('media-status-change', {
      roomId,
      micMuted: !isMicOn,
      camMuted: !isCamOn,
      screenSharing: false
    });
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
