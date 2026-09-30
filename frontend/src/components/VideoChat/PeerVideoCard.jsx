import React, { useEffect, useRef, useState } from 'react';
import { MicOff, Crown, VideoOff } from 'lucide-react';

export function PeerVideoCard({
  stream,
  username,
  isHost,
  isSelf,
  isMicOn,
  isCamOn
}) {
  const videoRef = useRef(null);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const initial = (username || 'U')[0].toUpperCase();

  return (
    <div className="peer-card">
      {/* Video Element if Camera is On and stream exists */}
      {isCamOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf} // always mute self to prevent feedback loop
          className={`peer-video ${isFlipped ? 'flipped' : ''}`}
          style={{ transform: isFlipped ? 'scaleX(-1)' : 'none' }}
        />
      ) : (
        <div className="peer-avatar-fallback">
          <div className="avatar-large">{initial}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Camera Off</span>
        </div>
      )}

      {/* Overlay Badge */}
      <div className="peer-card-overlay">
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
          {isHost && <Crown size={12} color="#fcd34d" />}
          {username} {isSelf && '(You)'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Quick flip toggle button */}
          {isCamOn && stream && (
            <button
              type="button"
              className="btn-icon"
              style={{ width: 22, height: 22, fontSize: '0.75rem', padding: 0 }}
              onClick={() => setIsFlipped(!isFlipped)}
              title={isFlipped ? 'Unflip video (Normal)' : 'Flip video (Mirror)'}
            >
              🔄
            </button>
          )}
          {!isMicOn && <MicOff size={13} color="var(--accent-rose)" />}
          {!isCamOn && <VideoOff size={13} color="var(--text-muted)" />}
        </div>
      </div>
    </div>
  );
}

export default PeerVideoCard;
