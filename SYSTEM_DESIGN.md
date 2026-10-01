# 📐 Virtual Movie Streamer — System Design & Architecture

> **Real-Time Collaborative Virtual Cinema Platform with Native WebRTC Mesh, Server-Coordinated Media Synchronization, and Adaptive Multi-Source Streaming.**

---

## 1. 🏗️ High-Level System Architecture

Virtual Movie Streamer employs a hybrid **Client-Server + Peer-to-Peer (P2P)** architecture:
- **WebSocket Signaling & Sync Server (Node.js + Express + Socket.IO):** Coordinates room state, playback authority, chat messages, floating emoji reactions, and WebRTC SDP/ICE signaling.
- **Native WebRTC Full Mesh Grid:** Direct peer-to-peer audio/video feeds and screen sharing among participants without routing heavy media through central backend servers.
- **Unified Media Synchronization Engine:** Millisecond-level synchronization supporting HTML5 video streams (Direct MP4, WebM, HLS, Local Blobs) and embedded YouTube streams via the YouTube IFrame API.

```mermaid
flowchart TB
    subgraph Clients["Browser Clients (React 19 + Vite 6)"]
        Host["👑 Room Host (Playback Authority)"]
        Peer1["👤 Participant A"]
        Peer2["👤 Participant B"]
    end

    subgraph BackendCluster["Backend Layer (Node.js + Socket.IO)"]
        LB["Load Balancer / Reverse Proxy (Vercel / Render / Nginx)"]
        Server["Express + Socket.IO Signaling Server"]
        RoomService["In-Memory Room State Manager"]
        RedisPubSub["(Optional) Redis Pub/Sub Cluster Adapter"]
    end

    subgraph STUN_Relay["NAT Traversal & ICE"]
        STUN["Google & Twilio STUN Servers (3478 / 19302)"]
    end

    subgraph MediaSources["Media Sources"]
        DirectStream["Direct MP4 / WebM / HLS CDN"]
        YouTubeAPI["YouTube Video Streams (IFrame API)"]
        LocalFile["Host Local File (Blob URL Streaming)"]
    end

    Host -- "Socket.IO (Sync, Chat, Offers)" --> LB
    Peer1 -- "Socket.IO (Sync, Chat, Answers)" --> LB
    Peer2 -- "Socket.IO (Sync, Chat, Answers)" --> LB
    LB --> Server
    Server <--> RoomService
    Server -.-> RedisPubSub

    Host <-.-> STUN
    Peer1 <-.-> STUN
    Peer2 <-.-> STUN

    Host <== "WebRTC P2P Audio/Video Mesh" ==> Peer1
    Host <== "WebRTC P2P Audio/Video Mesh" ==> Peer2
    Peer1 <== "WebRTC P2P Audio/Video Mesh" ==> Peer2

    Host & Peer1 & Peer2 --> DirectStream
    Host & Peer1 & Peer2 --> YouTubeAPI
    Host --> LocalFile
```

---

## 2. ⏱️ Video Synchronization & Drift Correction Protocol

### A. Host-Authority Model
1. Only the active room **Host** can issue playback commands (`play`, `pause`, `seek`, `rate`, `change-video`).
2. Non-host participants follow host playback and can request immediate resynchronization at any time (`request-sync`).

### B. Elapsed-Time Elapsed Calculation
Instead of polling continuous video frames, the server computes real-time playback offsets using timestamp deltas:
$$\text{CalculatedTime} = \text{BaseCurrentTime} + \left(\frac{\text{Now} - \text{UpdatedAt}}{1000}\right) \times \text{PlaybackRate}$$

This ensures late-joining viewers start at the exact second the rest of the theater is watching.

### C. Heartbeat & Drift Smoothing
Every 3–4 seconds, the host emits a `sync-heartbeat`. Viewers compare local playback position against the host's heartbeat:
- **Drift $\le 1.2\text{s}$:** Local playback speed slightly adjusts to smooth out minor jitter.
- **Drift $> 1.2\text{s}$:** Direct seek alignment occurs to prevent viewer isolation.

```mermaid
sequenceDiagram
    autonumber
    actor Host as 👑 Host Client
    participant Server as ⚙️ Socket.IO Server
    actor Viewer as 👤 Viewer Client

    Host->>Server: video-state { action: "seek", currentTime: 142.5 }
    Server->>Server: Update Room Video State
    Server->>Viewer: video-state { action: "seek", currentTime: 142.5 }
    Viewer->>Viewer: Set video.currentTime = 142.5

    loop Every 3 Seconds (Host Heartbeat)
        Host->>Server: sync-heartbeat { currentTime: 155.0, isPlaying: true }
        Server->>Viewer: sync-heartbeat { currentTime: 155.0, isPlaying: true }
        alt Drift > 1.2s
            Viewer->>Viewer: Re-align currentTime = 155.0
        else Drift <= 1.2s
            Viewer->>Viewer: Normal Playback (No Jitter)
        end
    end
```

