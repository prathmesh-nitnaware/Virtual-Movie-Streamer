import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../socket';
import { v4 as uuidv4 } from 'uuid';

const VideoPlayer = ({ roomId, videoSrc }) => {
  const videoRef = useRef(null);
  const senderId = useRef(uuidv4());
  const [ready, setReady] = useState(false);

  // Handle incoming sync events
  useEffect(() => {
    socket.on('video-state', ({ type, currentTime, sender }) => {
      if (sender === senderId.current) return;
      const video = videoRef.current;
      if (!video) return;

      if (type === 'play') {
        video.currentTime = currentTime;
        video.play();
      } else if (type === 'pause') {
        video.currentTime = currentTime;
        video.pause();
      } else if (type === 'seek') {
        video.currentTime = currentTime;
      }
    });

    return () => {
      socket.off('video-state');
    };
  }, []);

  // Emit current video state
  const emitState = (type) => {
    const video = videoRef.current;
    if (!video) return;

    socket.emit('video-state', {
      roomId,
      state: {
        type,
        currentTime: video.currentTime,
        sender: senderId.current,
      },
    });
  };

  // Attach event listeners to video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || ready) return;

    video.addEventListener('play', () => emitState('play'));
    video.addEventListener('pause', () => emitState('pause'));
    video.addEventListener('seeked', () => emitState('seek'));

    setReady(true);
    return () => {
      video.removeEventListener('play', () => emitState('play'));
      video.removeEventListener('pause', () => emitState('pause'));
      video.removeEventListener('seeked', () => emitState('seek'));
    };
  }, [ready]);

  return (
    <div className="mb-4">
      <div className="ratio ratio-16x9 rounded overflow-hidden">
        <video
          ref={videoRef}
          controls
          className="bg-dark"
          src={videoSrc}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
