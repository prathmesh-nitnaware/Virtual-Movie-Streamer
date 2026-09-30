import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin);

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log(`⚡ Connected to signaling server [${socket.id}] at ${SOCKET_URL}`);
});

socket.on('disconnect', (reason) => {
  console.log(`🔌 Disconnected from server: ${reason}`);
});

socket.on('connect_error', (error) => {
  console.warn(`⚠️ Socket connection error:`, error.message);
});

export default socket;
