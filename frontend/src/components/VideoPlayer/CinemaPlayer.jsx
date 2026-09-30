import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, Play, AlertCircle } from 'lucide-react';
import PlayerControls from './PlayerControls';
import FloatingReactions from './FloatingReactions';
import { useRoom } from '../../context/RoomContext';

function getYouTubeEmbedUrl(url, currentTime, isPlaying) {
  try {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v');
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }

    if (!videoId) return url;
    const startSec = Math.floor(currentTime || 0);
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&start=${startSec}&enablejsapi=1&rel=0`;
  } catch {
    return url;
  }
}

export function CinemaPlayer() {
  const {
    isHost,
    videoState,
    emitVideoControl,
    emitSyncHeartbeat,
    requestSync,
    reactions
  } = useRoom();

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const isInternalUpdate = useRef(false);

  const [duration, setDuration] = useState(0);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPiP, setIsPiP] = useState(false);

  const isYouTube = videoState.type === 'youtube' || videoState.url.includes('youtube.com') || videoState.url.includes('youtu.be');

  // Monitor PiP enter/exit events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);

    video.addEventListener('enterpictureinpicture', onEnterPiP);
    video.addEventListener('leavepictureinpicture', onLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', onEnterPiP);
      video.removeEventListener('leavepictureinpicture', onLeavePiP);
    };
  }, []);

  const handleTogglePiP = async () => {
    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } catch (err) {
        console.warn('Exit PiP error:', err);
      }
    } else if (videoRef.current) {
      try {
        if (document.pictureInPictureEnabled) {
          await videoRef.current.requestPictureInPicture();
          setIsPiP(true);
        } else {
          console.warn('Picture-in-Picture is not supported in this browser');
        }
      } catch (err) {
        console.warn('Request PiP error:', err);
      }
    }
  };

  // Handle Play/Pause
  const handlePlayPause = useCallback(() => {
    if (!isHost || !videoRef.current) return;
    const nextState = !videoState.isPlaying;
    if (nextState) {
      videoRef.current.play().catch((err) => console.warn('Play interrupted:', err));
      emitVideoControl('play', { currentTime: videoRef.current.currentTime, isPlaying: true });
    } else {
      videoRef.current.pause();
      emitVideoControl('pause', { currentTime: videoRef.current.currentTime, isPlaying: false });
    }
  }, [isHost, videoState.isPlaying, emitVideoControl]);

  // Handle Seek
  const handleSeek = useCallback((newTime) => {
    if (!isHost || !videoRef.current) return;
    isInternalUpdate.current = true;
    videoRef.current.currentTime = newTime;
    setLocalCurrentTime(newTime);
    emitVideoControl('seek', { currentTime: newTime, isPlaying: videoState.isPlaying });
    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 200);
  }, [isHost, videoState.isPlaying, emitVideoControl]);

  // Handle Speed change
  const handleSpeedChange = useCallback((rate) => {
    if (!isHost || !videoRef.current) return;
    videoRef.current.playbackRate = rate;
    emitVideoControl('rate', { playbackRate: rate, currentTime: videoRef.current.currentTime });
  }, [isHost, emitVideoControl]);

  // Volume & Mute
  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
    setIsMuted(newVol === 0);
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  // Fullscreen
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.warn('Fullscreen error:', err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn('Exit fullscreen error:', err));
      setIsFullscreen(false);
    }
  };

  // Sync state received from server (for participants or updates)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    if (isInternalUpdate.current) return;

    // Apply playback rate
    if (videoState.playbackRate && video.playbackRate !== videoState.playbackRate) {
      video.playbackRate = videoState.playbackRate;
    }

    // Drift correction: seek if drifting more than 1.2 seconds
    if (videoState.currentTime !== undefined) {
      const drift = Math.abs(video.currentTime - videoState.currentTime);
      if (drift > 1.2) {
        video.currentTime = videoState.currentTime;
      }
    }

    // Play / Pause synchronization
    if (videoState.isPlaying && video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Autoplay prevented by browser:', error.message);
          setAutoplayBlocked(true);
        });
      }
    } else if (!videoState.isPlaying && !video.paused) {
      video.pause();
    }
  }, [videoState, isYouTube]);

  // Host Heartbeat: Periodic sync emit every 4 seconds to prevent participant drift
  useEffect(() => {
    if (!isHost || isYouTube) return;

    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        emitSyncHeartbeat(videoRef.current.currentTime, true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isHost, isYouTube, emitSyncHeartbeat]);

  // Update local scrubber time
  const handleTimeUpdate = () => {
    if (videoRef.current && !isInternalUpdate.current) {
      setLocalCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (videoState.currentTime) {
        videoRef.current.currentTime = videoState.currentTime;
      }
    }
  };

  // User unlocks autoplay on click
  const handleUnlockAutoplay = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().then(() => {
        setAutoplayBlocked(false);
        setIsMuted(false);
      }).catch((err) => console.warn('Unlock failed:', err));
    }
  };

  return (
    <div className="cinema-player-wrapper" ref={containerRef}>
      {/* Floating Real-time Emoji Reactions */}
      <FloatingReactions reactions={reactions} />

      {isYouTube ? (
        <div className="youtube-iframe-container">
          <iframe
            className="youtube-iframe"
            src={getYouTubeEmbedUrl(videoState.url, videoState.currentTime, videoState.isPlaying)}
            title="YouTube Watch Stream"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={videoState.url}
          className={`cinema-video-element ${isFlipped ? 'flipped' : ''}`}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={isHost ? handlePlayPause : undefined}
          style={{
            cursor: isHost ? 'pointer' : 'default',
            transform: isFlipped ? 'scaleX(-1)' : 'none'
          }}
        />
      )}

      {/* Autoplay blocked banner for viewers */}
      {autoplayBlocked && (
        <div className="autoplay-blocked-banner">
          <Volume2 size={32} color="var(--accent-violet)" />
          <div>
            <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>Cinema Audio Muted by Browser</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Click below to sync video and enable audio playback.
            </p>
          </div>
          <button className="btn-primary" onClick={handleUnlockAutoplay}>
            <Play size={16} fill="#fff" /> Enable Audio & Sync
          </button>
        </div>
      )}

      {/* Sleek Custom Controls Bar */}
      {!isYouTube && (
        <PlayerControls
          isPlaying={videoState.isPlaying}
          currentTime={localCurrentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isHost={isHost}
          playbackRate={videoState.playbackRate || 1}
          isFullscreen={isFullscreen}
          isFlipped={isFlipped}
          isPiP={isPiP}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onSpeedChange={handleSpeedChange}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleFlip={() => setIsFlipped((prev) => !prev)}
          onTogglePiP={handleTogglePiP}
          onRequestSync={requestSync}
        />
      )}
    </div>
  );
}

export default CinemaPlayer;
