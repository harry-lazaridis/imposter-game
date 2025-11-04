import React, { useState } from 'react';

export default function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('how-to-play');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Settings</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'how-to-play' ? 'active' : ''}`}
            onClick={() => setActiveTab('how-to-play')}
          >
            How to Play
          </button>
          <button
            className={`modal-tab ${activeTab === 'authors' ? 'active' : ''}`}
            onClick={() => setActiveTab('authors')}
          >
            About
          </button>
        </div>
        <div className="modal-content">
          {activeTab === 'how-to-play' && (
            <div className="settings-content">
              <h3>How to Play</h3>
              <ol className="rules-list">
                <li><strong>Create or Join:</strong> Start by creating a room or entering a room code shared by a friend.</li>
                <li><strong>Wait for Players:</strong> You need at least 3 players to start a game.</li>
                <li><strong>Game Starts:</strong> When the owner starts the game, one random player becomes the <strong>Imposter</strong>.</li>
                <li><strong>Secret Word:</strong> All players except the Imposter see a secret word. The Imposter sees nothing.</li>
                <li><strong>Say One Word:</strong> Each player says ONE word that relates to the secret word (or the Imposter tries to blend in).</li>
                <li><strong>Vote:</strong> After everyone speaks, vote for who you think is the Imposter.</li>
                <li><strong>Scoring:</strong>
                  <ul>
                    <li>Correct voters get <strong>1 point</strong></li>
                    <li>Imposter gets <strong>2 points</strong> if they receive less than half of all votes</li>
                  </ul>
                </li>
                <li><strong>Next Round:</strong> The owner can start another round. The game continues until you decide to stop!</li>
              </ol>
              <div className="tips">
                <h4>Tips:</h4>
                <ul>
                  <li>As a regular player, be specific but not too obvious!</li>
                  <li>As the Imposter, listen carefully and try to blend in.</li>
                  <li>Pay attention to hesitation or unusual word choices.</li>
                </ul>
              </div>
            </div>
          )}
          {activeTab === 'authors' && (
            <div className="settings-content">
              <h3>Developers</h3>
              <p>Harry Lazaridis @harry.laza@outlook.com</p>
              <p>Built for mobile web play - perfect for parties and gatherings!</p>
              <div className="version">Version 0.2.3</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

