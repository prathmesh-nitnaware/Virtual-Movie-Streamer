import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { socket } from '../socket';
import './VideoChat.css';

function VideoChat({ roomId }) {
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();
  const streamRef = useRef();

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      userVideo.current.srcObject = stream;
      streamRef.current = stream;

      socket.emit('join-video-room', roomId);

      socket.on('user-joined', (userId) => {
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream
        });

        peer.on('signal', signal => {
          socket.emit('send-signal', { userToSignal: userId, signal });
        });

        peer.on('stream', partnerStream => {
          partnerVideo.current.srcObject = partnerStream;
        });

        peerRef.current = peer;
      });

      socket.on('receive-signal', ({ signal }) => {
        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream
        });

        peer.on('signal', answer => {
          socket.emit('return-signal', { to: socket.id, signal: answer });
        });

        peer.on('stream', partnerStream => {
          partnerVideo.current.srcObject = partnerStream;
        });

        peer.signal(signal);
        peerRef.current = peer;
      });

      socket.on('signal-accepted', ({ signal }) => {
        peerRef.current.signal(signal);
      });

      socket.on('force-mute', () => {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
          setMicOn(false);
        }
      });

      socket.on('force-mute-user', () => {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
          setMicOn(false);
        }
      });

      socket.on('room-ended', () => {
        alert("🚫 Host has ended the room.");
        window.location.href = '/';
      });
    });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      socket.off('user-joined');
      socket.off('receive-signal');
      socket.off('signal-accepted');
      socket.off('force-mute');
      socket.off('force-mute-user');
      socket.off('room-ended');
    };
  }, [roomId]);

  const toggleMic = () => {
    const audioTrack = streamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCamOn(videoTrack.enabled);
    }
  };

  return (
    <div className="video-chat-container">
      <div className="video-wrapper">
        <video ref={userVideo} autoPlay muted className="video-self" />
        <div className="controls">
          <button onClick={toggleMic} title={micOn ? 'Mute Mic' : 'Unmute Mic'}>
            {micOn ? '🎙️' : '🔇'}
          </button>
          <button onClick={toggleCamera} title={camOn ? 'Turn Off Camera' : 'Turn On Camera'}>
            {camOn ? '📷' : '🚫📷'}
          </button>
        </div>
      </div>
      <video ref={partnerVideo} autoPlay className="video-partner" />
    </div>
  );
}

export default VideoChat;
