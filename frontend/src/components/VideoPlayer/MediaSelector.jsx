import React, { useState } from 'react';
import { Film, Link2, Check, Sparkles, Video, Upload, X } from 'lucide-react';
import SAMPLE_MOVIES from '../../assets/sampleMovies';

// Helper to convert SRT text content into standard WebVTT format
function srtToVtt(srtText) {
  let vtt = 'WEBVTT\n\n';
  // Replace comma decimal separators with periods in timecodes (00:00:01,000 -> 00:00:01.000)
  vtt += srtText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return vtt;
}

export function MediaSelector({ currentUrl, onSelectMedia, onClose }) {
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitles, setCustomSubtitles] = useState('');
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'custom' | 'local'
  const [selectedLocalFile, setSelectedLocalFile] = useState(null);
  const [selectedSubtitleFile, setSelectedSubtitleFile] = useState(null);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const url = customUrl.trim();
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const type = isYouTube ? 'youtube' : 'direct';
    const title = customTitle.trim() || (isYouTube ? 'YouTube Stream' : 'Custom Video');

    onSelectMedia(url, title, type, customSubtitles.trim() || null);
    if (onClose) onClose();
  };

  const handleLocalFileSubmit = (e) => {
    e.preventDefault();
    if (!selectedLocalFile) return;

    const objectUrl = URL.createObjectURL(selectedLocalFile);
    let subtitleUrl = null;

    if (selectedSubtitleFile) {
      if (selectedSubtitleFile.name.endsWith('.srt')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const vttContent = srtToVtt(evt.target.result);
          const vttBlob = new Blob([vttContent], { type: 'text/vtt' });
          subtitleUrl = URL.createObjectURL(vttBlob);
          onSelectMedia(objectUrl, selectedLocalFile.name, 'direct', subtitleUrl);
          if (onClose) onClose();
        };
        reader.readAsText(selectedSubtitleFile);
        return;
      } else {
        subtitleUrl = URL.createObjectURL(selectedSubtitleFile);
      }
    }

    onSelectMedia(objectUrl, selectedLocalFile.name, 'direct', subtitleUrl);
    if (onClose) onClose();
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', maxWidth: '600px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
          <Film size={20} color="var(--accent-violet)" /> Change Movie Stream
        </h3>
        {onClose && (
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{ width: 28, height: 28 }}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
        <button
          type="button"
          className={activeTab === 'library' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          onClick={() => setActiveTab('library')}
          aria-label="View preset video library"
        >
          <Sparkles size={14} /> Preset Library
        </button>
        <button
          type="button"
          className={activeTab === 'custom' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          onClick={() => setActiveTab('custom')}
          aria-label="Enter custom video or YouTube URL"
        >
          <Link2 size={14} /> Custom / YouTube
        </button>
        <button
          type="button"
          className={activeTab === 'local' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          onClick={() => setActiveTab('local')}
          aria-label="Play local video file"
        >
          <Upload size={14} /> Local File
        </button>
      </div>

      {activeTab === 'library' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
          {SAMPLE_MOVIES.map((movie) => {
            const isSelected = movie.url === currentUrl;
            return (
              <div
                key={movie.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onSelectMedia(movie.url, movie.title, movie.type);
                  if (onClose) onClose();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectMedia(movie.url, movie.title, movie.type);
                    if (onClose) onClose();
                  }
                }}
                aria-label={`Select ${movie.title}`}
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
                  alt={`${movie.title} thumbnail`}
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
      )}

      {activeTab === 'custom' && (
        <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label htmlFor="custom-video-url" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Stream / Video URL (Direct MP4, WebM, HLS, or YouTube)
            </label>
            <input
              id="custom-video-url"
              type="url"
              required
              className="input-field"
              placeholder="https://example.com/video.mp4 or https://youtube.com/watch?v=..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="custom-video-title" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Movie Title (Optional)
            </label>
            <input
              id="custom-video-title"
              type="text"
              className="input-field"
              placeholder="e.g. Inception 4K Trailer"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="custom-video-subs" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Subtitle URL (.vtt or .srt) (Optional)
            </label>
            <input
              id="custom-video-subs"
              type="url"
              className="input-field"
              placeholder="https://example.com/subtitles.vtt"
              value={customSubtitles}
              onChange={(e) => setCustomSubtitles(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '6px' }} aria-label="Load movie stream">
            Load Movie Stream
          </button>
        </form>
      )}

      {activeTab === 'local' && (
        <form onSubmit={handleLocalFileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label htmlFor="local-video-file" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Select Video File (MP4, WebM, MKV)
            </label>
            <input
              id="local-video-file"
              type="file"
              accept="video/mp4,video/webm,video/mkv,video/*"
              required
              className="input-field"
              style={{ padding: '8px' }}
              onChange={(e) => setSelectedLocalFile(e.target.files[0])}
            />
          </div>

          <div>
            <label htmlFor="local-subtitle-file" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Optional Subtitles (.vtt or .srt)
            </label>
            <input
              id="local-subtitle-file"
              type="file"
              accept=".vtt,.srt"
              className="input-field"
              style={{ padding: '8px' }}
              onChange={(e) => setSelectedSubtitleFile(e.target.files[0])}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={!selectedLocalFile} style={{ marginTop: '6px' }} aria-label="Play local video file">
            <Upload size={16} /> Play Local File
          </button>
        </form>
      )}
    </div>
  );
}

export default MediaSelector;
