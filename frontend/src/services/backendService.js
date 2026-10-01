/**
 * WatchVerse — Backend Pre-flight & Cold-Start Wakeup Service
 * Automatically pings /api/health as soon as the app loads to awaken
 * free-tier server instances (e.g. Render spin-down) in the background.
 */

export const BACKEND_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:5000')
).replace(/\/+$/, '');

let currentStatus = 'checking'; // 'checking' | 'waking' | 'ready' | 'offline'
let subscribers = new Set();
let isWakingUp = false;
let retryTimer = null;
let attemptCount = 0;
const MAX_ATTEMPTS = 20; // up to ~70 seconds of retries

function notifySubscribers() {
  subscribers.forEach((callback) => {
    try {
      callback(currentStatus);
    } catch (e) {
      console.error('Error notifying backend status subscriber:', e);
    }
  });
}

/**
 * Send pre-flight wake-up probe to the backend /api/health endpoint
 */
export async function pingBackendWakeup() {
  if (currentStatus === 'ready') return true;
  if (isWakingUp) return false;

  isWakingUp = true;
  attemptCount++;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout per probe

    const res = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok') {
        currentStatus = 'ready';
        isWakingUp = false;
        if (retryTimer) clearTimeout(retryTimer);
        notifySubscribers();
        console.log('⚡ [WatchVerse] Backend engine is active and warm.');
        return true;
      }
    }
    throw new Error(`HTTP status ${res.status}`);
  } catch (err) {
    // Backend is likely sleeping (Render cold start)
    currentStatus = 'waking';
    notifySubscribers();

    if (attemptCount < MAX_ATTEMPTS) {
      // Retry in 3.5 seconds
      retryTimer = setTimeout(() => {
        isWakingUp = false;
        pingBackendWakeup();
      }, 3500);
    } else {
      currentStatus = 'offline';
      isWakingUp = false;
      notifySubscribers();
      console.warn('⚠️ [WatchVerse] Backend took longer than expected to respond.');
    }
    return false;
  }
}

/**
 * Subscribe to status changes
 */
export function subscribeBackendStatus(callback) {
  subscribers.add(callback);
  callback(currentStatus);
  return () => subscribers.delete(callback);
}

export function getBackendStatus() {
  return currentStatus;
}

// Immediate eager wake-up trigger upon script import in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    pingBackendWakeup();
  }, 100);
}
