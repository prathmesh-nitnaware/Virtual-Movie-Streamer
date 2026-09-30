# 🎥 Virtual Movie Streamer v2.0

> **Next-Generation Real-Time Collaborative Virtual Cinema**  
> Watch synchronized videos with friends in perfect harmony, communicate via native peer-to-peer WebRTC video conferencing, enjoy live floating emoji reactions, and manage rooms with intelligent host moderation.

---

## 🌟 Key Upgrades & Highlights (v2.0)

| Feature | Legacy v1.0 | Upgraded v2.0 |
| :--- | :--- | :--- |
| **Frontend Tooling** | Deprecated CRA (`react-scripts 5.0.1`) | **Vite 6 + React 19** (instant HMR, fast builds) |
| **Video Sync Engine** | Local unshared state; desync on join | **Server-Coordinated Millisecond Sync** with late-joiner catchup & drift correction |
| **Media Support** | Local blob URL limitation | **Direct Streams (MP4, WebM, HLS), YouTube embeds, & Curated 4K/HD Demo Library** |
| **WebRTC Video Mesh** | Broken `simple-peer` (payload mismatches, single peer ref) | **Native `RTCPeerConnection` Mesh** with Google STUN, multi-peer grid, and mic/cam fallback |
| **Screen Sharing** | Not available | **1-Click Screen Sharing** into the room mesh |
| **Host Moderation** | Mutating unrendered refs, orphaned rooms | **Reactive Host Crown 👑, Auto Host Migration**, Mute All, Mute User, and End Room |
| **Interactive Social Layer** | Plain text box | **Live Floating Cinema Emoji Reactions (🍿, ❤️, 🔥, 🚀), Timestamps, & System Alerts** |
| **Design & Aesthetics** | Plain monochromatic black boxes | **AMOLED Dark Cinema Theme with Glassmorphism, Neon Violet/Cyan Glows, & Google Fonts** |

---

## 📁 Upgraded Project Structure

