import React from 'react';

export function FloatingReactions({ reactions }) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="floating-reactions-overlay">
      {reactions.map((reaction) => (
        <span
          key={reaction.id}
          className="floating-emoji"
          style={{
            left: `${reaction.xOffset || 50}%`
          }}
        >
          {reaction.emoji}
        </span>
      ))}
    </div>
  );
}

export default FloatingReactions;
