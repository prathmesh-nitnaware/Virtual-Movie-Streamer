import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle2, ShieldAlert, Scale, AlertOctagon } from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Footer from '../components/Common/Footer';
import WatchVerseLogo from '../components/Common/WatchVerseLogo';

export function Terms() {
  useDocumentTitle(
    'Terms & Conditions | WatchVerse',
    'Review the terms and conditions for using WatchVerse, including room hosting policies, media synchronization rules, and acceptable use.'
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
          <FileText size={14} /> Usage Terms &amp; Guidelines
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: '1rem' }}>Terms &amp; Conditions</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          Last updated: October 2026
        </p>

        <div className="legal-card glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--accent-emerald)" /> 1. Acceptance of Terms
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              By accessing or using WatchVerse, you agree to comply with these Terms &amp; Conditions. If you do not agree to these terms, please discontinue using the service immediately.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="var(--accent-cyan)" /> 2. Content &amp; Media Rights
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              WatchVerse provides synchronization software and WebRTC communication tools. Users are solely responsible for ensuring they have lawful rights and licenses for any media files, direct URLs, or external streams played within their watch rooms. WatchVerse does not host, store, or distribute copyrighted video catalog assets on its central servers.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={18} color="var(--accent-violet)" /> 3. Room Host &amp; Moderator Authority
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Room creators (hosts) and designated moderators hold authoritative control over their individual viewing rooms. Hosts may mute participants, lock rooms, transfer hosting roles, or remove disruptive participants at their discretion.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={18} color="var(--accent-rose)" /> 4. Acceptable Conduct
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Users agree not to utilize WatchVerse for transmitting harmful code, harassing others, broadcasting illegal content, or attempting unauthorized disruption of the signaling servers or peer connections.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '0.75rem' }}>
              5. Disclaimer &amp; Limitation of Liability
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              WatchVerse is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis without warranties of any kind. The maintainers and developers are not liable for any direct, indirect, or incidental damages arising from the use or inability to use this platform.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Terms;
