# Sound Customization Guide

The sound system is easy to customize! All sounds are generated using the Web Audio API.

## Available Sound Methods

In `soundManager.js`, you have these pre-built sounds:

- `playGameStart()` - When a game/round starts
- `playRoleReveal()` - When roles are revealed
- `playVoteSubmit()` - When a vote is submitted
- `playVoteCount()` - When voting phase begins
- `playRoundEnd()` - When round results are shown
- `playError()` - For error states
- `playButtonClick()` - For button interactions
- `playJoin()` - When joining a room
- `playLeave()` - When leaving a room

## Customizing Sounds

### Option 1: Modify Existing Sounds

Edit the methods in `client/src/utils/soundManager.js`:

```javascript
playGameStart() {
  // Change frequencies, durations, or add more tones
  this.playTone(440, 150, 'sine', 0.3);
  setTimeout(() => this.playTone(554, 150, 'sine', 0.3), 100);
  setTimeout(() => this.playTone(659, 250, 'sine', 0.3), 200);
}
```

### Option 2: Use Audio Files

Replace tone generation with audio files:

```javascript
playGameStart() {
  this.playSound('/sounds/game-start.mp3', 0.5);
}
```

Then add your audio files to `client/public/sounds/`

### Option 3: Add New Sounds

Add new methods and call them anywhere:

```javascript
playCustomSound() {
  this.playTone(800, 200, 'square', 0.4);
}
```

## Sound Parameters

`playTone(frequency, duration, type, volume)`
- **frequency**: Hz (e.g., 440 = A note, 523 = C note)
- **duration**: milliseconds
- **type**: 'sine', 'square', 'sawtooth', 'triangle'
- **volume**: 0.0 to 1.0

## Disabling Sounds

Users can disable sounds by calling:
```javascript
soundManager.setEnabled(false);
```

To add a toggle in settings, you can store the preference in localStorage and initialize accordingly.

