import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  Film,
  Sparkles,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  Video
} from 'lucide-react';
import SAMPLE_MOVIES from '../assets/sampleMovies';
import '../styles/home.css';

export function Home() {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [usernameInput, setUsernameInput] = useState(() => localStorage.getItem('vms_username') || '');
  const navigate = useNavigate();

  const handleCreateRoom = (presetMovie) => {
    const id = uuidv4().slice(0, 8);
    const finalUsername = usernameInput.trim() || `Host-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('vms_username', finalUsername);
    if (presetMovie) {
      sessionStorage.setItem('vms_initial_movie', JSON.stringify(presetMovie));
    }
    navigate(`/room/${id}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomIdInput.trim()) return;
    const finalUsername = usernameInput.trim() || `Viewer-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('vms_username', finalUsername);
    navigate(`/room/${roomIdInput.trim()}`);
  };

  return (
    <div className="home-page">
      {/* Top Navbar */}
      <nav className="home-nav">
        <a href="/" className="brand-logo">
          <div className="brand-icon">
            <Film size={22} />
          </div>
          <span>Virtual Movie Streamer</span>
        </a>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className="badge badge-live">
            <Radio size={12} /> WebRTC v2.0 Active
          </span>
        </div>
      </nav>

      {/* Main Hero Container */}
      <main className="home-hero">
        <div className="hero-pill">
          <Sparkles size={14} /> Next-Gen Collaborative Virtual Cinema
        </div>

        <h1 className="hero-title">
          Watch Movies Together, <br />
          <span className="glow-text">In Perfect Sync.</span>
        </h1>

        <p className="hero-subtitle">
          Host virtual movie nights with ultra-low latency playback sync, native multi-user
          WebRTC video chat, live floating reactions, and complete host moderation.
        </p>

        {/* Room Launch & Join Card */}
        <div className="cinema-action-box">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'left', fontWeight: 600 }}>
              Your Screen Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alex (optional)"
              className="input-field"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
            />
          </div>

          <div className="action-row">
            <button className="btn-primary" style={{ flex: 1, padding: '14px 20px' }} onClick={() => handleCreateRoom()}>
              <Play size={18} fill="#fff" /> Create New Theater
            </button>
          </div>

          <div className="action-divider">
            <span>Or join existing</span>
          </div>

          <form onSubmit={handleJoinRoom} className="action-row">
            <input
              type="text"
              placeholder="Paste Room ID (e.g. e2a8b9f1)"
              className="input-field"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-secondary" style={{ padding: '12px 20px' }}>
              Join <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Featured Sample Movies Quick Launch */}
        <section className="preset-movies-section">
          <div className="section-header">
            <div>
              <h3>Instant Watch Library</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Click any movie to launch a room instantly with that film pre-loaded
              </p>
            </div>
          </div>

          <div className="movie-cards-grid">
            {SAMPLE_MOVIES.slice(0, 4).map((movie) => (
              <div key={movie.id} className="movie-card" onClick={() => handleCreateRoom(movie)}>
                <img src={movie.thumbnail} alt={movie.title} className="movie-card-thumb" />
                <div className="movie-card-content">
                  <div>
                    <h4 className="movie-card-title">{movie.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {movie.description}
                    </p>
                  </div>
                  <div className="movie-card-meta">
                    <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd' }}>
                      {movie.badge}
                    </span>
                    <span>{movie.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Grid Highlights */}
        <section className="features-grid">
          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Zap size={22} />
            </div>
            <h4 className="feature-title">Millisecond Sync</h4>
            <p className="feature-desc">
              Server-coordinated timestamps ensure play, pause, seek, and playback rates stay tightly synchronized across all viewers without manual adjustment.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Video size={22} />
            </div>
            <h4 className="feature-title">Mesh WebRTC Video</h4>
            <p className="feature-desc">
              P2P crystal clear video and voice chat powered by native browser WebRTC with zero third-party plugin headaches and support for screen sharing.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={22} />
            </div>
            <h4 className="feature-title">Smart Host Controls</h4>
            <p className="feature-desc">
              First user becomes the host with full room moderation powers—mute participants, switch streams, or gracefully migrate host status if they leave.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Sparkles size={22} />
            </div>
            <h4 className="feature-title">Live Emoji Reactions</h4>
            <p className="feature-desc">
              Express excitement during climax scenes with synchronized floating emoji bursts drifting up the cinema canvas in real-time.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
