import React from 'react';
import { Crown, Mic, MicOff, VolumeX, Shield, UserX, ScreenShare } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';

export function ParticipantList() {
  const { users, isHost, isModerator, socketId, muteAll, muteUser, kickUser, setRole, transferHost } = useRoom();

  return (
    <div className="participants-list" role="list" aria-label="Room participants">
      {/* Host / Moderator Mute All Bar */}
      {isModerator && users.length > 1 && (
        <div style={{ marginBottom: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={muteAll}
            style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}
            aria-label="Mute all non-moderator participants"
          >
            <VolumeX size={14} color="var(--accent-rose)" /> Mute All Participants
          </button>
        </div>
      )}

      {users.map((user) => {
        const isSelf = user.id === socketId;
        const initial = (user.name || 'U')[0].toUpperCase();
        const userIsHost = user.role === 'HOST' || user.isHost;
        const userIsMod = user.role === 'MODERATOR';

        return (
          <div key={user.id} className="participant-item" role="listitem">
            <div className="participant-info">
              <div className="avatar-circle" style={{ position: 'relative' }}>
                {initial}
                {user.screenSharing && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      background: 'var(--accent-violet)',
                      borderRadius: '50%',
                      padding: '2px',
                      display: 'flex'
                    }}
                    title="Screen Sharing"
                    aria-label="Screen sharing active"
                  >
                    <ScreenShare size={10} color="#fff" />
                  </span>
                )}
              </div>
              <div className="participant-details">
                <span className="participant-name">
                  {user.name} {isSelf && <span style={{ color: 'var(--text-muted)' }}>(You)</span>}
                  {userIsHost && (
                    <span className="badge badge-host" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
                      <Crown size={10} /> Host
                    </span>
                  )}
                  {userIsMod && (
                    <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', padding: '2px 6px', fontSize: '0.65rem' }}>
                      <Shield size={10} /> Mod
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {userIsHost ? 'Theater Host' : userIsMod ? 'Moderator' : 'Viewer'}
                </span>
              </div>
            </div>

            {/* Status and Moderation actions */}
            <div className="participant-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              {/* Media status indicators */}
              {user.micMuted ? (
                <span title="Microphone muted" aria-label={`${user.name}'s microphone is muted`}>
                  <MicOff size={13} color="var(--accent-rose)" />
                </span>
              ) : (
                <span title="Microphone active" aria-label={`${user.name}'s microphone is active`}>
                  <Mic size={13} color="var(--accent-emerald)" />
                </span>
              )}

              {/* Moderation actions for host/mod against others */}
              {!isSelf && !userIsHost && (
                <>
                  {isModerator && (
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ width: 26, height: 26 }}
                      onClick={() => muteUser(user.id)}
                      title={`Mute ${user.name}`}
                      aria-label={`Mute microphone of ${user.name}`}
                    >
                      <MicOff size={12} color="var(--accent-rose)" />
                    </button>
                  )}

                  {isHost && (
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ width: 26, height: 26 }}
                      onClick={() => setRole(user.id, userIsMod ? 'PARTICIPANT' : 'MODERATOR')}
                      title={userIsMod ? `Demote ${user.name}` : `Make ${user.name} Moderator`}
                      aria-label={userIsMod ? `Demote ${user.name} to participant` : `Promote ${user.name} to moderator`}
                    >
                      <Shield size={12} color={userIsMod ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                    </button>
                  )}

                  {isHost && (
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ width: 26, height: 26 }}
                      onClick={() => transferHost(user.id)}
                      title={`Transfer Host to ${user.name}`}
                      aria-label={`Transfer Host role to ${user.name}`}
                    >
                      <Crown size={12} color="var(--accent-amber)" />
                    </button>
                  )}

                  {isModerator && (
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ width: 26, height: 26 }}
                      onClick={() => kickUser(user.id)}
                      title={`Remove ${user.name} from room`}
                      aria-label={`Remove ${user.name} from theater`}
                    >
                      <UserX size={12} color="var(--accent-rose)" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ParticipantList;
