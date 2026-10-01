# 🎬 WatchVerse

<div align="center">

<p align="center">
  <img src="frontend/public/favicon.svg" width="96" height="96" alt="WatchVerse Logo" />
</p>

### **Watch together. Anywhere.**

An enterprise-grade, real-time synchronized cinema and collaborative streaming platform.  
Built with server-authoritative playback synchronization, native WebRTC video/voice mesh, live chat, floating reactions, role-based moderation, and multi-source video playback.

[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Native_Mesh-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Express](https://img.shields.io/badge/Express-5.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 🌟 Highlights & Capabilities

### ⚡ 1. Millisecond Playback Synchronization
- **Server-Authoritative Clock**: State changes increment a strictly monotonic `stateVersion`. Out-of-order and stale playback commands are automatically dropped.
- **Dynamic Late-Join Calculation**: Viewers joining mid-stream receive exact playback offsets calculated on the server (`currentTime = baseTime + (now - updatedAt)`).
- **Periodic Host Heartbeats & Drift Correction**: Active host sync broadcasts keep all participants aligned within milliseconds without stutter.

### 📹 2. Native WebRTC Audio/Video Mesh
- **Decoupled `MediaTransport` Interface**: Modular transport abstraction supporting full mesh P2P communication, ready for SFU routing.
- **Camera, Microphone & Screen Share**: Multi-party video grid with speaker indicators, dynamic layout resizing, and local track muting.
- **ICE Candidate Queueing & Resilient Traversal**: Candidate caching prevents race conditions during SDP negotiation with fallback across Google STUN servers.

### 🎬 3. Universal Multi-Source Media Engine
- **Direct HTML5 Media**: High-performance streaming of MP4, WebM, and adaptive HLS streams.
- **YouTube IFrame API Integration**: Synchronized playback, buffering, seeking, and pause control across YouTube media.
- **Local File Streaming**: Host can stream local video files via browser Object URLs with synchronized controls.
- **Subtitles & Closed Captions**: Support for WebVTT and SRT subtitle tracks with customizable player styling.

### 🛡️ 4. Role-Based Moderation & Host Failover
- **Hierarchical Permissions**: `HOST`, `MODERATOR`, and `PARTICIPANT` roles.
- **Host Control Center**: Room locking, password protection, force-muting participant microphones, and participant kicks.
- **Automatic Host Migration**: If the host disconnects, the server automatically promotes the next moderator or oldest participant with zero stream disruption.

### 💬 5. Social Chat, Reactions & Acoustic Feedback
- **Real-Time Live Chat**: Rate-limited messaging, typing indicators, auto-scroll locking, and FIFO history pruning (100 messages).
- **Floating Reactions**: Interactive emoji reactions with synchronized canvas animations across all room participants.
- **Synthesized Web Audio**: Low-latency, zero-dependency procedural audio cues for chat, reactions, and room events.

### 🎨 6. Premium Digital Cinema Aesthetic
- **Solid Dark Palette**: Obsidian `#090b13` canvas, elevated `#141726` surfaces, and `#818cf8` indigo accents.
- **Engineered Layout**: 1200px desktop grid, 3-column 16:9 media catalog, asymmetric hero composition, and mobile responsiveness down to 320px.

---

## 📐 System Architecture

```
                                    ┌────────────────────────┐
                                    │    WatchVerse Client   │
                                    │   (React 19 + Vite 6)  │
                                    └───────────┬────────────┘
                                                │
                          ┌─────────────────────┴─────────────────────┐
                          │                                           │
           HTTP REST & WebSocket (ws://)                 P2P WebRTC Signaling (SDP/ICE)
                          │                                           │
                          ▼                                           ▼
             ┌─────────────────────────┐                 ┌─────────────────────────┐
             │    Node.js / Express 5  │                 │    WebRTC Mesh Peers    │
             │   Socket.IO Coordinator │                 │    (Direct Audio/Video) │
             └────────────┬────────────┘                 └─────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌───────────────────┐           ┌───────────────────┐
│ RoomService State │           │   Media Sources   │
│ - Authoritative   │           │ - MP4 / HLS Video │
│ - stateVersion    │           │ - YouTube IFrame  │
│ - Host Migration  │           │ - Local Files     │
└───────────────────┘           └───────────────────┘
```

For complete sequence diagrams, drift calculation equations, and concurrency models, see **[`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md)**.

---

## 📂 Repository Structure

```text
WatchVerse/
├── package.json                   # Root scripts (build, test, dev, lint)
├── Dockerfile                     # Multi-stage production container build
├── docker-compose.yml             # Docker container orchestration
├── render.yaml                    # Render Blueprint infrastructure-as-code
├── SYSTEM_DESIGN.md               # Technical architecture & sequence diagrams
├── DEPLOYMENT.md                  # Comprehensive production deployment guide
├── README.md                      # Platform overview and documentation
│
├── backend/                       # Node.js + Express 5 + Socket.IO Server
│   ├── .env.example               # Server environment configuration template
│   ├── package.json               # Backend dependencies & test runners
│   ├── server.js                  # HTTP & WebSocket server entry point
│   ├── tests/
│   │   └── roomService.test.js    # Automated unit test suite (10 test suites)
│   └── src/
│       ├── app.js                 # Express app configuration & static middleware
│       ├── config/                # Environment variables, CORS origins & STUN config
│       ├── controllers/           # Health (/api/health) and room diagnostics
│       ├── middlewares/           # CORS filtering and centralized error handling
│       ├── routes/                # REST API routes
│       ├── services/              # Authoritative RoomService state engine
│       ├── sockets/               # Domain handlers (room, video, webrtc, chat)
│       └── utils/                 # Structured logging utility
│
└── frontend/                      # React 19 + Vite 6 Frontend Application
    ├── index.html                 # HTML entry with Open Graph & Twitter meta tags
    ├── vite.config.js             # Vite bundler configuration
    ├── vercel.json                # Vercel SPA rewrites & security headers
    ├── package.json               # Frontend dependencies
    ├── public/
    │   ├── favicon.svg            # Vector WatchVerse brand emblem
    │   ├── favicon.ico            # Multi-resolution ICO icon
    │   ├── logo192.png            # High-res PWA icon
    │   ├── og-image.svg           # Social preview card
    │   ├── robots.txt             # Web crawler indexing rules
    │   └── sitemap.xml            # XML sitemap
    └── src/
        ├── App.jsx                # React Router v7 routes & layout wrapper
        ├── main.jsx               # React 19 mount
        ├── api/                   # Socket.IO client instance & reconnection logic
        ├── constants/             # Verified sample movie catalog & presets
        ├── context/               # Unified RoomContext state management
        ├── hooks/                 # Custom hooks (useWebRTC, useDocumentTitle)
        ├── services/              # MediaTransport WebRTC abstraction
        ├── components/
        │   ├── Common/            # WatchVerseLogo, Footer, Modals
        │   ├── VideoPlayer/       # CinemaPlayer, PlayerControls, MediaSelector
        │   ├── VideoChat/         # VideoChatGrid, PeerVideoCard
        │   ├── Chat/              # ChatBox, MessageList
        │   └── Room/              # RoomHeader, ParticipantList, HostControlsModal
        ├── pages/                 # Home, Room, Privacy, Terms, NotFound
        ├── styles/                # index.css, home.css, room.css, player.css
        └── utils/                 # Procedural audio synthesis & formatting helpers
```

---

## 🚀 Quickstart & Local Development

### Prerequisites
- **Node.js**: `v18.0.0` or higher (tested on Node 20 & 24)
- **npm**: `v9.0.0` or higher

### 1. Installation
Install all dependencies across root, backend, and frontend with a single command:
```bash
npm run install:all
```

### 2. Configure Environment
Backend default variables are ready out-of-the-box in `backend/.env.example`:
```bash
cp backend/.env.example backend/.env
```

### 3. Run Locally (Concurrent)
Launch both backend and frontend development servers:

```bash
# Terminal 1 — Backend (Port 5000)
cd backend
npm start

# Terminal 2 — Frontend (Port 5173)
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173/`**.

---

## 🐳 Docker Deployment

Run the entire application in a production container with one command:

```bash
docker compose up --build -d
```
The application will be live at `http://localhost:5000`.

---

## 🧪 Automated Testing & Build Validation

### Backend Unit Tests
Execute the native Node.js test runner covering room state, authorization, late-joining, and host migration:

```bash
cd backend
npm test
```
```text
▶ WatchVerse — RoomService Unit Tests
  ✔ should create a room with default authoritative video state and version 1
  ✔ should assign HOST role to first user and PARTICIPANT role to second user
  ✔ should increment stateVersion on video state updates
  ✔ should accurately calculate current playback offset for late joiners
  ✔ should enforce password and lock verification
  ✔ should correctly evaluate host and moderator authorization
  ✔ should reject invalid role assignments
  ✔ should enforce 100-message chat history FIFO boundary
  ✔ should manage video mesh peer tracking lifecycle
  ✔ should automatically promote moderator or oldest participant when host leaves
✔ WatchVerse — RoomService Unit Tests (10 suites, 10 passing)
```

### Frontend Production Build
Validate production bundling and tree-shaking:

```bash
cd frontend
npm run build
```

---

## 🌐 Production Deployment Guide

| Platform | Role | Configuration |
| :--- | :--- | :--- |
| **Render** | Backend Signaling API | **Root Dir**: `backend`<br>**Build**: `npm install`<br>**Start**: `node server.js`<br>**Env**: `PORT=10000`, `NODE_ENV=production`, `CLIENT_URL=https://your-app.vercel.app`<br>**Health Path**: `/api/health` |
| **Vercel** | Frontend SPA | **Root Dir**: `frontend`<br>**Preset**: `Vite`<br>**Build**: `npm run build`<br>**Output**: `dist`<br>**Env**: `VITE_SOCKET_URL=https://your-api.onrender.com` |

For detailed step-by-step instructions, see **[`DEPLOYMENT.md`](./DEPLOYMENT.md)**.

---

## 📡 REST & WebSocket Event Protocol

### REST Health Endpoint
```http
GET /api/health
```
```json
{
  "status": "ok",
  "service": "WatchVerse Backend API",
  "tagline": "Watch together. Anywhere.",
  "version": "1.0.0",
  "uptimeSeconds": 1420,
  "activeRooms": 3,
  "activeUsers": 8
}
```

### Core WebSocket Events (`Socket.IO`)
| Direction | Event Name | Payload Summary |
| :--- | :--- | :--- |
| Client ➔ Server | `room:join` | `{ roomId, username, password }` |
| Server ➔ Client | `room:joined` | `{ room, user, isHost, role }` |
| Client ➔ Server | `video:play` / `video:pause` | `{ roomId, currentTime, stateVersion }` |
| Server ➔ Client | `video:sync` | `{ videoState: { isPlaying, currentTime, updatedAt, stateVersion } }` |
| Client ➔ Client | `webrtc:offer` / `webrtc:answer` | `{ target, sdp, sender }` |
| Client ➔ Client | `webrtc:ice-candidate` | `{ target, candidate }` |
| Client ➔ Server | `chat:send` | `{ roomId, text }` |
| Client ➔ Server | `reaction:send` | `{ roomId, emoji }` |
| Client ➔ Server | `room:lock` / `room:mute-all` | `{ roomId, locked }` (Host/Moderator only) |

---

## 📄 License

This project is licensed under the **MIT License**.
