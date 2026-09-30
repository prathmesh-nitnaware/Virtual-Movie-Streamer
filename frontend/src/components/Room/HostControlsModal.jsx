import React from 'react';
import { Crown, VolumeX, AlertTriangle, X, Film, Share2 } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';

export function HostControlsModal({ onClose, onOpenMediaSelector }) {
  const { muteAll, endRoom, roomId } = useRoom();

  const handleEndRoom = () => {
    if (window.confirm('Are you sure you want to end this room for all participants?')) {
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
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
            <Crown size={20} color="var(--accent-amber)" /> Host Controls
          </h3>
          <button className="btn-icon" onClick={onClose} style={{ width: 28, height: 28 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Change Video */}
          <button
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => {
              onClose();
              onOpenMediaSelector();
            }}
          >
            <Film size={18} color="var(--accent-violet)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>Change Movie / Stream</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Choose demo movie or paste new URL</div>
            </div>
          </button>

          {/* Mute All */}
          <button
            className="btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => {
              muteAll();
              onClose();
            }}
          >
            <VolumeX size={18} color="var(--accent-fuchsia)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>Mute All Microphones</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Forces mic mute for all non-host viewers</div>
            </div>
          </button>

          {/* End Room */}
          <button
            className="btn-secondary"
            style={{
              justifyContent: 'flex-start',
              padding: '12px 16px',
              borderColor: 'rgba(244, 63, 94, 0.4)',
              background: 'rgba(244, 63, 94, 0.1)'
            }}
            onClick={handleEndRoom}
          >
            <AlertTriangle size={18} color="var(--accent-rose)" />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>End Room for Everyone</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disconnects all viewers and closes theater</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default HostControlsModal;
