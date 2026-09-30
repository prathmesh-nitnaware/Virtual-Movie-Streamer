import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Users, AlertCircle, Film } from 'lucide-react';
import { RoomProvider, useRoom } from '../context/RoomContext';
import RoomHeader from '../components/Room/RoomHeader';
import CinemaPlayer from '../components/VideoPlayer/CinemaPlayer';
import VideoChatGrid from '../components/VideoChat/VideoChatGrid';
import ChatBox from '../components/Chat/ChatBox';
import ParticipantList from '../components/Room/ParticipantList';
import MediaSelector from '../components/VideoPlayer/MediaSelector';
import HostControlsModal from '../components/Room/HostControlsModal';
import '../styles/room.css';
import '../styles/player.css';

function RoomInner() {
  const {
    roomEndedMessage,
    systemAlert,
    isHost,
    changeVideoSource,
    videoState
  } = useRoom();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'participants'
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showHostControls, setShowHostControls] = useState(false);
  const navigate = useNavigate();

  // If host pre-selected a movie from Home quick launch, load it on mount
  useEffect(() => {
    if (isHost) {
      const storedInitial = sessionStorage.getItem('vms_initial_movie');
      if (storedInitial) {
        try {
          const movie = JSON.parse(storedInitial);
          changeVideoSource(movie.url, movie.title, movie.type);
          sessionStorage.removeItem('vms_initial_movie');
        } catch (e) {
          console.warn('Could not parse initial movie:', e);
        }
      }
    }
  }, [isHost, changeVideoSource]);

  return (
    <div className="room-layout">
      {/* Header */}
      <RoomHeader
        onOpenMediaSelector={() => setShowMediaSelector(true)}
        onOpenHostControls={() => setShowHostControls(true)}
      />

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
            >
              <MessageSquare size={16} /> Live Chat
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveTab('participants')}
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
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '580px' }}>
            <MediaSelector
              currentUrl={videoState.url}
              onSelectMedia={(url, title, type) => {
                changeVideoSource(url, title, type);
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
  const username = localStorage.getItem('vms_username') || `User-${Math.floor(1000 + Math.random() * 9000)}`;

  if (!roomId) {
    return null;
  }

  return (
    <RoomProvider roomId={roomId} username={username}>
      <RoomInner />
    </RoomProvider>
  );
}

export default Room;
