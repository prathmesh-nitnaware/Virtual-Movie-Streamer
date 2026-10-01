import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Copy, Check, Users, Film, LogOut, Settings, Bell, BellOff, Lock, Shield } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { copyToClipboard } from '../../utils/clipboard';
import soundEffects from '../../utils/soundEffects';
import WatchVerseLogo from '../Common/WatchVerseLogo';

export function RoomHeader({ onOpenMediaSelector, onOpenHostControls }) {
  const { roomId, roomName, users, isHost, isModerator, isLocked, videoState } = useRoom();
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => soundEffects.isEnabled());
  const navigate = useNavigate();

  const handleToggleSound = () => {
    const next = !soundEnabled;
    soundEffects.setEnabled(next);
    setSoundEnabled(next);
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  return (
    <header className="room-header">
      <div className="header-left">
        <Link to="/" className="brand-logo" aria-label="WatchVerse Home" style={{ textDecoration: 'none' }}>
          <WatchVerseLogo size={28} />
        </Link>

        {/* Room Code & Name Badge */}
        <div
          className="room-id-badge"
          onClick={handleCopyLink}
          title="Click to copy invite link"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCopyLink();
            }
          }}
          aria-label={`Room invite link for ${roomName || roomId.slice(0, 8)}. Click to copy.`}
        >
          {isLocked && <Lock size={13} color="var(--color-warning)" />}
          <span>{roomName || `Room ${roomId.slice(0, 8)}`}</span>
          {copied ? <Check size={13} color="var(--color-success)" /> : <Copy size={13} />}
        </div>
      </div>

      <div className="header-center">
        {/* Current Movie Name */}
        <div className="current-movie-tag" title={videoState.title}>
          <Film size={14} color="var(--accent-primary)" />
          <span>{videoState.title || 'Cinema Stream'}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Host Change Video Button */}
        {isHost && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenMediaSelector}
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            aria-label="Change current movie or video stream"
          >
            <Film size={13} /> Change Video
          </button>
        )}

        {/* Host/Moderator Settings */}
        {isModerator && (
          <button
            type="button"
            className="btn-icon"
            onClick={onOpenHostControls}
            title={isHost ? 'Host Moderation Controls' : 'Moderator Controls'}
            aria-label={isHost ? 'Host Moderation Controls' : 'Moderator Controls'}
          >
            {isHost ? <Settings size={15} /> : <Shield size={15} color="var(--color-info)" />}
          </button>
        )}

        {/* Sound Effects Toggle */}
        <button
          type="button"
          className="btn-icon"
          onClick={handleToggleSound}
          title={soundEnabled ? 'Mute Sound Effects' : 'Enable Popcorn & Chat Sound Effects'}
          aria-label={soundEnabled ? 'Mute Sound Effects' : 'Enable Popcorn and Chat Sound Effects'}
        >
          {soundEnabled ? <Bell size={15} color="var(--accent-primary)" /> : <BellOff size={15} color="var(--text-muted)" />}
        </button>

        {/* Online Count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-card)',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
          aria-label={`${users.length} viewers online`}
        >
          <Users size={13} />
          <span>{users.length}</span>
        </div>

        {/* Leave Room */}
        <button
          type="button"
          className="btn-icon"
          onClick={handleLeaveRoom}
          title="Exit Theater"
          aria-label="Exit Theater and return to home"
          style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}
        >
          <LogOut size={15} color="var(--color-danger)" />
        </button>
      </div>
    </header>
  );
}

export default RoomHeader;
