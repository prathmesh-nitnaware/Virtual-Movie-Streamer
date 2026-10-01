import { useState, useEffect } from 'react';
import {
  subscribeBackendStatus,
  pingBackendWakeup,
  getBackendStatus,
  BACKEND_URL,
} from '../services/backendService';

/**
 * useBackendStatus Hook
 * Returns the current backend health / cold-start status ('checking' | 'waking' | 'ready' | 'offline')
 * and an explicit wake() trigger function.
 */
export function useBackendStatus() {
  const [status, setStatus] = useState(getBackendStatus);

  useEffect(() => {
    const unsubscribe = subscribeBackendStatus((newStatus) => {
      setStatus(newStatus);
    });
    // Eagerly probe if not ready
    if (getBackendStatus() !== 'ready') {
      pingBackendWakeup();
    }
    return unsubscribe;
  }, []);

  return {
    status,
    isReady: status === 'ready',
    isWaking: status === 'waking' || status === 'checking',
    backendUrl: BACKEND_URL,
    wake: pingBackendWakeup,
  };
}

export default useBackendStatus;
