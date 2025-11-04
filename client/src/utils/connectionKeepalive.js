// Connection keepalive for mobile devices
export function setupConnectionKeepalive(socket) {
  if (!socket) return null;

  let wakeLock = null;
  let keepAliveInterval = null;
  let visibilityInterval = null;

  // Request wake lock to prevent screen from sleeping (when supported)
  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake lock active');
        wakeLock.addEventListener('release', () => {
          console.log('Wake lock released');
        });
      } catch (err) {
        console.log('Wake lock not available:', err.message);
      }
    }
  }

  // Send periodic ping to keep connection alive
  function startKeepAlive() {
    if (keepAliveInterval) return;
    keepAliveInterval = setInterval(() => {
      if (socket && socket.connected) {
        socket.emit('ping', Date.now());
      }
    }, 30000); // Every 30 seconds
  }

  // Reconnect on visibility change (when app comes back to foreground)
  function setupVisibilityHandler() {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App is visible again, ensure connection is alive
        if (socket && !socket.connected) {
          socket.connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also check periodically if connection is alive
    if (visibilityInterval) return;
    visibilityInterval = setInterval(() => {
      if (socket && !socket.connected && document.visibilityState === 'visible') {
        console.log('Reconnecting...');
        socket.connect();
      }
    }, 5000);
  }

  // Start keepalive mechanisms
  requestWakeLock();
  startKeepAlive();
  setupVisibilityHandler();

  // Cleanup function
  return () => {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
    if (visibilityInterval) {
      clearInterval(visibilityInterval);
      visibilityInterval = null;
    }
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }
  };
}

