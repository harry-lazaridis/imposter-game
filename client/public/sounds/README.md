# Custom Sounds Directory

Place your custom sound files in this directory to use them in the game.

## How to Use

1. **Add your sound files** to this `client/public/sounds/` directory
   - Supported formats: `.mp3`, `.wav`, `.ogg`, `.m4a`
   - Recommended: `.mp3` for best compatibility

2. **Update `client/src/utils/soundConfig.js`**:
   ```javascript
   export const soundConfig = {
     gameStart: '/sounds/your-game-start.mp3',
     roleReveal: '/sounds/your-role-reveal.mp3',
     // ... etc
   };
   ```

3. **Adjust volumes** in `soundConfig.js` under `soundVolumes`:
   ```javascript
   export const soundVolumes = {
     gameStart: 0.5,  // 0.0 to 1.0
     // ... etc
   };
   ```

## Available Sound Slots

- `gameStart` - When a game/round starts
- `roleReveal` - When roles are revealed
- `voteSubmit` - When a vote is submitted
- `voteCount` - When voting phase begins
- `roundEnd` - When round results are shown
- `error` - For error states
- `buttonClick` - For button interactions
- `join` - When joining a room
- `leave` - When leaving a room

## External URLs

You can also use external URLs:
```javascript
gameStart: 'https://example.com/sounds/game-start.mp3'
```

## Note

- Leave as `null` to use the default generated tones
- Files in `public/` are served at the root path (e.g., `/sounds/file.mp3`)

