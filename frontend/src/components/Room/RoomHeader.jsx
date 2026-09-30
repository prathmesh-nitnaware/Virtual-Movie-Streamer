import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Users, Film, LogOut, Settings, Crown } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { copyToClipboard } from '../../utils/clipboard';

export function RoomHeader({ onOpenMediaSelector, onOpenHostControls }) {
  const { roomId, users, isHost, videoState } = useRoom();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div className="brand-icon" style={{ width: 32, height: 32 }}>
            <Film size={18} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
            VMS
          </span>
        </div>

        {/* Room Code Badge */}
        <div className="room-id-badge" onClick={handleCopyLink} title="Click to copy invite link">
          <span>Room: <strong>{roomId.slice(0, 8)}...</strong></span>
          {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
        </div>
      </div>

      <div className="header-center">
        {/* Current Movie Name */}
        <div className="current-movie-tag" title={videoState.title}>
          <Film size={14} color="var(--accent-violet)" />
          <span>{videoState.title || 'Cinema Stream'}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Host Change Video Button */}
        {isHost && (
          <button
            className="btn-secondary"
            onClick={onOpenMediaSelector}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          >
            <Film size={14} /> Change Video
          </button>
        )}

        {/* Host Settings */}
        {isHost && (
          <button
            className="btn-icon"
            onClick={onOpenHostControls}
            title="Host Moderation Controls"
            style={{ width: 36, height: 36 }}
          >
            <Settings size={16} />
          </button>
        )}

        {/* Online Count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <Users size={14} />
          <span>{users.length}</span>
        </div>

        {/* Leave Room */}
        <button
          className="btn-icon"
          onClick={handleLeaveRoom}
          title="Exit Theater"
          style={{ width: 36, height: 36, borderColor: 'rgba(244, 63, 94, 0.4)' }}
        >
          <LogOut size={16} color="var(--accent-rose)" />
        </button>
      </div>
    </header>
  );
}

export default RoomHeader;
