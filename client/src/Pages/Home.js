import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './Home.css'; // custom styling

function Home() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const createRoom = () => {
    const id = uuidv4();
    navigate(`/room/${id}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) navigate(`/room/${roomId}`);
  };

  return (
    <div className="home-container">
      <h1 className="home-title">VIRTUAL MOVIE STREAMER</h1>

      <div className="home-actions">
        <button className="home-button" onClick={createRoom}>CREATE ROOM</button>
        <input
          className="home-input"
          placeholder="Enter room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button className="home-button" onClick={joinRoom}>JOIN ROOM</button>
      </div>
    </div>
  );
}

export default Home;
