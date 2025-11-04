import React, { useState, useEffect } from 'react';
import { soundManager } from '../utils/soundManager.js';

export default function Voting({ socket, room, role, me }) {
  const [targetId, setTargetId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const isOwner = room?.ownerId === socket?.id;

  useEffect(() => {
    // Play sound when voting phase starts
    soundManager.playVoteCount();
    // Reset submitted state when new voting phase starts
    setSubmitted(false);
    setTargetId('');
  }, [room?.round]);

  const submit = () => {
    if (!targetId) return;
    soundManager.playButtonClick();
    socket.emit('submitVote', { targetId }, (res) => {
      if (res?.ok) {
        setSubmitted(true);
        soundManager.playVoteSubmit();
      } else {
        soundManager.playError();
      }
    });
  };

  const endVoting = () => {
    soundManager.playButtonClick();
    socket.emit('endVoting', {}, () => {});
  };

  // Show role info at the top, then voting below
  return (
    <div className="card">
      <div className="stack v gap">
        {/* Role information - always visible */}
        <div className="stack v gap center role-section">
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
        </div>

        {/* Voting section */}
        <div className="muted">Vote who is the imposter</div>
        <div className="list">
          {room?.players?.filter(p => p.id !== socket.id).map(p => (
            <label key={p.id} className={`list-item selectable ${targetId === p.id ? 'selected' : ''}`}>
              <input type="radio" name="vote" value={p.id} checked={targetId === p.id} onChange={() => setTargetId(p.id)} />
              <div>{p.name}</div>
            </label>
          ))}
        </div>
        <button className="btn primary" disabled={!targetId || submitted} onClick={submit}>
          {submitted ? 'Voted' : 'Submit Vote'}
        </button>
        {isOwner && (
          <button className="btn" onClick={endVoting}>Done Voting</button>
        )}
        <div className="muted small">Votes submitted: {room?.votesCount ?? 0} / {room?.players?.length ?? 0}</div>
      </div>
    </div>
  );
}


