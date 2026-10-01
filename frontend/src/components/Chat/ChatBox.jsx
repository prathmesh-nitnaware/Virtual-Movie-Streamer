import React, { useState, useRef, useEffect } from 'react';
import { Send, Crown } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';

const QUICK_EMOJIS = ['🍿', '❤️', '🔥', '😂', '👏', '🚀', '😱', '🎉'];

export function ChatBox() {
  const { chatMessages, sendMessage, sendReaction, socketId } = useRoom();
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
  };

  return (
    <div className="chat-container">
      {/* Messages Scroll Area */}
      <div className="chat-messages-area" role="log" aria-live="polite" aria-label="Chat messages">
        {chatMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem', fontSize: '0.85rem' }}>
            🍿 Theater chat is quiet. Say hello!
          </div>
        ) : (
          chatMessages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="chat-bubble system">
                  <span className="chat-text">{msg.text}</span>
                </div>
              );
            }

            const isOwn = msg.senderId === socketId;

            return (
              <div key={msg.id} className={`chat-bubble ${isOwn ? 'own' : 'other'}`}>
                <div className="chat-meta">
                  <span className="chat-meta-name" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {msg.isHost && <Crown size={11} color="#fcd34d" />}
                    {msg.sender}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className="chat-text">{msg.text}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Reactions Quick Bar */}
      <div className="quick-reactions-bar" aria-label="Reaction emojis">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="reaction-btn"
            onClick={() => sendReaction(emoji)}
            title={`React with ${emoji}`}
            aria-label={`Send reaction ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="chat-input-bar">
        <input
          type="text"
          className="input-field"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Type a chat message"
          style={{ padding: '8px 12px', fontSize: '0.9rem' }}
        />
        <button type="submit" className="btn-primary" aria-label="Send message" style={{ padding: '8px 14px' }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

export default ChatBox;
