# Imposter Game (Mobile Web)

A lightweight mobile-friendly party game built with React (Vite) and Express + Socket.IO.

## Features
- Create or join a room with a 6-character code
- Owner starts a round; one random player is the imposter
- Non-imposters see the secret word; imposter sees nothing
- Players say one clue word in real life
- Vote once per round; correct voters get 1 point
- Imposter gains 2 points if they receive less than half of all votes

## Monorepo Layout
- `server/`: Express + Socket.IO server
- `client/`: Vite React app

## Prerequisites
- Node.js 18+

## Setup

Install dependencies (run from project root):

```bash
npm run install:all
```

Or install separately:
```bash
cd server && npm install
cd ../client && npm install
```

## Run (development)

### Option 1: Run both server and client together (recommended)

```bash
npm run dev
```

This starts:
- Server on `http://0.0.0.0:4000` (accessible on all network interfaces)
- Client on `http://0.0.0.0:5173` (accessible on all network interfaces)

### Option 2: Run separately

Start the server:
```bash
cd server
npm run dev
```

Start the client:
```bash
cd client
npm run dev
```

## Network Access (Local Network)

The game is configured to work on your local network:

1. **From the same machine**: Use `http://localhost:5173`
2. **From other devices on the network**: Use `http://YOUR_IP:5173`

The client automatically detects the server URL based on how you access it:
- If you open `http://localhost:5173`, it connects to `http://localhost:4000`
- If you open `http://192.168.1.100:5173`, it connects to `http://192.168.1.100:4000`

**Note**: Make sure port 5173 (client) and 4000 (server) are accessible on your network/firewall.

To manually set the server URL (if needed):
```bash
# client/.env.local
VITE_SERVER_URL=http://YOUR_SERVER_IP:4000
```

## Gameplay Flow
1. First player creates a room and shares the room code
2. Others join using their names and the code
3. Owner presses Start Game
4. Each player sees their role. Non-imposters see the secret word
5. Speak one clue word in real life
6. Owner presses Begin Voting; everyone votes
7. Owner presses End Voting to score the round
8. Owner presses Next Round to continue

## Notes
- This implementation keeps state in memory; for production, use a database and persistence
- Socket events are namespaced per room; basic disconnect handling is included
- Minimum 3 players to start a round

## Scripts (from project root)

- `npm run dev` - Run both server and client concurrently
- `npm run install:all` - Install dependencies for all packages
- `npm run dev:server` - Run only the server
- `npm run dev:client` - Run only the client

### Individual package scripts
- Server: `cd server && npm run dev`, `npm start`
- Client: `cd client && npm run dev`, `npm run build`, `npm run preview`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions including:
- VPS/Cloud server setup (Ubuntu/Debian)
- Railway, Render, Heroku deployment
- Nginx configuration
- SSL/HTTPS setup
- PM2 process management
