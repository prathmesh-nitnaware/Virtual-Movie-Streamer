import React, { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Crown,
  RotateCcw,
  PictureInPicture2,
  Subtitles,
  FlipHorizontal
} from 'lucide-react';
import { formatTime } from '../../utils/formatters';

export function PlayerControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isHost,
  playbackRate,
  isFullscreen,
  isFlipped,
  isPiP,
  hasSubtitles,
  showSubtitles,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onToggleFullscreen,
  onToggleFlip,
  onTogglePiP,
  onToggleSubtitles,
  onRequestSync
}) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleScrubberClick = (e) => {
    if (!isHost) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = newPercent * (duration || 0);
    onSeek(newTime);
  };

  return (
    <div className={`player-controls-overlay ${!isPlaying ? 'always-visible' : ''}`}>
      {/* Scrubber Bar */}
      <div
        className="scrubber-container"
        onClick={handleScrubberClick}
        title={isHost ? 'Seek playback' : 'Only host can seek'}
        aria-label={isHost ? 'Seek playback position' : 'Playback scrubber (Host controlled)'}
        role={isHost ? 'slider' : 'progressbar'}
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        style={{ cursor: isHost ? 'pointer' : 'default' }}
      >
        <div className="scrubber-track">
          <div className="scrubber-progress" style={{ width: `${progressPercent}%` }}>
            {isHost && <div className="scrubber-thumb" />}
          </div>
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="controls-row">
        <div className="controls-left">
          {/* Play/Pause (Host) or Sync indicator (Viewer) */}
          {isHost ? (
            <button
              type="button"
              className="btn-icon"
              onClick={onPlayPause}
              title={isPlaying ? 'Pause Video' : 'Play Video'}
              aria-label={isPlaying ? 'Pause Video' : 'Play Video'}
              style={{ background: 'var(--accent-gradient)' }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} fill="#fff" />}
            </button>
          ) : (
            <button
              type="button"
              className="btn-icon"
              onClick={onRequestSync}
              title="Resync video with host"
              aria-label="Resync video playback with host"
            >
              <RotateCcw size={16} />
            </button>
          )}

          {/* Volume Control */}
          <div className="volume-wrapper">
            <button
              type="button"
              className="btn-icon"
              onClick={onToggleMute}
              style={{ width: 32, height: 32 }}
              title={isMuted || volume === 0 ? 'Unmute Audio' : 'Mute Audio'}
              aria-label={isMuted || volume === 0 ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="volume-slider"
              aria-label="Volume level"
            />
          </div>

          {/* Time Display */}
          <span className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="controls-right">
          {/* Playback speed (Host only) */}
          {isHost ? (
            <select
              value={playbackRate}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              style={{
                background: 'rgba(22, 26, 43, 0.8)',
                color: '#fff',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
              title="Playback speed"
              aria-label="Select playback speed"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          ) : null}

          {/* Subtitles CC Toggle */}
          {hasSubtitles && (
            <button
              type="button"
              className="btn-icon"
              onClick={onToggleSubtitles}
              title={showSubtitles ? 'Hide Subtitles' : 'Show Subtitles'}
              aria-label={showSubtitles ? 'Hide Subtitles' : 'Show Subtitles'}
              style={{
                width: 32,
                height: 32,
                background: showSubtitles ? 'var(--accent-gradient)' : 'var(--bg-surface)'
              }}
            >
              <Subtitles size={16} />
            </button>
          )}

          {/* Host status indicator */}
          {isHost ? (
            <span className="host-badge-small">
              <Crown size={12} /> Host Control
            </span>
          ) : (
            <span className="participant-notice">Synced with Host</span>
          )}

          {/* Orientation Flip Toggle */}
          <button
            type="button"
            className="btn-icon"
            onClick={onToggleFlip}
            title={isFlipped ? 'Unflip Video (Normal)' : 'Flip Video (Mirror)'}
            aria-label={isFlipped ? 'Unflip Video (Normal)' : 'Flip Video (Mirror)'}
            style={{
              width: 32,
              height: 32,
              background: isFlipped ? 'var(--accent-gradient)' : 'var(--bg-surface)'
            }}
          >
            <FlipHorizontal size={16} />
          </button>

          {/* Picture-in-Picture / Float Video button */}
          <button
            type="button"
            className="btn-icon"
            onClick={onTogglePiP}
            title={isPiP ? 'Exit Floating Picture-in-Picture' : 'Float Video (Picture-in-Picture)'}
            aria-label={isPiP ? 'Exit Floating Picture-in-Picture' : 'Float Video (Picture-in-Picture)'}
            style={{
              width: 32,
              height: 32,
              background: isPiP ? 'var(--accent-gradient)' : 'var(--bg-surface)'
            }}
          >
            <PictureInPicture2 size={16} />
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            className="btn-icon"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerControls;
