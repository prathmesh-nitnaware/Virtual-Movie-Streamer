import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Footer from '../components/Common/Footer';
import WatchVerseLogo from '../components/Common/WatchVerseLogo';

export function NotFound() {
  useDocumentTitle(
    'Page Not Found | WatchVerse',
    'The requested page or watch room could not be found. Return to WatchVerse to create or join a real-time theater.'
  );

  return (
    <div className="home-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Nav */}
      <header className="home-nav-wrapper">
        <div className="home-nav-container">
          <Link to="/" className="brand-logo" aria-label="WatchVerse Home" style={{ textDecoration: 'none' }}>
            <WatchVerseLogo size={32} />
          </Link>
        </div>
      </header>

      {/* 404 Body */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 1.5rem',
          textAlign: 'center'
        }}
      >
        <div
          className="glass-panel"
          style={{
            maxWidth: '520px',
            width: '100%',
            padding: '3rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid var(--accent-violet)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-violet)'
            }}
          >
            <Film size={36} />
          </div>

          <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
            Error 404
          </span>

          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Page Not Found</h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            The page or theater session you are looking for does not exist, has expired, or has moved to a new destination.
          </p>

          <Link
            to="/"
            className="btn-primary"
            style={{ marginTop: '0.5rem', padding: '12px 28px', textDecoration: 'none' }}
          >
            <Home size={18} /> Back to WatchVerse
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default NotFound;
