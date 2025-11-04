import React, { useState } from 'react';
import { soundManager } from '../utils/soundManager.js';

export default function Home({ socket, onEnter }) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const createRoom = async () => {
    if (!socket) return;
    soundManager.playButtonClick();
    setBusy(true); setError('');
    socket.emit('createRoom', { name }, (res) => {
      setBusy(false);
      if (res?.ok) {
        soundManager.playMenu();
        soundManager.playJoin();
        onEnter({ room: res.room, name });
      } else {
        soundManager.playError();
        setError('Failed to create room');
      }
    });
  };

  const joinRoom = async () => {
    if (!socket) return;
    if (!roomId) {
      soundManager.playError();
      setError('Enter room code');
      return;
    }
    soundManager.playButtonClick();
    setBusy(true); setError('');
    socket.emit('joinRoom', { roomId: roomId.toUpperCase(), name }, (res) => {
      setBusy(false);
      if (res?.ok) {
        soundManager.playMenu();
        soundManager.playJoin();
        onEnter({ room: res.room, name });
      } else {
        soundManager.playError();
        setError(res?.error === 'ROOM_NOT_FOUND' ? 'Room not found' : 'Failed to join');
      }
    });
  };

  const handleAction = () => {
    if (roomId.trim()) {
      joinRoom();
    } else {
      createRoom();
    }
  };

  return (
    <div className="card">
      <div className="stack v gap">
        <input className="input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        <input className="input" placeholder="Room code (optional)" value={roomId} onChange={e => setRoomId(e.target.value)} />
        <button className="btn primary" disabled={busy} onClick={handleAction}>
          {roomId.trim() ? 'Join' : 'Create Room'}
        </button>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}