---

## 3. 📹 WebRTC Mesh Video Conferencing Protocol

To ensure zero media latency, video chat runs directly peer-to-peer using native `RTCPeerConnection`:

### A. Candidate Queueing & Race Prevention
To prevent `InvalidStateError` when ICE candidates arrive before SDP negotiation completes:
1. When receiving an ICE candidate before `pc.remoteDescription` is set, the client queues it in `pendingIceCandidates[peerId]`.
2. As soon as `setRemoteDescription()` resolves, the queue is drained sequentially.

```mermaid
sequenceDiagram
    autonumber
    actor PeerA as 👤 Peer A (Joiner)
    participant Server as ⚙️ Signaling Server
    actor PeerB as 👤 Peer B (Existing)

    PeerA->>Server: join-video-room { roomId }
    Server->>PeerA: all-video-users [PeerB_ID]
    PeerA->>PeerA: createOffer() -> setLocalDescription(offer)
    PeerA->>Server: send-offer { targetId: PeerB_ID, offer }
    Server->>PeerB: receive-offer { offer, callerId: PeerA_ID }
    
    PeerB->>PeerB: setRemoteDescription(offer)
    PeerB->>PeerB: Drain Queued ICE Candidates
    PeerB->>PeerB: createAnswer() -> setLocalDescription(answer)
    PeerB->>Server: send-answer { targetId: PeerA_ID, answer }
    Server->>PeerA: receive-answer { answer, callerId: PeerB_ID }
    PeerA->>PeerA: setRemoteDescription(answer)
    PeerA->>PeerA: Drain Queued ICE Candidates

    PeerA<<-->>PeerB: Direct P2P Media Streams Established (STUN NAT Traversal)
```

---

## 4. 👑 Room Lifecycle & Automatic Host Migration

```mermaid
stateDiagram-v2
    [*] --> RoomCreated: User 1 creates/joins room
    RoomCreated --> HostAssigned: User 1 becomes Host 👑
    HostAssigned --> MultiUserActive: Other viewers join
    
    state MultiUserActive {
        [*] --> PlaybackSync
        PlaybackSync --> VideoChange: Host loads new stream
        VideoChange --> PlaybackSync
        PlaybackSync --> Moderation: Host mutes/transfers
        Moderation --> PlaybackSync
    }

    MultiUserActive --> HostLeft: Host disconnects
    HostLeft --> HostMigrated: Auto-promote Next Oldest Viewer 👑
    HostMigrated --> MultiUserActive

    MultiUserActive --> RoomEmpty: All viewers leave
    RoomEmpty --> RoomDestroyed: Clean up Map state & memory
    RoomDestroyed --> [*]
```

---

## 5. 🛡️ Security, Rate Limiting & Input Sanitization

| Domain | Threat / Risk | Implemented Protection |
| :--- | :--- | :--- |
| **CORS Policy** | Unauthorized third-party WebSocket connections | Whitelist origin validation against `CLIENT_ORIGINS` environment variables |
| **Chat Flooding** | Denial of service / UI freeze | Sliding-window rate limit (max 6 messages per 2s per socket) |
| **Reaction Spam** | Burst load / animation lag | Sliding-window rate limit (max 4 reactions per 1.5s) |
| **Message Bounds** | Buffer overflow / giant string payloads | Strict substring truncation (500 chars text, 32 chars username, 10 chars emoji) |
| **Video State Bounds** | Negative offsets / infinite loop values | Positive finite number validation, playback rate clamped to $[0.25, 4.0]$ |
| **Media Track Injection** | Malicious track URI execution | Sanitized subtitle URL handling + WebVTT blob conversion |

---

## 6. 🌐 Scalability & Multi-Container Deployment

```mermaid
flowchart LR
    subgraph Edge["Global CDN / Edge"]
        Clients["Web Clients"]
    end

    subgraph BackendInstances["Horizontal Node.js Cluster"]
        Node1["Backend Container 1"]
        Node2["Backend Container 2"]
        NodeN["Backend Container N"]
    end

    subgraph StateBus["Distributed Pub/Sub"]
        Redis[("Redis / Upstash / Valkey Cluster\n(@socket.io/redis-adapter)")]
    end

    Clients --> Node1
    Clients --> Node2
    Clients --> NodeN

    Node1 <--> Redis
    Node2 <--> Redis
    NodeN <--> Redis
```

- **Standalone Mode (Default):** Runs an in-memory `RoomService` Map with zero external database dependencies for minimal latency and effortless local/single-container deployment.
- **Clustered Mode:** Automatically enables `@socket.io/redis-adapter` when `REDIS_URL` or `REDIS_HOST` is supplied, allowing rooms and signaling to broadcast across hundreds of horizontally scaled backend containers.