```
Virtual-Movie-Streamer/
├── package.json                   # Root monorepo workspace scripts
├── Dockerfile                     # Multi-stage production container build
├── docker-compose.yml             # Single-command container orchestration
├── render.yaml                    # Render.com Blueprint infrastructure-as-code
├── .gitignore                     # Root-level ignore rules
├── .env.example                   # Master environment template
├── DEPLOYMENT.md                  # Comprehensive production deployment manual
├── README.md                      # Project documentation & architecture guide
│
├── backend/                       # Modular Node.js + Express + Socket.IO Backend
│   ├── .env.example               # Backend environment variables
│   ├── package.json               # Backend dependencies & production scripts
│   ├── server.js                  # HTTP & WebSocket server entry point
│   └── src/
│       ├── app.js                 # Express configuration, security, & SPA static serving
│       ├── config/
│       │   └── index.js           # Centralized ports, allowed origins, & STUN servers
│       ├── controllers/
│       │   ├── healthController.js# Uptime, memory, & health metrics
│       │   └── roomController.js  # Room status & diagnostics REST API
│       ├── middlewares/
│       │   ├── corsHandler.js     # Production CORS filter
│       │   └── errorHandler.js    # Centralized error handler
│       ├── routes/
│       │   └── api.js             # REST API router (/api/health, /api/rooms)
│       ├── services/
│       │   └── roomService.js     # In-memory room manager, video state, & drift logic
│       ├── sockets/
│       │   ├── index.js           # Domain socket dispatcher
│       │   ├── roomHandler.js     # Room lifecycle, join/leave, auto-host migration
│       │   ├── videoHandler.js    # Play, pause, seek, playback-rate & heartbeat sync
│       │   ├── webrtcHandler.js   # Native WebRTC signaling (offers, answers, ICE)
│       │   └── chatHandler.js     # Text chat messages & floating emoji reactions
│       └── utils/
│           └── logger.js          # Timestamped structured logger
│
└── frontend/                      # Modern Vite + React 19 Frontend
    ├── index.html                 # Single-page HTML entry with Outfit & Inter typography
    ├── vite.config.js             # Vite configuration with React plugin
    ├── vercel.json                # Vercel SPA routing rules & security headers
    ├── package.json               # Modern dependencies (Lucide icons, Socket.IO client)
    ├── .env.example               # Frontend environment variables
    ├── public/
    │   └── favicon.svg            # Custom cinema logo favicon
    └── src/
        ├── App.jsx                # React Router v7 configuration
        ├── main.jsx               # React 19 root mount
        ├── api/
        │   └── socket.js          # Resilient socket client with auto-reconnection
        ├── constants/
        │   ├── sampleMovies.js    # Curated 4K/HD streaming demo movie catalog
        │   └── appConfig.js       # App constants, emojis, & sync intervals
        ├── context/
        │   └── RoomContext.jsx    # Unified room state, actions & real-time event hub
        ├── hooks/
        │   └── useWebRTC.js       # Native WebRTC mesh hook with STUN & screen sharing
        ├── components/
        │   ├── VideoPlayer/
        │   │   ├── CinemaPlayer.jsx       # Multi-source player (Direct MP4/WebM + YouTube)
        │   │   ├── PlayerControls.jsx     # Sleek custom controls (scrubber, volume, speed)
        │   │   ├── MediaSelector.jsx      # Preset library picker & custom URL loader
        │   │   └── FloatingReactions.jsx  # Floating animated reaction overlay
        │   ├── VideoChat/
        │   │   ├── VideoChatGrid.jsx      # Multi-user responsive video conferencing grid
        │   │   └── PeerVideoCard.jsx      # Individual participant video with status badges
        │   ├── Chat/
        │   │   └── ChatBox.jsx            # Live chat with timestamps & quick emoji bar
        │   └── Room/
        │       ├── RoomHeader.jsx         # Room ID badge, invite link copy, viewer counter
        │       ├── ParticipantList.jsx    # Online viewers list with host moderation controls
        │       └── HostControlsModal.jsx  # Host moderation modal
        ├── pages/
        │   ├── Home.jsx           # Stunning cinema landing page with instant watch launch
        │   └── Room.jsx           # Immersive theater stage layout
        ├── styles/
        │   ├── index.css          # Design system, AMOLED dark theme & glassmorphism
        │   ├── home.css           # Hero section & movie catalog styles
        │   ├── room.css           # Theater stage, chat drawer & participant styles
        │   └── player.css         # Cinema player controls & video grid styles
        └── utils/
            ├── formatters.js      # Time formatting & string utilities
            └── clipboard.js       # Robust clipboard copy helper with fallbacks
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### 1. Install Dependencies
You can install dependencies for both the frontend and backend using the workspace script from the root directory:

```bash
npm run install:all
```

*Or install individually:*
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment Variables (Optional)

**Backend (`backend/.env`):**
```env
PORT=5000
CLIENT_URL=http://localhost:5173,http://localhost:3000,https://virtual-movie-streamer.vercel.app
```

**Frontend (`frontend/.env`):**
```env
VITE_SOCKET_URL=http://localhost:5000
```

---

### 3. Run the Development Environment

Open two terminal tabs:

**Terminal 1 — Backend (Port 5000):**
```bash
cd backend
npm start
```

**Terminal 2 — Frontend (Port 5173):**
```bash
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173/`**.

---

## 🛠️ Architecture & How It Works

### 1. Video Playback Synchronization Engine
- **Host-Controlled Authority:** The room host has sole authority over playback (Play, Pause, Seek, Rate change, and Stream Switching).
- **Elapsed-Time State Store:** The server stores playback state alongside an updated timestamp. When a late viewer joins, the server computes the exact playback offset so the video begins at the exact second the rest of the room is watching.
- **Continuous Heartbeat:** The host emits a periodic sync heartbeat every few seconds. If a viewer experiences network buffering that causes drift (> 1.2s), the player automatically and smoothly aligns without user intervention.
- **Autoplay Handling:** In compliance with modern browser autoplay policies, unmuted autoplay blocks are caught gracefully, displaying a 1-click **"Enable Audio & Sync"** prompt.

### 2. Native Mesh WebRTC Video Conferencing
- Built on standard browser `RTCPeerConnection` without third-party wrapper dependencies.
- Free Google STUN servers (`stun:stun.l.google.com:19302`) ensure reliable NAT traversal.
- **Graceful Error Handling:** If a user lacks a camera or denies permissions, the app does not crash; instead, it renders an animated gradient avatar with initials and keeps movie audio/video and chat intact.
- **Screen Sharing:** Participants or hosts can toggle screen sharing with one click to present slides, alternate video players, or documents directly into the room.

### 3. Smart Host Moderation & Migration
- **First-To-Join Host Assignment:** The user who creates the room is assigned host privileges.
- **Automatic Host Migration:** If the host disconnects or leaves, the server seamlessly promotes the next participant in the room to host and broadcasts a system notification.
- **Moderation Tools:** Host can mute all participants, mute individual disruptive users, transfer host privileges, or close the room.

---

## 🚢 Deployment

### Frontend (Vercel)
- Set Framework to **Vite**.
- Root directory: `client`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Environment Variable: `VITE_SOCKET_URL=https://your-backend.onrender.com`.

### Backend (Render / Railway / Heroku)
- Root directory: `server`.
- Start command: `node server.js`.
- Environment Variable: `CLIENT_URL=https://your-frontend.vercel.app`.
