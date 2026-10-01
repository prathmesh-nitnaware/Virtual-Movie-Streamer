# WatchVerse

> **Watch together. Anywhere.**  
> A real-time collaborative watch platform with server-coordinated playback synchronization, native P2P WebRTC audio/video conferencing, live chat, reactions, and role-based moderation.

---

## Capabilities & Architecture

| Component | Engineering Implementation |
| :--- | :--- |
| **Playback Synchronization** | Server-authoritative state with monotonic revision numbers (`stateVersion`), elapsed-time offset calculation for late joiners, periodic host heartbeats, and client drift correction. |
| **Multi-Source Playback** | Native HTML5 media (MP4, WebM, HLS), official **YouTube IFrame API**, local file streaming via Object URLs, and WebVTT/SRT subtitle track support. |
| **WebRTC Media Transport** | Decoupled `MediaTransport` interface with native `RTCPeerConnection` mesh, ICE candidate queueing, multi-STUN traversal, and screen sharing. |
| **Role-Based Moderation** | `HOST`, `MODERATOR`, and `PARTICIPANT` hierarchy. Host controls include room locking, microphone muting, role assignment, and automatic host migration. |
| **Social Communication** | Live chat with rate limiting and payload bounding, typing indicators, floating reactions, and Web Audio synthesized sound feedback. |
| **Resilience & Security** | Reconnection recovery, CORS origin validation, server-side payload validation, and in-memory room lifecycle with auto-teardown. |

---

## Directory Structure

```text
WatchVerse/
├── package.json                   # Root workspace scripts (build, test, dev)
├── Dockerfile                     # Multi-stage production container build
├── docker-compose.yml             # Container orchestration
├── render.yaml                    # Render Blueprint infrastructure-as-code
├── SYSTEM_DESIGN.md               # System architecture & sequence diagrams
├── DEPLOYMENT.md                  # Production deployment manual
├── README.md                      # Technical documentation
│
├── backend/                       # Node.js + Express + Socket.IO Backend
│   ├── .env.example               # Backend environment variables
│   ├── package.json               # Backend dependencies & test scripts
│   ├── server.js                  # HTTP & WebSocket server entry point
│   ├── tests/
│   │   └── roomService.test.js    # Automated unit tests (10 suites)
│   └── src/
│       ├── app.js                 # Express configuration, CORS & SPA static serving
│       ├── config/
│       │   └── index.js           # Ports, allowed origins & STUN servers
│       ├── controllers/
│       │   ├── healthController.js# System health & metrics REST API (/api/health)
│       │   └── roomController.js  # Room diagnostics REST API (/api/rooms)
│       ├── middlewares/
│       │   ├── corsHandler.js     # Production CORS origin filter
│       │   └── errorHandler.js    # Centralized error handler
│       ├── routes/
│       │   └── api.js             # REST API router
│       ├── services/
│       │   └── roomService.js     # Authoritative room state, roles & sync engine
│       ├── sockets/
│       │   ├── index.js           # Domain socket dispatcher
│       │   ├── roomHandler.js     # Room lifecycle, moderation & migration
│       │   ├── videoHandler.js    # Versioned video sync, seek & heartbeat
│       │   ├── webrtcHandler.js   # WebRTC signaling (offers, answers, ICE)
│       │   └── chatHandler.js     # Rate-limited chat & reactions
│       └── utils/
│           └── logger.js          # Structured logger
│
└── frontend/                      # Vite + React 19 Frontend
    ├── index.html                 # HTML entry with Open Graph & Twitter metadata
    ├── vite.config.js             # Vite configuration
    ├── vercel.json                # Vercel SPA routing rules & security headers
    ├── package.json               # Frontend dependencies
    ├── public/
    │   ├── favicon.svg            # WatchVerse brand icon
    │   ├── og-image.svg           # Open Graph social preview
    │   ├── robots.txt             # Web crawler configuration
    │   └── sitemap.xml            # Sitemap for public routes
    └── src/
        ├── App.jsx                # React Router v7 routes (/, /room/:id, /privacy, /terms, 404)
        ├── main.jsx               # React 19 root mount
        ├── api/
        │   └── socket.js          # Socket client with auto-reconnect
        ├── assets/
        │   └── sampleMovies.js    # Curated open-source video catalog
        ├── context/
        │   └── RoomContext.jsx    # Unified room state & event dispatcher
        ├── hooks/
        │   ├── useDocumentTitle.js# Dynamic document title & meta description sync
        │   └── useWebRTC.js       # WebRTC transport hook
        ├── services/
        │   └── mediaTransport.js  # WebRTC MediaTransport abstraction (Mesh & SFU ready)
        ├── components/
        │   ├── Common/
        │   │   └── Footer.jsx     # Accessible footer with dynamic copyright
        │   ├── VideoPlayer/
        │   │   ├── CinemaPlayer.jsx       # Multi-source player (Direct MP4 + YouTube)
        │   │   ├── PlayerControls.jsx     # Controls (scrubber, volume, speed, CC, PiP)
        │   │   ├── MediaSelector.jsx      # Library, YouTube URL & local file loader
        │   │   └── FloatingReactions.jsx  # Floating reaction canvas
        │   ├── VideoChat/
        │   │   ├── VideoChatGrid.jsx      # Responsive camera & screen-share grid
        │   │   └── PeerVideoCard.jsx      # Individual participant video card
        │   ├── Chat/
        │   │   └── ChatBox.jsx            # Live chat with rate limiting
        │   └── Room/
        │       ├── RoomHeader.jsx         # Room navigation, invite copy, sound toggle
        │       ├── ParticipantList.jsx    # Viewers list with moderation controls
        │       └── HostControlsModal.jsx  # Moderation modal (Lock, Mute All, End Room)
        ├── pages/
        │   ├── Home.jsx           # Landing page with Create & Join actions
        │   ├── Room.jsx           # Theater room stage
        │   ├── Privacy.jsx        # Ephemeral room & WebRTC privacy policy
        │   ├── Terms.jsx          # Usage terms & media rights policy
        │   └── NotFound.jsx       # Custom 404 error page
        ├── styles/
        │   ├── index.css          # Design tokens, typography & accessible focus rings
        │   ├── home.css           # Home layout & responsive rules
        │   ├── room.css           # Stage, chat drawer & participant styles
        │   └── player.css         # Cinema player controls & video grid styles
        └── utils/
            ├── soundEffects.js    # Web Audio API audio synthesis
            ├── formatters.js      # Time formatting utilities
            └── clipboard.js       # Clipboard copy helper
```

---

## Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### Installation
```bash
npm run install:all
```

### Development

Run backend and frontend concurrently:

```bash
# Terminal 1 - Backend (Port 5000)
cd backend
npm start

# Terminal 2 - Frontend (Port 5173)
cd frontend
npm run dev
```

Visit **`http://localhost:5173/`**.

---

## Testing

Run the automated backend test suite:

```bash
cd backend
npm test
```

Execute production bundle validation:

```bash
cd frontend
npm run build
```

---

## Deployment

### Frontend (Vercel)
- Framework Preset: **Vite**
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_SOCKET_URL=https://your-backend.onrender.com`

### Backend (Render / Docker)
- Deploy `backend` directory or run `docker-compose up`
- Start Command: `node server.js`
- Environment Variable: `CLIENT_URL=https://your-frontend.vercel.app`
- Health Endpoint: `GET /api/health`

---

## License
MIT License.
