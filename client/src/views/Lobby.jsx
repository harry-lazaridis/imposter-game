import React from 'react';
import { soundManager } from '../utils/soundManager.js';

export default function Lobby({ socket, room, me, onLeave }) {
  const isOwner = room?.ownerId === socket?.id;

  const start = () => {
    soundManager.playButtonClick();
    socket.emit('startGame', {}, (res) => {
      if (res?.ok) {
        soundManager.playGameStart();
      } else if (res?.error === 'NEED_3_PLAYERS') {
        soundManager.playError();
        alert('Need at least 3 players');
      }
    });
  };

  const handleLeave = () => {
    soundManager.playLeave();
    onLeave();
  };

  return (
    <div className="card">
      <div className="stack v gap">
        <div className="muted">Share this code</div>
        <div className="room-code">{room?.id}</div>
        <div className="muted">Players</div>
        <div className="list">
          {room?.players?.map(p => (
            <div key={p.id} className={`list-item ${p.id === room.ownerId ? 'owner' : ''}`}>
              <div>{p.name}</div>
              <div className="badge">{p.score}</div>
            </div>
          ))}
        </div>
        {isOwner && (
          <button className="btn primary" onClick={start}>Start Game</button>
        )}
        <button className="btn" onClick={handleLeave}>Leave</button>
      </div>
    </div>
  );
}


