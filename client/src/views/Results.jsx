import React from 'react';
import { soundManager } from '../utils/soundManager.js';

export default function Results({ socket, room, results, me }) {
  const isOwner = room?.ownerId === socket?.id;
  const next = () => {
    soundManager.playButtonClick();
    socket.emit('nextRound', {}, () => {
      soundManager.playGameStart();
    });
  };

  const playersById = new Map((room?.players || []).map(p => [p.id, p]));

  return (
    <div className="card">
      <div className="stack v gap">
        <div className="muted">The word was</div>
        <div className="word">{results?.word || '—'}</div>
        <div className="muted">Imposter</div>
        <div className="big">{playersById.get(results?.imposterId)?.name || '—'}</div>
        <div className="muted">Votes</div>
        <div className="list">
          {(results?.votes || []).map(v => (
            <div key={`${v.voterId}-${v.targetId}`} className="list-item">
              <div>{playersById.get(v.voterId)?.name}</div>
              <div className="muted">→</div>
              <div>{playersById.get(v.targetId)?.name}</div>
            </div>
          ))}
        </div>
        <div className="muted">Scores</div>
        <div className="list">
          {room?.players?.map(p => (
            <div key={p.id} className="list-item">
              <div>{p.name}</div>
              <div className="badge">{p.score}</div>
            </div>
          ))}
        </div>
        {isOwner && (
          <button className="btn primary" onClick={next}>Next Round</button>
        )}
      </div>
    </div>
  );
}


