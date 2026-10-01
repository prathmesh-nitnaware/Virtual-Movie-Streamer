import React from 'react';

/**
 * WatchVerseLogo — Official Brand Logo & Monogram Emblem
 * Combines cinema aperture squircle, stylized 'W' mesh geometry,
 * synchronized play triangle, and live-sync beacon.
 */
export function WatchVerseLogo({
  size = 32,
  showText = true,
  className = '',
  textClassName = '',
  animate = false,
}) {
  return (
    <div
      className={`watchverse-brand-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showText ? '10px' : '0',
        userSelect: 'none',
      }}
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        {/* Cinema Obsidian Squircle */}
        <rect width="64" height="64" rx="14" fill="#090b13" />
        <rect
          x="1.5"
          y="1.5"
          width="61"
          height="61"
          rx="12.5"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeOpacity="0.9"
        />

        {/* Stylized W Geometry */}
        <path
          d="M13 19 L21.5 45 L32 29 L42.5 45 L51 19"
          stroke="#818cf8"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Synchronized Cinema Play Core Triangle */}
        <polygon points="29,26 41,34 29,42" fill="#ffffff" />

        {/* Live Sync Beacon */}
        <circle cx="32" cy="17" r="3.5" fill="#6366f1" />
        <circle cx="32" cy="17" r="1.5" fill="#ffffff" />
      </svg>

      {showText && (
        <span
          className={`brand-title-text ${textClassName}`}
          style={{
            fontFamily: 'var(--font-display, "Outfit", sans-serif)',
            fontWeight: 800,
            fontSize: size >= 36 ? '1.4rem' : size >= 28 ? '1.25rem' : '1.1rem',
            letterSpacing: '-0.02em',
            color: '#f8fafc',
            lineHeight: 1,
          }}
        >
          Watch<span style={{ color: '#818cf8' }}>Verse</span>
        </span>
      )}
    </div>
  );
}

export default WatchVerseLogo;
