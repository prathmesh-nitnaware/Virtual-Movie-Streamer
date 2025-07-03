import React, { useEffect, useRef } from 'react';
import { socket } from '../socket';

function VideoPlayer({ roomId, videoSrc, isHost }) {
  const videoRef = useRef();

  useEffect(() => {
    const video = videoRef.current;

    if (isHost) {
      // Emit video state changes to others
      const emitState = (action) => {
        socket.emit('video-state', {
          roomId,
          state: action
        });
      };

      video.addEventListener('play', () => emitState('play'));
      video.addEventListener('pause', () => emitState('pause'));
      video.addEventListener('seeked', () =>
        emitState({ type: 'seek', time: video.currentTime })
      );

      return () => {
        video.removeEventListener('play', () => emitState('play'));
        video.removeEventListener('pause', () => emitState('pause'));
        video.removeEventListener('seeked', () =>
          emitState({ type: 'seek', time: video.currentTime })
        );
      };
    } else {
      // Participant: Listen for sync from host
      socket.on('video-state', (state) => {
        if (!video) return;

        if (state === 'play') video.play();
        else if (state === 'pause') video.pause();
        else if (state?.type === 'seek') {
          video.currentTime = state.time;
        }
      });
    }

    return () => {
      socket.off('video-state');
    };
  }, [roomId, isHost]);

  return (
    <div className="video-wrapper mt-3">
      <video
        ref={videoRef}
        src={videoSrc}
        className="video-player"
        width="100%"
        height="auto"
        controls={isHost} // ✅ Only host gets controls
      />
    </div>
  );
}

export default VideoPlayer;
