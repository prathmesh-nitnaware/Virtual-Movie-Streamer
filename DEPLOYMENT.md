# 🚀 WatchVerse — Production Deployment Guide

> **Watch together. Anywhere.**  
> Complete manual for deploying WatchVerse across Vercel, Render, Railway, Docker, and Linux servers.

---

## 🏗️ Architecture Overview

WatchVerse consists of:
1. **Frontend App (`/frontend`)**: React 19 + Vite SPA with WebSockets and native WebRTC.
2. **Backend API & Signaling Server (`/backend`)**: Node.js + Express 5 + Socket.IO server with versioned synchronization.

You can deploy using either of two battle-tested strategies:
- **Strategy A (Decoupled):** Deploy frontend on **Vercel** and backend on **Render / Railway / Fly.io**.
- **Strategy B (Unified / Containerized):** Deploy frontend and backend together as a single container using **Docker**. The Express server automatically serves the built frontend (`frontend/dist`) and handles SPA routing fallbacks.

---

## 🌐 Strategy A: Vercel (Frontend) + Render (Backend)

### Step 1: Deploy Backend to Render
1. Log in to [Render](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your repository.
4. Set the following fields:
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add Environment Variables:
   - `PORT`: `10000`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-frontend-subdomain.vercel.app`
   - *(Optional Redis URL for clustering):* `REDIS_URL`
6. Click **Create Web Service**. Note your backend URL (e.g. `https://watchverse-api.onrender.com`).

*(Alternatively, use `render.yaml` with Render Blueprints for 1-click automatic setup!)*

---

### Step 2: Deploy Frontend to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New Project** and select your repository.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variable:
   - `VITE_SOCKET_URL`: `https://watchverse-api.onrender.com` (your Render URL from Step 1)
5. Click **Deploy**.
6. Ensure that `frontend/vercel.json` exists in the repository (pre-configured) so that client-side SPA routing (`/room/:roomId`) refreshes cleanly without 404s.

---

## 🐳 Strategy B: Unified Docker / Single-Host Deployment

The repository includes a production multi-stage `Dockerfile` that builds the frontend and bundles it directly with the backend server.

### Run with Docker Compose
```bash
docker compose up --build -d
```
The entire application will be live at `http://localhost:5000`.

### Build and Run Docker Image Manually
```bash
docker build -t watchverse:latest .
docker run -p 5000:5000 -e PORT=5000 -e NODE_ENV=production watchverse:latest
```

---

## 🖥️ Strategy C: Deploy on a Linux VPS (Ubuntu / Debian)

### 1. Build and Prepare
```bash
# Clone and enter directory
git clone https://github.com/your-org/WatchVerse.git
cd WatchVerse

# Install dependencies and build frontend
npm run install:all
npm run build
```

### 2. Run with PM2 Process Manager
```bash
npm install -g pm2
cd backend
PORT=5000 NODE_ENV=production pm2 start server.js --name "watchverse-backend"
pm2 save
pm2 startup
```

### 3. Setup Nginx Reverse Proxy (with WebSocket Support)
Create `/etc/nginx/sites-available/watchverse`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/watchverse /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

## 🔐 Environment Variables Matrix

| Variable | Scope | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend | `5000` | Port on which the Express & Socket.IO server listens |
| `NODE_ENV` | Backend | `production` | Set to `production` in production environments |
| `CLIENT_URL` | Backend | `*` | Comma-separated list of allowed CORS frontend origins |
| `REDIS_URL` | Backend | `(Optional)` | Redis connection URI for multi-container pub/sub clustering |
| `VITE_SOCKET_URL` | Frontend | `http://localhost:5000` | Backend WebSocket signaling server URL |

---

## 🩺 Health Check & Monitoring

The backend exposes a health endpoint for automated uptime monitoring:

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "WatchVerse Backend API",
  "tagline": "Watch together. Anywhere.",
  "version": "1.0.0",
  "environment": "production",
  "uptimeSeconds": 1420,
  "activeRooms": 3,
  "activeUsers": 8,
  "timestamp": "2026-10-01T23:45:00.000Z"
}
```
