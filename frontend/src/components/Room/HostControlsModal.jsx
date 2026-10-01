import React from 'react';
import { Crown, VolumeX, AlertTriangle, X, Film, Lock, Unlock, Shield } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';

export function HostControlsModal({ onClose, onOpenMediaSelector }) {
  const { muteAll, endRoom, isLocked, toggleRoomLock, isHost } = useRoom();

  const handleEndRoom = () => {
    if (window.confirm('Are you sure you want to end this WatchVerse theater session for all participants?')) {
      endRoom();
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{ width: '100%', maxWidth: '480px', padding: '1.75rem' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="host-controls-title"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 id="host-controls-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
            {isHost ? (
              <>
                <Crown size={20} color="var(--accent-amber)" /> Host Moderation
              </>
            ) : (
              <>
                <Shield size={20} color="var(--accent-cyan)" /> Moderator Controls
              </>
            )}
          </h3>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{ width: 28, height: 28 }}
            aria-label="Close moderation panel"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Change Video (Host only) */}
          {isHost && (
            <button
              type="button"
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
              onClick={() => {
                onClose();
                onOpenMediaSelector();
              }}
              aria-label="Change current movie or stream"
            >
              <Film size={18} color="var(--accent-violet)" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600 }}>Change Movie / Stream</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Load demo movie, YouTube link, or local file</div>
              </div>
            </button>
          )}

          {/* Toggle Room Lock (Host only) */}
          {isHost && (
            <button
              type="button"
              className="btn-secondary"
              style={{
                justifyContent: 'flex-start',
                padding: '12px 16px',
                borderColor: isLocked ? 'var(--accent-amber)' : 'var(--border-subtle)',
                background: isLocked ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-surface)'
              }}
              onClick={toggleRoomLock}
              aria-label={isLocked ? 'Unlock theater for new viewers' : 'Lock theater against new viewers'}
            >
              {isLocked ? <Lock size={18} color="var(--accent-amber)" /> : <Unlock size={18} color="var(--text-muted)" />}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600 }}>{isLocked ? 'Unlock Theater' : 'Lock Theater (Prevent New Viewers)'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {isLocked ? 'Currently locked: New guests cannot enter' : 'Currently open: Anyone with link can join'}
                </div>
              </div>
            </button>
          )}

          {/* Mute All */}
          <button
            type="button"
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => {
              muteAll();
              onClose();
            }}
            aria-label="Mute all participant microphones"
          >
            <VolumeX size={18} color="var(--accent-fuchsia)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>Mute All Microphones</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Forces mic mute for all non-moderator participants</div>
            </div>
          </button>

          {/* End Room (Host only) */}
          {isHost && (
            <button
              type="button"
              className="btn-secondary"
              style={{
                justifyContent: 'flex-start',
                padding: '12px 16px',
                borderColor: 'rgba(244, 63, 94, 0.4)',
                background: 'rgba(244, 63, 94, 0.1)'
              }}
              onClick={handleEndRoom}
              aria-label="End theater session for all participants"
            >
              <AlertTriangle size={18} color="var(--accent-rose)" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>End Theater Session</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disconnects all viewers and closes room</div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default HostControlsModal;
