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
  Sparkles,
  PictureInPicture2
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
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onToggleFullscreen,
  onToggleFlip,
  onTogglePiP,
  onRequestSync
}) {
  const [hoverTime, setHoverTime] = useState(null);

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
              className="btn-icon"
              onClick={onPlayPause}
              title={isPlaying ? 'Pause Video' : 'Play Video'}
              style={{ background: 'var(--accent-gradient)' }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} fill="#fff" />}
            </button>
          ) : (
            <button
              className="btn-icon"
              onClick={onRequestSync}
              title="Resync video with host"
            >
              <RotateCcw size={16} />
            </button>
          )}

          {/* Volume Control */}
          <div className="volume-wrapper">
            <button className="btn-icon" onClick={onToggleMute} style={{ width: 32, height: 32 }}>
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
            >
              <option value="0.5">0.5x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          ) : null}

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
            className="btn-icon"
            onClick={onToggleFlip}
            title={isFlipped ? 'Unflip Video (Normal)' : 'Flip Video (Mirror)'}
            style={{
              width: 32,
              height: 32,
              background: isFlipped ? 'var(--accent-gradient)' : 'var(--bg-surface)'
            }}
          >
            🔄
          </button>

          {/* Picture-in-Picture / Float Video button */}
          <button
            className="btn-icon"
            onClick={onTogglePiP}
            title={isPiP ? 'Exit Floating Picture-in-Picture' : 'Float Video (Picture-in-Picture)'}
            style={{
              width: 32,
              height: 32,
              background: isPiP ? 'var(--accent-gradient)' : 'var(--bg-surface)'
            }}
          >
            <PictureInPicture2 size={16} />
          </button>

          {/* Fullscreen Button */}
          <button className="btn-icon" onClick={onToggleFullscreen} title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerControls;
