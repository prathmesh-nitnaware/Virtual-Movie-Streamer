# 🎥 Virtual Movie Streamer

**Virtual Movie Streamer** is a real-time, multi-user web app where users can watch videos together in sync, chat live, and even video call — just like a virtual movie night. The host controls the video; others are passive participants.

> 🔥 Built with React, Node.js, Socket.IO, and WebRTC
> 🌐 Deployed using Vercel (frontend) and Render (backend)

---

## 🌍 Live Demo

* 🔗 Frontend: [virtual-movie-streamer.vercel.app](https://virtual-movie-streamer.vercel.app)
* 🔗 Backend: [virtual-movie-streamer.onrender.com](https://virtual-movie-streamer.onrender.com)

> ✅ Join any room by URL
> 👑 First user becomes the host

---

## 🎯 Key Features

| 🎥 Feature                 | ✅ Description                                       |
| -------------------------- | --------------------------------------------------- |
| **Host-Controlled Video**  | Only host can play, pause, seek, or upload videos   |
| **Live Webcam + Mic Chat** | Peer-to-peer video/audio via WebRTC                 |
| **Real-Time Room Chat**    | Text chat with all room participants                |
| **Multi-User Video Grid**  | Dynamic, responsive layout for all webcams          |
| **Mute Controls**          | Host can mute all or specific users                 |
| **Responsive UI**          | Looks great on desktop & mobile                     |
| **Unique Room ID System**  | Shareable room links with automatic host assignment |

---

## 💠 Tech Stack

| Layer      | Tech                                |
| ---------- | ----------------------------------- |
| Frontend   | React, Tailwind/Bootstrap, Vite     |
| Backend    | Node.js, Express, Socket.IO         |
| Real-Time  | Socket.IO + WebRTC + simple-peer    |
| Deployment | Vercel (frontend), Render (backend) |

---

## 🧲 How It Works

### 🧑‍💼 Host Role

* First user to join a room
* Can upload videos or share links
* Can mute all/individual participants
* Can end the room for everyone

### 👥 Participants

* Can watch synced video
* Can join via room URL
* Can use webcam/mic
* Cannot control video

---

## 📦 Getting Started

### 🧳 Clone and Run

```bash
git clone https://github.com/prathmesh-nitnaware/Virtual-Movie-Streamer.git
cd Virtual-Movie-Streamer
```

### ▶️ Run Backend (port 5000)

```bash
cd server
npm install
node server.js
```

### 💻 Run Frontend (port 3000)

```bash
cd ../client
npm install
npm start
```

> ⚙️ Create `.env` in `client/`:

```env
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 📁 Project Structure

```
Virtual-Movie-Streamer/
├── client/           # React frontend
│   ├── src/
│   └── public/
├── server/           # Node.js backend
│   └── server.js
├── README.md
```
