import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Video, Database, Cookie } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Footer from '../components/Common/Footer';
import WatchVerseLogo from '../components/Common/WatchVerseLogo';

export function Privacy() {
  useDocumentTitle(
    'Privacy Policy | WatchVerse',
    'Learn how WatchVerse handles your data with privacy-first ephemeral rooms, peer-to-peer WebRTC video, and zero tracking cookies.'
  );

  return (
    <div className="home-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <header className="home-nav-wrapper">
        <div className="home-nav-container">
          <Link to="/" className="brand-logo" aria-label="WatchVerse Home" style={{ textDecoration: 'none' }}>
            <WatchVerseLogo size={32} />
          </Link>
          <Link to="/" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="legal-container" style={{ flex: 1, maxWidth: '840px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <div className="hero-pill" style={{ marginBottom: '1rem' }}>
          <ShieldCheck size={14} /> Privacy &amp; Data Transparency
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '1rem' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          Last updated: October 2026
        </p>

        <div className="legal-card glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--accent-violet)" /> 1. Ephemeral Room Architecture
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              WatchVerse is engineered with an ephemeral-by-design architecture. Watch rooms, live chat messages, participant lists, and reaction states exist only in memory during an active viewing session. When all participants exit a room or the host terminates the session, the room memory is destroyed. We do not store persistent chat logs or viewing histories.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={18} color="var(--accent-cyan)" /> 2. Real-Time WebRTC Media
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Camera video, microphone audio, and screen sharing are transmitted directly between peer browsers using standard WebRTC peer-to-peer connections. Video and audio streams are never recorded, analyzed, or stored on our servers. The backend signaling server only negotiates SDP offers, answers, and ICE candidates to facilitate peer discovery.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="var(--accent-fuchsia)" /> 3. Video Synchronization Data
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              To synchronize media playback across viewers, our server processes lightweight timestamp events (play, pause, seek, and playback rate). These synchronization signals are processed solely in real time to coordinate clients within the same room.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cookie size={18} color="var(--accent-amber)" /> 4. Local Storage &amp; Cookies
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              WatchVerse does not use third-party advertising or behavioral tracking cookies. We utilize standard browser <code style={{ color: 'var(--accent-violet)' }}>localStorage</code> and <code style={{ color: 'var(--accent-violet)' }}>sessionStorage</code> solely to store your chosen display name and audio preference flags on your local device.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem' }}>
              5. Contact &amp; Inquiries
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              For questions regarding this Privacy Policy or data security on WatchVerse, please contact the repository administrator or host at your organization's designated support channel.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Privacy;
