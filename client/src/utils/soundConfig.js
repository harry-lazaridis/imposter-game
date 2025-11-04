// Sound Configuration - Easy way to add external sound files
// 
// To use external sounds:
// 1. Put your sound files in client/public/sounds/ (or host them elsewhere)
// 2. Update the URLs below to point to your sound files
// 3. Leave as null to use the default generated tones
//
// Supported formats: .mp3, .wav, .ogg, .m4a
//
// Example:
// gameStart: '/sounds/game-start.mp3'
// or use external URL:
// gameStart: 'https://example.com/sounds/game-start.mp3'

export const soundConfig = {
  // Set to null to use default tones, or provide URL to audio file
  menu: null,
  gameStart: null,        // When game/round starts
  roleReveal: null,      // When roles are revealed
  voteSubmit: null,       // When a vote is submitted
  voteCount: null,        // When voting phase begins
  roundEnd: null,         // When round results are shown
  error: null,            // For error states
  buttonClick: null,      // For button interactions
  join: null,             // When joining a room
  leave: null,            // When leaving a room
};

// Volume levels for each sound (0.0 to 1.0)
export const soundVolumes = {
  menu: 0.5,              // Menu/background sound when joining room
  gameStart: 0.5,
  roleReveal: 0.4,
  voteSubmit: 0.3,
  voteCount: 0.4,
  roundEnd: 0.5,
  error: 0.4,
  buttonClick: 0.2,
  join: 0.3,
  leave: 0.3,
};

