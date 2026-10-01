import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, Play } from 'lucide-react';
import PlayerControls from './PlayerControls';
import FloatingReactions from './FloatingReactions';
import { useRoom } from '../../context/RoomContext';

function extractYouTubeId(url) {
  if (!url) return null;
  try {
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split(/[?#&]/)[0];
    }
    if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      return urlParams.get('v');
    }
    if (url.includes('youtube.com/embed/')) {
      return url.split('embed/')[1]?.split(/[?#&]/)[0];
    }
    if (url.includes('youtube.com/shorts/')) {
      return url.split('shorts/')[1]?.split(/[?#&]/)[0];
    }
  } catch (err) {
    console.warn('Could not extract YouTube ID:', err);
  }
  return null;
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
  const ytPlayerRef = useRef(null);
  const isInternalUpdate = useRef(false);

  const [duration, setDuration] = useState(0);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [ytApiReady, setYtApiReady] = useState(false);

  const youtubeId = extractYouTubeId(videoState.url);
  const isYouTube = videoState.type === 'youtube' || Boolean(youtubeId);

  // 1. Load YouTube Iframe API Script dynamically
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      window.onYouTubeIframeAPIReady = () => {
        setYtApiReady(true);
      };
      document.body.appendChild(tag);
    } else {
      setYtApiReady(true);
    }
  }, []);

  // 2. Initialize YouTube Player when isYouTube is true and API is ready
  useEffect(() => {
    if (!isYouTube || !ytApiReady || !youtubeId) return;

    let playerInstance = null;

    const initYT = () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }

      playerInstance = new window.YT.Player('youtube-player-mount', {
        videoId: youtubeId,
        playerVars: {
          autoplay: videoState.isPlaying ? 1 : 0,
          start: Math.floor(videoState.currentTime || 0),
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1
        },
        events: {
          onReady: (event) => {
            ytPlayerRef.current = event.target;
            const dur = event.target.getDuration();
            if (dur) setDuration(dur);
            if (videoState.isPlaying) {
              event.target.playVideo();
            } else {
              event.target.pauseVideo();
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              const dur = event.target.getDuration();
              if (dur) setDuration(dur);
            }
          }
        }
      });
    };

    const timer = setTimeout(initYT, 100);

    return () => {
      clearTimeout(timer);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        ytPlayerRef.current = null;
      }
    };
  }, [isYouTube, ytApiReady, youtubeId]);

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
        }
      } catch (err) {
        console.warn('Request PiP error:', err);
      }
    }
  };

  // Play/Pause Handler (Synchronized across Direct & YouTube)
  const handlePlayPause = useCallback(() => {
    if (!isHost) return;
    const nextState = !videoState.isPlaying;

    if (isYouTube && ytPlayerRef.current) {
      try {
        const curTime = ytPlayerRef.current.getCurrentTime() || 0;
        if (nextState) {
          ytPlayerRef.current.playVideo();
          emitVideoControl('play', { currentTime: curTime, isPlaying: true });
        } else {
          ytPlayerRef.current.pauseVideo();
          emitVideoControl('pause', { currentTime: curTime, isPlaying: false });
        }
      } catch (err) {
        console.warn('YouTube play/pause error:', err);
      }
    } else if (videoRef.current) {
      if (nextState) {
        videoRef.current.play().catch((err) => console.warn('Play interrupted:', err));
        emitVideoControl('play', { currentTime: videoRef.current.currentTime, isPlaying: true });
      } else {
        videoRef.current.pause();
        emitVideoControl('pause', { currentTime: videoRef.current.currentTime, isPlaying: false });
      }
    }
  }, [isHost, videoState.isPlaying, isYouTube, emitVideoControl]);

  // Seek Handler
  const handleSeek = useCallback((newTime) => {
    if (!isHost) return;
    isInternalUpdate.current = true;
    setLocalCurrentTime(newTime);

    if (isYouTube && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(newTime, true);
        emitVideoControl('seek', { currentTime: newTime, isPlaying: videoState.isPlaying });
      } catch (e) {
        console.warn('YouTube seek error:', e);
      }
    } else if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      emitVideoControl('seek', { currentTime: newTime, isPlaying: videoState.isPlaying });
    }

    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 200);
  }, [isHost, videoState.isPlaying, isYouTube, emitVideoControl]);

  // Speed Handler
  const handleSpeedChange = useCallback((rate) => {
    if (!isHost) return;

    if (isYouTube && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setPlaybackRate(rate);
        const cur = ytPlayerRef.current.getCurrentTime() || 0;
        emitVideoControl('rate', { playbackRate: rate, currentTime: cur });
      } catch (e) {
        console.warn('YouTube rate error:', e);
      }
    } else if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      emitVideoControl('rate', { playbackRate: rate, currentTime: videoRef.current.currentTime });
    }
  }, [isHost, isYouTube, emitVideoControl]);

  // Volume & Mute
  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    const muted = newVol === 0;
    setIsMuted(muted);

    if (isYouTube && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(newVol * 100);
        if (muted) ytPlayerRef.current.mute();
        else ytPlayerRef.current.unMute();
      } catch (e) {
        // ignore
      }
    } else if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = muted;
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isYouTube && ytPlayerRef.current) {
      try {
        if (nextMuted) ytPlayerRef.current.mute();
        else ytPlayerRef.current.unMute();
      } catch (e) {
        // ignore
      }
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuted;
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

  // Synchronize incoming state from server (for non-hosts or state sync)
  useEffect(() => {
    if (isInternalUpdate.current) return;

    if (isYouTube && ytPlayerRef.current) {
      try {
        const yt = ytPlayerRef.current;
        if (typeof yt.getPlayerState === 'function') {
          const ytState = yt.getPlayerState();
          // Sync play / pause
          if (videoState.isPlaying && ytState !== window.YT.PlayerState.PLAYING) {
            yt.playVideo();
          } else if (!videoState.isPlaying && ytState === window.YT.PlayerState.PLAYING) {
            yt.pauseVideo();
          }

          // Drift correction (> 1.5s drift)
          if (videoState.currentTime !== undefined) {
            const cur = yt.getCurrentTime() || 0;
            if (Math.abs(cur - videoState.currentTime) > 1.5) {
              yt.seekTo(videoState.currentTime, true);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    } else if (videoRef.current) {
      const video = videoRef.current;

      if (videoState.playbackRate && video.playbackRate !== videoState.playbackRate) {
        video.playbackRate = videoState.playbackRate;
      }

      if (videoState.currentTime !== undefined) {
        const drift = Math.abs(video.currentTime - videoState.currentTime);
        if (drift > 1.2) {
          video.currentTime = videoState.currentTime;
        }
      }

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
    }
  }, [videoState, isYouTube]);

  // Host Periodic Sync Heartbeat (Both Direct and YouTube)
  useEffect(() => {
    if (!isHost) return;

    const interval = setInterval(() => {
      if (isYouTube && ytPlayerRef.current) {
        try {
          if (typeof ytPlayerRef.current.getCurrentTime === 'function') {
            const curTime = ytPlayerRef.current.getCurrentTime();
            const state = ytPlayerRef.current.getPlayerState();
            const playing = state === window.YT.PlayerState.PLAYING;
            setLocalCurrentTime(curTime);
            emitSyncHeartbeat(curTime, playing);
          }
        } catch (e) {
          // ignore
        }
      } else if (videoRef.current && !videoRef.current.paused) {
        setLocalCurrentTime(videoRef.current.currentTime);
        emitSyncHeartbeat(videoRef.current.currentTime, true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isHost, isYouTube, emitSyncHeartbeat]);

  // Local Time tracking
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

  const handleUnlockAutoplay = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().then(() => {
        setAutoplayBlocked(false);
        setIsMuted(false);
      }).catch((err) => console.warn('Unlock failed:', err));
    }
  };

  // Global Keyboard Shortcuts (Space: Play/Pause, F: Fullscreen, M: Mute, Arrows: Seek)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Do not trigger shortcuts when typing in inputs or textareas
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.code === 'ArrowLeft' && isHost) {
        e.preventDefault();
        const cur = (isYouTube && ytPlayerRef.current)
          ? (ytPlayerRef.current.getCurrentTime() || 0)
          : (videoRef.current?.currentTime || 0);
        handleSeek(Math.max(0, cur - 5));
      } else if (e.code === 'ArrowRight' && isHost) {
        e.preventDefault();
        const cur = (isYouTube && ytPlayerRef.current)
          ? (ytPlayerRef.current.getCurrentTime() || 0)
          : (videoRef.current?.currentTime || 0);
        handleSeek(Math.min(duration || 999999, cur + 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleToggleFullscreen, handleToggleMute, handleSeek, isHost, isYouTube, duration]);

  const [showSubtitles, setShowSubtitles] = useState(true);

  return (
    <div className="cinema-player-wrapper" ref={containerRef}>
      {/* Floating Real-time Emoji Reactions */}
      <FloatingReactions reactions={reactions} />

      {isYouTube ? (
        <div className="youtube-iframe-container" style={{ pointerEvents: isHost ? 'auto' : 'none' }}>
          <div id="youtube-player-mount" style={{ width: '100%', height: '100%' }} />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={videoState.url}
          className={`cinema-video-element ${isFlipped ? 'flipped' : ''}`}
          playsInline
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={isHost ? handlePlayPause : undefined}
          style={{
            cursor: isHost ? 'pointer' : 'default',
            transform: isFlipped ? 'scaleX(-1)' : 'none'
          }}
        >
          {videoState.subtitleUrl && showSubtitles && (
            <track
              kind="subtitles"
              src={videoState.subtitleUrl}
              srcLang="en"
              label="English"
              default
            />
          )}
        </video>
      )}

      {/* Autoplay blocked banner */}
      {autoplayBlocked && (
        <div className="autoplay-blocked-banner">
          <Volume2 size={28} color="var(--accent-primary)" />
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>Audio Muted by Browser</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Click below to unmute and align playback.
            </p>
          </div>
          <button className="btn-primary" onClick={handleUnlockAutoplay}>
            <Play size={16} /> Enable Audio
          </button>
        </div>
      )}

      {/* Unified Custom Controls Bar for both Native Video and YouTube */}
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
        hasSubtitles={Boolean(videoState.subtitleUrl)}
        showSubtitles={showSubtitles}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onSpeedChange={handleSpeedChange}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleFlip={() => setIsFlipped((prev) => !prev)}
        onTogglePiP={handleTogglePiP}
        onToggleSubtitles={() => setShowSubtitles((prev) => !prev)}
        onRequestSync={requestSync}
      />
    </div>
  );
}

export default CinemaPlayer;
