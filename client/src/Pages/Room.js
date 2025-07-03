import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { v4 as uuidv4 } from 'uuid';
import VideoPlayer from '../components/VideoPlayer';
import VideoChat from '../components/VideoChat';
import './Room.css';

function Room() {
  const { roomId } = useParams();
  const [videoSrc, setVideoSrc] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const username = useRef('User-' + uuidv4().slice(0, 4));
  const isHost = useRef(false);

  useEffect(() => {
    socket.connect();
    socket.emit('join-room', {
      roomId,
      username: username.current,
    });

    socket.on('receive-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('room-users', (userList) => {
      setUsers(userList);
      if (userList.length && userList[0].id === socket.id) {
        isHost.current = true;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const sendMessage = () => {
    if (input.trim() === '') return;
    const fullMessage = `${username.current}: ${input}`;
    setMessages((prev) => [...prev, fullMessage]);

    socket.emit('send-message', {
      roomId,
      message: fullMessage,
    });

    setInput('');
  };

  const handleMuteAll = () => {
    socket.emit('mute-all', { roomId });
  };

  const handleEndRoom = () => {
    socket.emit('end-room', { roomId });
  };

  const handleMuteUser = (id) => {
    socket.emit('mute-user', { targetId: id });
  };

  return (
    <div className="main-container">
      <div className="left-section">
        <h2 className="room-title">Room: <code>{roomId}</code></h2>

        <div className="video-form">
          <label>Paste MP4/YouTube Link</label>
          <input
            type="text"
            className="room-input"
            onChange={(e) => setVideoSrc(e.target.value)}
            placeholder="https://example.com/video.mp4"
          />
          <label>Or Upload a Video</label>
          <input
            type="file"
            className="room-input"
            accept="video/mp4,video/webm"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setVideoSrc(url);
              }
            }}
          />
        </div>

        {videoSrc && <VideoPlayer roomId={roomId} videoSrc={videoSrc} />}
        <VideoChat roomId={roomId} />

        <div className="chat-box">
          <h5 className="chat-title">💬 Live Chat</h5>
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className="chat-message">{msg}</div>
            ))}
          </div>
          <div className="chat-input">
            <input
              className="room-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button className="home-button" onClick={sendMessage}>Send</button>
          </div>
        </div>

        {isHost.current && (
          <div className="host-controls">
            <button className="home-button" onClick={handleMuteAll}>🔇 Mute All</button>
            <button className="home-button" onClick={handleEndRoom}>🛑 End Room</button>
          </div>
        )}
      </div>

      <div className="right-section">
        <h5 className="chat-title">👥 Online</h5>
        <ul className="participant-list">
          {users.map((u) => (
            <li key={u.id}>
              {u.name} {u.id === socket.id ? '(You)' : ''}
              {isHost.current && u.id !== socket.id && (
                <button className="btn btn-sm btn-danger ms-2" onClick={() => handleMuteUser(u.id)}>
                  🔇 Mute
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Room;
