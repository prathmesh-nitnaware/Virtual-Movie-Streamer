# 🚀 Virtual Movie Streamer - Production Deployment Guide

This guide details the steps to deploy **Virtual Movie Streamer** across all modern production hosting environments.

---

## 🏗️ Architecture Overview

Virtual Movie Streamer consists of:
1. **Frontend App (`/frontend`)**: React 19 + Vite SPA with WebSockets and native WebRTC.
2. **Backend API & Signaling Server (`/backend`)**: Node.js + Express + Socket.IO server.

You can deploy the app using either of two battle-tested production strategies:
- **Strategy A (Decoupled):** Deploy frontend on **Vercel** and backend on **Render / Railway / Fly.io**.
- **Strategy B (Unified / Containerized):** Deploy frontend and backend together as a single container or service using **Docker** or a Node.js server. The Express server automatically serves the built frontend (`frontend/dist`) and handles SPA routing fallbacks.

---

## 🌐 Strategy A: Vercel (Frontend) + Render (Backend)

### Step 1: Deploy Backend to Render
1. Create a new account or log in to [Render](https://render.com).
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
6. Click **Create Web Service**. Note your backend URL (e.g. `https://virtual-movie-streamer-api.onrender.com`).

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
   - `VITE_SOCKET_URL`: `https://virtual-movie-streamer-api.onrender.com` (your Render URL from Step 1)
5. Click **Deploy**.
6. Ensure that `frontend/vercel.json` exists in the repository (already pre-configured) so that client-side SPA routing (`/room/:roomId`) refreshes cleanly without 404s.

---

## 🐳 Strategy B: Unified Docker / Single-Host Deployment

The repository includes a production-ready multi-stage `Dockerfile` that builds the frontend and bundles it directly with the backend server.

### Run with Docker Compose
```bash
docker compose up --build -d
```
The entire application will be live at `http://localhost:5000`.

### Build and Run Docker Image Manually
```bash
docker build -t virtual-movie-streamer:latest .
docker run -p 5000:5000 -e PORT=5000 -e NODE_ENV=production virtual-movie-streamer:latest
```

---

## 🖥️ Strategy C: Deploy on a Linux VPS (Ubuntu / Debian)

### 1. Build and Prepare
```bash
# Clone and enter directory
cd Virtual-Movie-Streamer

# Install dependencies and build frontend
npm run install:all
npm run build
```

### 2. Run with PM2 Process Manager
```bash
npm install -g pm2
cd backend
PORT=5000 NODE_ENV=production pm2 start server.js --name "vms-backend"
pm2 save
pm2 startup
```

### 3. Setup Nginx Reverse Proxy (with WebSocket Support)
Create `/etc/nginx/sites-available/virtual-movie-streamer`:
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
sudo ln -s /etc/nginx/sites-available/virtual-movie-streamer /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

## 🔐 Environment Variables Matrix

| Variable | Scope | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend | `5000` | Port on which the Express & Socket.IO server listens |
| `NODE_ENV` | Backend | `production` | Set to `production` in production environments |
| `CLIENT_URL` | Backend | `*` | Comma-separated list of allowed CORS frontend origins |
| `VITE_SOCKET_URL` | Frontend | `http://localhost:5000` | Backend WebSocket signaling server URL |

---

## 🩺 Health Check & Monitoring

The backend exposes a health endpoint for automated uptime monitoring (e.g., UptimeRobot, Render health checks):

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-09-25T00:00:00.000Z",
  "service": "Virtual Movie Streamer API",
  "uptimeSeconds": 1420,
  "memoryUsageMB": 48,
  "system": {
    "platform": "win32",
    "nodeVersion": "v24.15.0",
    "cpuCount": 8
  }
}
```
