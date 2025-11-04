import React from 'react';
import { soundManager } from '../utils/soundManager.js';

export default function Role({ socket, room, role, me }) {
  const isOwner = room?.ownerId === socket?.id;
  const beginVoting = () => {
    soundManager.playButtonClick();
    socket.emit('beginVoting', {}, () => {
      soundManager.playVoteCount();
    });
  };

  return (
    <div className="card">
      <div className="stack v gap center">
        <div className="muted">Your role</div>
        {role?.isImposter ? (
          <div className="big">You are the Imposter</div>
        ) : (
          <>
            <div className="muted">The word is</div>
            <div className="word">{role?.word}</div>
          </>
        )}
        <div className="muted small">Everyone says one clue word in real life.</div>
        {isOwner && (
          <button className="btn primary" onClick={beginVoting}>Begin Voting</button>
        )}
      </div>
    </div>
  );
}


