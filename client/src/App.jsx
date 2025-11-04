import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import Home from './views/Home.jsx';
import Lobby from './views/Lobby.jsx';
import Voting from './views/Voting.jsx';
import Results from './views/Results.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { setupConnectionKeepalive } from './utils/connectionKeepalive.js';
import { soundManager } from './utils/soundManager.js';

// Auto-detect server URL based on current host
function getServerUrl() {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  // In production when served from same origin, use same origin (no port)
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  // Development mode: use same hostname but port 4000
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  // Server runs on port 4000
  return `${protocol}//${hostname}:4000`;
}

const DEFAULT_SERVER_URL = getServerUrl();

export default function App() {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null); // public room state
  const [role, setRole] = useState(null); // { isImposter, word }
  const [results, setResults] = useState(null);
  const [me, setMe] = useState({ id: null, name: '', roomId: '' });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const s = io(DEFAULT_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000
    });
    setSocket(s);

    // Setup connection keepalive for mobile
    const cleanup = setupConnectionKeepalive(s);

    // Handle server ping response
    s.on('pong', () => {
      // Connection is alive
    });

    s.on('roomUpdate', (r) => setRoom(r));
    s.on('role', (r) => {
      setRole(r);
      setResults(null);
      soundManager.playRoleReveal();
    });
    s.on('results', (res) => {
      setResults(res);
      soundManager.playRoundEnd();
    });

    s.on('connect', () => {
      console.log('Connected to server');
    });

    s.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      if (cleanup) cleanup();
      s.disconnect();
    };
  }, []);

  function handleCreatedOrJoined({ room: r, name }) {
    setMe(prev => ({ ...prev, id: socket.id, name, roomId: r.id }));
    setRoom(r);
  }

  function leaveLocal() {
    setRoom(null);
    setRole(null);
    setResults(null);
    setMe({ id: null, name: '', roomId: '' });
  }

  const view = useMemo(() => {
    if (!room) return 'home';
    if (room.phase === 'lobby') return 'lobby';
    // Role and vote phases are now merged - show voting with role info
    if (room.phase === 'vote') return 'vote';
    if (room.phase === 'results') return 'results';
    return 'home';
  }, [room]);

  return (
    <div className="container">
      <header className="header">
        <div className="title">Imposter</div>
        <div className="header-right">
          {room?.id && <div className="room">Room: {room.id}</div>}
          <button
            className="settings-btn-header"
            onClick={() => {
              soundManager.playButtonClick();
              setShowSettings(true);
            }}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>
      <main className="main">
        {view === 'home' && (
          <Home socket={socket} onEnter={handleCreatedOrJoined} />
        )}
        {view === 'lobby' && (
          <Lobby socket={socket} room={room} me={me} onLeave={leaveLocal} />
        )}
        {view === 'vote' && (
          <Voting socket={socket} room={room} role={role} me={me} />
        )}
        {view === 'results' && (
          <Results socket={socket} room={room} results={results} me={me} />
        )}
      </main>
      <footer className="footer">Say one word. Vote once. Have fun.</footer>
      <SettingsModal
        isOpen={showSettings}
        onClose={() => {
          soundManager.playButtonClick();
          setShowSettings(false);
        }}
      />
    </div>
  );
}


