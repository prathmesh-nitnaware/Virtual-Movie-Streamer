import React from 'react';
import { Link } from 'react-router-dom';
import WatchVerseLogo from './WatchVerseLogo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" className="brand-logo-link" aria-label="WatchVerse Home" style={{ textDecoration: 'none' }}>
            <WatchVerseLogo size={28} />
          </Link>
          <p className="footer-tagline">Watch together. Anywhere.</p>
        </div>

        <nav className="footer-links" aria-label="Footer Navigation">
          <Link to="/" className="footer-link">Home</Link>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          <Link to="/terms" className="footer-link">Terms & Conditions</Link>
        </nav>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          &copy; {currentYear} WatchVerse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
