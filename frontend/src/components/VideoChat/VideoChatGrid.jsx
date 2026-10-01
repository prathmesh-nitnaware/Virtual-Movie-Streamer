import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  AlertCircle,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';
import PeerVideoCard from './PeerVideoCard';
import useWebRTC from '../../hooks/useWebRTC';
import { useRoom } from '../../context/RoomContext';

export function VideoChatGrid() {
  const { roomId, hostId, socketId, micForcedMuted } = useRoom();
  const username =
    localStorage.getItem('wv_username') ||
    localStorage.getItem('vms_username') ||
    `User-${socketId?.slice(0, 4) || 'me'}`;

  const {
    localStream,
    remotePeers,
    isMicOn,
    isCamOn,
    isScreenSharing,
    mediaError,
    toggleMic,
    toggleCam,
    toggleScreenShare
  } = useWebRTC(roomId, username, micForcedMuted);

  const [isFloating, setIsFloating] = useState(() => {
    const saved = localStorage.getItem('wv_video_floating') ?? localStorage.getItem('vms_video_floating');
    return saved !== 'false';
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleFloating = () => {
    setIsFloating((prev) => {
      const next = !prev;
      localStorage.setItem('wv_video_floating', String(next));
      return next;
    });
  };

  const isSelfHost = socketId === hostId;
  const peerList = Object.entries(remotePeers);
  const totalCount = peerList.length + 1;

  return (
    <div className={`video-chat-section ${isFloating ? 'video-chat-floating' : 'video-chat-docked'}`}>
      {/* Video Call Controls Toolbar */}
      <div className="video-chat-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="video-chat-mode-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Cameras' : 'Minimize Cameras'}
            aria-label={isCollapsed ? 'Expand Cameras' : 'Minimize Cameras'}
          >
            <Users size={14} color="var(--accent-violet)" />
            <span>Cameras ({totalCount})</span>
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {mediaError && (
            <span className="media-error-badge" title={mediaError}>
              <AlertCircle size={12} /> {mediaError}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Toggle Floating vs Docked layout */}
          <button
            type="button"
            className="btn-icon"
            onClick={handleToggleFloating}
            title={isFloating ? 'Dock cameras below cinema player' : 'Float cameras over cinema video'}
            aria-label={isFloating ? 'Dock cameras below cinema player' : 'Float cameras over cinema video'}
            style={{
              width: 28,
              height: 28,
              background: isFloating ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              borderColor: isFloating ? 'var(--accent-violet)' : 'var(--border-subtle)'
            }}
          >
            {isFloating ? <Pin size={13} color="var(--accent-violet)" /> : <PinOff size={13} />}
          </button>

          {/* Mic Button */}
          <button
            type="button"
            className="btn-icon"
            onClick={toggleMic}
            title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            aria-label={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            style={{
              width: 28,
              height: 28,
              background: isMicOn ? 'rgba(255, 255, 255, 0.08)' : 'rgba(244, 63, 94, 0.25)',
              borderColor: isMicOn ? 'var(--border-subtle)' : 'var(--accent-rose)'
            }}
          >
            {isMicOn ? <Mic size={13} /> : <MicOff size={13} color="var(--accent-rose)" />}
          </button>

          {/* Camera Button */}
          <button
            type="button"
            className="btn-icon"
            onClick={toggleCam}
            title={isCamOn ? 'Turn Camera Off' : 'Turn Camera On'}
            aria-label={isCamOn ? 'Turn Camera Off' : 'Turn Camera On'}
            style={{
              width: 28,
              height: 28,
              background: isCamOn ? 'rgba(255, 255, 255, 0.08)' : 'rgba(244, 63, 94, 0.25)',
              borderColor: isCamOn ? 'var(--border-subtle)' : 'var(--accent-rose)'
            }}
          >
            {isCamOn ? <Video size={13} /> : <VideoOff size={13} color="var(--accent-rose)" />}
          </button>

          {/* Screen Share Button */}
          <button
            type="button"
            className="btn-icon"
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            aria-label={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            style={{
              width: 28,
              height: 28,
              background: isScreenSharing ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.08)',
              borderColor: isScreenSharing ? 'var(--accent-violet)' : 'var(--border-subtle)'
            }}
          >
            <ScreenShare size={13} />
          </button>
        </div>
      </div>

      {/* Grid / Row of compact video cards */}
      {!isCollapsed && (
        <div className={isFloating ? 'floating-cards-row' : 'docked-cards-row'}>
          {/* Self Video Card */}
          <PeerVideoCard
            stream={localStream}
            username={username}
            isHost={isSelfHost}
            isSelf={true}
            isMicOn={isMicOn}
            isCamOn={isCamOn}
          />

          {/* Remote Peers Cards */}
          {peerList.map(([peerId, peerData]) => (
            <PeerVideoCard
              key={peerId}
              stream={peerData.stream}
              username={peerData.username}
              isHost={peerId === hostId}
              isSelf={false}
              isMicOn={true}
              isCamOn={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default VideoChatGrid;
