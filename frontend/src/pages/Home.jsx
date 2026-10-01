import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  Film,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  Video,
  Lock,
  Globe,
  Users,
  Tv,
  CheckCircle2
} from 'lucide-react';
import SAMPLE_MOVIES from '../constants/sampleMovies';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Footer from '../components/Common/Footer';
import WatchVerseLogo from '../components/Common/WatchVerseLogo';
import useBackendStatus from '../hooks/useBackendStatus';
import '../styles/home.css';

export function Home() {
  useDocumentTitle(
    'WatchVerse | Watch together. Anywhere.',
    'Synchronized video playback with real-time WebRTC audio and video, live chat, and host moderation controls.'
  );

  const { status: backendStatus, isWaking, isReady, wake } = useBackendStatus();
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [usernameInput, setUsernameInput] = useState(() => localStorage.getItem('wv_username') || '');
  const [roomNameInput, setRoomNameInput] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const navigate = useNavigate();

  const handleCreateRoom = (presetMovie = null) => {
    wake(); // ensure wake signal is sent
    const chosenMovie = presetMovie || selectedMovie;
    const finalId = uuidv4().slice(0, 8);
    const finalUsername = usernameInput.trim() || `Host-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('wv_username', finalUsername);

    if (chosenMovie) {
      sessionStorage.setItem('wv_initial_movie', JSON.stringify(chosenMovie));
    }
    if (passwordInput.trim() && isPrivate) {
      sessionStorage.setItem(`wv_pass_${finalId}`, passwordInput.trim());
    }

    navigate(`/room/${finalId}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomIdInput.trim()) return;
    wake(); // ensure wake signal is sent
    const finalId = roomIdInput.trim().replace(/^.*\/room\//, ''); // handle pasted full URLs
    const finalUsername = usernameInput.trim() || `Viewer-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('wv_username', finalUsername);

    if (passwordInput.trim()) {
      sessionStorage.setItem(`wv_pass_${finalId}`, passwordInput.trim());
    }

    navigate(`/room/${finalId}`);
  };

  return (
    <div className="home-page">
      {/* Top Navbar */}
      <header className="home-nav-wrapper">
        <div className="home-nav-container">
          <Link to="/" className="brand-logo" aria-label="WatchVerse Home" style={{ textDecoration: 'none' }}>
            <WatchVerseLogo size={32} />
          </Link>

          <div
            className="nav-status-indicator"
            title={
              backendStatus === 'ready'
                ? 'Backend server is active & responsive'
                : 'Pinging backend health endpoint (warming up cold start)...'
            }
          >
            <span className={`status-dot ${backendStatus}`}></span>
            <span>
              {backendStatus === 'ready'
                ? 'Sync Engine Active'
                : backendStatus === 'waking' || backendStatus === 'checking'
                ? 'Waking Server...'
                : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="home-main-content">
        {/* Asymmetric Hero Section */}
        <section className="home-hero-section">
          <div className="hero-grid">
            {/* Left Column: Product Positioning & Headlines */}
            <div className="hero-content">
              <div className="hero-badge">
                <Radio size={14} color="var(--accent-primary)" />
                <span>Synchronized Video &amp; WebRTC Mesh</span>
              </div>

              <h1 className="hero-headline">
                Watch together. <br />
                Anywhere.
              </h1>

              <p className="hero-description">
                Host synchronized cinema rooms with millisecond playback alignment, native browser audio and video communication, live chat, and authoritative host controls.
              </p>

              <div className="hero-meta-row">
                <div className="hero-meta-item">
                  <CheckCircle2 size={15} color="var(--color-success)" />
                  <span>Server-Authoritative Sync</span>
                </div>
                <div className="hero-meta-item">
                  <CheckCircle2 size={15} color="var(--color-success)" />
                  <span>P2P WebRTC Voice &amp; Video</span>
                </div>
                <div className="hero-meta-item">
                  <CheckCircle2 size={15} color="var(--color-success)" />
                  <span>MP4, HLS &amp; YouTube</span>
                </div>
              </div>
            </div>

            {/* Right Column: Primary Create / Join Room Action Surface */}
            <div className="hero-action-panel">
              <div className="panel-header">
                <div className="action-tabs">
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                    aria-label="Create a new watch room"
                  >
                    <Play size={15} /> Create Room
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
                    onClick={() => setActiveTab('join')}
                    aria-label="Join an existing watch room"
                  >
                    <Users size={15} /> Join Room
                  </button>
                </div>
              </div>

              <div className="panel-body">
                <div>
                  <label htmlFor="username-input" className="field-label">
                    Your Display Name
                  </label>
                  <input
                    id="username-input"
                    type="text"
                    placeholder="e.g. Alex"
                    className="input-field"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                  />
                </div>

                {activeTab === 'create' ? (
                  <>
                    <div className="field-row">
                      <div style={{ flex: 1 }}>
                        <label htmlFor="roomname-input" className="field-label">
                          Room Name (Optional)
                        </label>
                        <input
                          id="roomname-input"
                          type="text"
                          placeholder="e.g. Friday Movie Night"
                          className="input-field"
                          value={roomNameInput}
                          onChange={(e) => setRoomNameInput(e.target.value)}
                        />
                      </div>

                      <div style={{ alignSelf: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setIsPrivate(!isPrivate)}
                          className={isPrivate ? 'btn-secondary active-toggle' : 'btn-secondary'}
                          style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                          title="Toggle password protection"
                          aria-label="Toggle password protection"
                        >
                          {isPrivate ? <Lock size={14} color="var(--color-warning)" /> : <Globe size={14} />}
                          {isPrivate ? ' Password' : ' Public'}
                        </button>
                      </div>
                    </div>

                    {isPrivate && (
                      <div>
                        <label htmlFor="room-password-input" className="field-label">
                          Room Password
                        </label>
                        <input
                          id="room-password-input"
                          type="password"
                          placeholder="Set room password"
                          className="input-field"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-primary action-submit-btn"
                      onClick={() => handleCreateRoom()}
                      aria-label="Create Watch Room"
                    >
                      <Play size={16} /> Create Watch Room
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label htmlFor="join-room-id" className="field-label">
                        Room Code or Invite URL
                      </label>
                      <input
                        id="join-room-id"
                        type="text"
                        required
                        placeholder="e.g. AB12CD or https://domain/room/AB12CD"
                        className="input-field"
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="join-room-password" className="field-label">
                        Password (If room is protected)
                      </label>
                      <input
                        id="join-room-password"
                        type="password"
                        placeholder="Enter password (optional)"
                        className="input-field"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary action-submit-btn"
                      aria-label="Join Watch Room"
                    >
                      Enter Watch Room <ArrowRight size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Demo Video Catalog Section */}
        <section className="catalog-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Demo Video Catalog</h2>
              <p className="section-subtitle">
                Select an open-source media stream to launch a synchronized room with sample media preloaded.
              </p>
            </div>
          </div>

          <div className="movie-cards-grid">
            {SAMPLE_MOVIES.map((movie) => (
              <div
                key={movie.id}
                className="movie-card"
                onClick={() => handleCreateRoom(movie)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCreateRoom(movie);
                  }
                }}
                aria-label={`Launch session with ${movie.title}`}
              >
                <div className="movie-card-thumb-wrapper">
                  <img
                    src={movie.thumbnail}
                    alt={`${movie.title} thumbnail`}
                    className="movie-card-thumb"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="movie-card-badge-overlay">
                    <span className="card-badge">{movie.badge}</span>
                  </div>
                </div>

                <div className="movie-card-content">
                  <div>
                    <h3 className="movie-card-title">{movie.title}</h3>
                    <p className="movie-card-desc">{movie.description}</p>
                  </div>
                  <div className="movie-card-meta">
                    <span className="duration-tag">{movie.duration}</span>
                    <span className="launch-action">Launch Room &rarr;</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture & Engineering Capabilities */}
        <section className="features-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Platform Capabilities</h2>
              <p className="section-subtitle">
                Engineered for sub-second synchronization and reliable browser-to-browser media delivery.
              </p>
            </div>
          </div>

          <div className="features-grid">
            <div className="feature-box">
              <div className="feature-icon-wrapper">
                <Zap size={20} />
              </div>
              <h3 className="feature-title">Authoritative State Synchronization</h3>
              <p className="feature-desc">
                Server-managed monotonic revision numbering (stateVersion), periodic heartbeats, and late-join offset math maintain playback synchronization across all connected viewers.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper">
                <Video size={20} />
              </div>
              <h3 className="feature-title">WebRTC Mesh Communication</h3>
              <p className="feature-desc">
                Low-latency peer-to-peer audio, video, and screen sharing with ICE candidate queueing, multi-STUN traversal, and automatic fallback avatars.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={20} />
              </div>
              <h3 className="feature-title">Role-Based Moderation</h3>
              <p className="feature-desc">
                Hierarchical role enforcement (Host, Moderator, Participant) with participant muting, room access locks, role delegation, and automatic host migration.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper">
                <Tv size={20} />
              </div>
              <h3 className="feature-title">Multi-Source Playback Engine</h3>
              <p className="feature-desc">
                Native HTML5 direct playback (MP4, WebM, HLS), official YouTube IFrame API integration, local file streaming via Object URLs, and WebVTT/SRT subtitles.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
