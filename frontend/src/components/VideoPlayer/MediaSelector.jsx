import React, { useState } from 'react';
import { Film, Link2, Check, Sparkles, Video } from 'lucide-react';
import SAMPLE_MOVIES from '../../assets/sampleMovies';

export function MediaSelector({ currentUrl, onSelectMedia, onClose }) {
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'custom'

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const url = customUrl.trim();
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const type = isYouTube ? 'youtube' : 'direct';
    const title = customTitle.trim() || (isYouTube ? 'YouTube Stream' : 'Custom Video');

    onSelectMedia(url, title, type);
    if (onClose) onClose();
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', maxWidth: '580px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
          <Film size={20} color="var(--accent-violet)" /> Change Movie Stream
        </h3>
        {onClose && (
          <button className="btn-icon" onClick={onClose} style={{ width: 28, height: 28 }}>
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
        <button
          className={activeTab === 'library' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setActiveTab('library')}
        >
          <Sparkles size={14} /> Preset Library
        </button>
        <button
          className={activeTab === 'custom' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setActiveTab('custom')}
        >
          <Link2 size={14} /> Custom URL / YouTube
        </button>
      </div>

      {activeTab === 'library' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
          {SAMPLE_MOVIES.map((movie) => {
            const isSelected = movie.url === currentUrl;
            return (
              <div
                key={movie.id}
                onClick={() => {
                  onSelectMedia(movie.url, movie.title, movie.type);
                  if (onClose) onClose();
                }}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-surface)',
                  border: isSelected ? '1px solid var(--accent-violet)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <img
                  src={movie.thumbnail}
                  alt={movie.title}
                  style={{ width: '80px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {movie.title}
                    </span>
                    {movie.type === 'youtube' && <Video size={14} color="#f43f5e" />}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {movie.duration} • {movie.badge}
                  </span>
                </div>
                {isSelected && <Check size={18} color="var(--accent-violet)" />}
              </div>
            );
          })}
        </div>
      ) : (
        <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Stream / Video URL (Direct MP4, WebM, or YouTube Link)
            </label>
            <input
              type="url"
              required
              className="input-field"
              placeholder="https://example.com/video.mp4 or https://youtube.com/watch?v=..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Movie Title (Optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Inception 4K Trailer"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '6px' }}>
            Load Movie Stream
          </button>
        </form>
      )}
    </div>
  );
}

export default MediaSelector;
