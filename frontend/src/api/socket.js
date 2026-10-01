import { io } from 'socket.io-client';
import { BACKEND_URL } from '../services/backendService';

export const SOCKET_URL = BACKEND_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 15,
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
