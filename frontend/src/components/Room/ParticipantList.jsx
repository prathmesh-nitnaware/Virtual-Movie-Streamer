import React from 'react';
import { Crown, Mic, MicOff, VolumeX, UserCheck } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';

export function ParticipantList() {
  const { users, isHost, socketId, muteAll, muteUser, transferHost } = useRoom();

  return (
    <div className="participants-list">
      {/* Host Mute All Bar */}
      {isHost && users.length > 1 && (
        <div style={{ marginBottom: '10px' }}>
          <button
            className="btn-secondary"
            onClick={muteAll}
            style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}
          >
            <VolumeX size={14} color="var(--accent-rose)" /> Mute All Participants
          </button>
        </div>
      )}

      {users.map((user) => {
        const isSelf = user.id === socketId;
        const initial = (user.name || 'U')[0].toUpperCase();

        return (
          <div key={user.id} className="participant-item">
            <div className="participant-info">
              <div className="avatar-circle">{initial}</div>
              <div className="participant-details">
                <span className="participant-name">
                  {user.name} {isSelf && <span style={{ color: 'var(--text-muted)' }}>(You)</span>}
                  {user.isHost && (
                    <span className="badge badge-host" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
                      <Crown size={10} /> Host
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {user.isHost ? 'Room Administrator' : 'Viewer'}
                </span>
              </div>
            </div>

            {/* Moderation actions for host against others */}
            {isHost && !isSelf && (
              <div className="participant-actions">
                <button
                  className="btn-icon"
                  style={{ width: 28, height: 28 }}
                  onClick={() => muteUser(user.id)}
                  title={`Mute ${user.name}`}
                >
                  <MicOff size={13} color="var(--accent-rose)" />
                </button>
                <button
                  className="btn-icon"
                  style={{ width: 28, height: 28 }}
                  onClick={() => transferHost(user.id)}
                  title={`Make ${user.name} Host`}
                >
                  <Crown size={13} color="var(--accent-amber)" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ParticipantList;
