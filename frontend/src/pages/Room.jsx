import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Users, AlertCircle, Film, Lock, RefreshCw } from 'lucide-react';
import { RoomProvider, useRoom } from '../context/RoomContext';
import RoomHeader from '../components/Room/RoomHeader';
import CinemaPlayer from '../components/VideoPlayer/CinemaPlayer';
import VideoChatGrid from '../components/VideoChat/VideoChatGrid';
import ChatBox from '../components/Chat/ChatBox';
import ParticipantList from '../components/Room/ParticipantList';
import MediaSelector from '../components/VideoPlayer/MediaSelector';
import HostControlsModal from '../components/Room/HostControlsModal';
import useDocumentTitle from '../hooks/useDocumentTitle';
import '../styles/room.css';
import '../styles/player.css';

function RoomInner() {
  const {
    roomEndedMessage,
    systemAlert,
    isHost,
    changeVideoSource,
    videoState,
    connectionStatus,
    joinError
  } = useRoom();

  useDocumentTitle(
    videoState.title ? `${videoState.title} | Watch Room | WatchVerse` : 'Watch Room | WatchVerse',
    'Real-time synchronized video watch room with live chat, reactions, and WebRTC video conferencing.'
  );

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'participants'
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showHostControls, setShowHostControls] = useState(false);
  const [passwordRetry, setPasswordRetry] = useState('');
  const navigate = useNavigate();

  // If host pre-selected a movie from Home quick launch, load it on mount
  useEffect(() => {
    if (isHost) {
      const storedInitial = sessionStorage.getItem('wv_initial_movie');
      if (storedInitial) {
        try {
          const movie = JSON.parse(storedInitial);
          changeVideoSource(movie.url, movie.title, movie.type, movie.subtitleUrl);
          sessionStorage.removeItem('wv_initial_movie');
        } catch (e) {
          console.warn('Could not parse initial movie:', e);
        }
      }
    }
  }, [isHost, changeVideoSource]);

  // Handle Password retry submission
  const handlePasswordRetry = (e) => {
    e.preventDefault();
    if (!passwordRetry.trim()) return;
    const url = new URL(window.location.href);
    url.searchParams.set('pwd', passwordRetry.trim());
    window.location.href = url.toString();
  };

  return (
    <div className="room-layout">
      {/* Header */}
      <RoomHeader
        onOpenMediaSelector={() => setShowMediaSelector(true)}
        onOpenHostControls={() => setShowHostControls(true)}
      />

      {/* Connection Reconnecting Toast */}
      {connectionStatus === 'reconnecting' && (
        <div
          style={{
            position: 'fixed',
            top: '76px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 150,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(234, 179, 8, 0.95)',
            color: '#000',
            fontWeight: 600,
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            fontSize: '0.85rem'
          }}
        >
          <RefreshCw size={14} className="spin-animation" /> Reconnecting to WatchVerse theater...
        </div>
      )}

      {/* Floating System Alert Toast */}
      {systemAlert && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 99,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(22, 26, 43, 0.95)',
            border: '1px solid var(--accent-violet)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <AlertCircle size={16} color="var(--accent-violet)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{systemAlert}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="theater-stage-container">
        {/* Left Side: Cinema Player + Video Mesh Grid */}
        <div className="cinema-main">
          {/* Main Video Stream */}
          <CinemaPlayer />

          {/* WebRTC Video Chat Grid */}
          <VideoChatGrid />
        </div>

        {/* Right Side: Tabbed Chat & Online Participants Sidebar */}
        <aside className="cinema-sidebar">
          {/* Tabs */}
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
              aria-label="View live chat messages"
            >
              <MessageSquare size={16} /> Live Chat
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveTab('participants')}
              aria-label="View room participants"
            >
              <Users size={16} /> Viewers
            </button>
          </div>

          {/* Tab Content */}
          <div className="sidebar-content">
            {activeTab === 'chat' ? <ChatBox /> : <ParticipantList />}
          </div>
        </aside>
      </div>

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
          onClick={() => setShowMediaSelector(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px' }}>
            <MediaSelector
              currentUrl={videoState.url}
              onSelectMedia={(url, title, type, subtitleUrl) => {
                changeVideoSource(url, title, type, subtitleUrl);
                setShowMediaSelector(false);
              }}
              onClose={() => setShowMediaSelector(false)}
            />
          </div>
        </div>
      )}

      {/* Host Controls Modal */}
      {showHostControls && (
        <HostControlsModal
          onClose={() => setShowHostControls(false)}
          onOpenMediaSelector={() => setShowMediaSelector(true)}
        />
      )}

      {/* Join Error Modal (Password prompt / Locked Room) */}
      {joinError && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 8, 14, 0.96)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '2rem'
          }}
        >
          <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid var(--accent-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: 'var(--accent-violet)'
              }}
            >
              <Lock size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Theater Access Required</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              {joinError}
            </p>

            <form onSubmit={handlePasswordRetry} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="password"
                required
                placeholder="Enter room password"
                className="input-field"
                value={passwordRetry}
                onChange={(e) => setPasswordRetry(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Unlock & Enter Theater
              </button>
              <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/')}>
                Return to Home
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Room Ended Notice Modal */}
      {roomEndedMessage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 8, 14, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '440px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                color: 'var(--accent-rose)'
              }}
            >
              <Film size={28} />
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Theater Session Ended</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {roomEndedMessage}
            </p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/')}>
              Return to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Room() {
  const { roomId } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const urlPassword = searchParams.get('pwd');
  const storedPassword = sessionStorage.getItem(`wv_pass_${roomId}`);
  const password = urlPassword || storedPassword || null;

  const username = localStorage.getItem('wv_username') || `User-${Math.floor(1000 + Math.random() * 9000)}`;

  if (!roomId) {
    return null;
  }

  return (
    <RoomProvider roomId={roomId} username={username} password={password}>
      <RoomInner />
    </RoomProvider>
  );
}

export default Room;
