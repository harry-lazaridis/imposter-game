import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { WORDS } from './words.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory game state (Change to a database in production)
const rooms = new Map();

function createRoom(roomId, ownerSocketId, ownerName) {
  const ownerPlayer = {
    id: ownerSocketId,
    name: ownerName,
    score: 0
  };

  const room = {
    id: roomId,
    ownerId: ownerSocketId,
    players: new Map([[ownerSocketId, ownerPlayer]]),
    phase: 'lobby', // lobby | role | vote | results
    round: 0,
    word: null,
    imposterId: null,
    votes: new Map(), // voterId -> targetPlayerId
    createdAt: Date.now()
  };
  rooms.set(roomId, room);
  return room;
}

function publicRoomState(room) {
  return {
    id: room.id,
    ownerId: room.ownerId,
    phase: room.phase,
    round: room.round,
    players: Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name, score: p.score })),
    votesCount: room.votes.size
  };
}

function pickRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function pickRandomImposter(room) {
  const playerIds = Array.from(room.players.keys());
  return playerIds[Math.floor(Math.random() * playerIds.length)];
}

function resetRound(room) {
  room.round += 1;
  room.word = pickRandomWord();
  room.imposterId = pickRandomImposter(room);
  room.votes.clear();
}

function allVotesSubmitted(room) {
  // Everyone votes exactly once; imposter can vote too.
  return room.votes.size === room.players.size;
}

function tallyVotes(room) {
  const tally = new Map(); // targetId -> count
  for (const [, targetId] of room.votes) {
    tally.set(targetId, (tally.get(targetId) || 0) + 1);
  }
  const votesForImposter = tally.get(room.imposterId) || 0;
  const totalPlayers = room.players.size;
  // Everyone who voted for the imposter gets 1 point
  for (const [voterId, targetId] of room.votes) {
    if (targetId === room.imposterId) {
      const voter = room.players.get(voterId);
      if (voter) voter.score += 1;
    }
  }
  // Imposter gets 2 points if received less than half the votes
  if (votesForImposter < totalPlayers / 2) {
    const imp = room.players.get(room.imposterId);
    if (imp) imp.score += 2;
  }
  return { tally, votesForImposter };
}

io.on('connection', (socket) => {
  socket.data.roomId = null;
  socket.data.name = null;

  // Handle ping for keepalive
  socket.on('ping', (timestamp) => {
    socket.emit('pong', timestamp);
  });

  socket.on('createRoom', ({ name }, cb) => {
    try {
      const roomId = (Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6)).slice(0, 6).toUpperCase();
      const room = createRoom(roomId, socket.id, name?.trim() || 'Player');
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.name = name?.trim() || 'Player';
      io.to(roomId).emit('roomUpdate', publicRoomState(room));
      cb?.({ ok: true, room: publicRoomState(room) });
    } catch (e) {
      cb?.({ ok: false, error: 'FAILED_CREATE' });
    }
  });

  socket.on('joinRoom', ({ roomId, name }, cb) => {
    const room = rooms.get(roomId);
    if (!room) {
      cb?.({ ok: false, error: 'ROOM_NOT_FOUND' });
      return;
    }
    const trimmed = name?.trim() || 'Player';
    // Make name unique within room
    const existingNames = new Set(Array.from(room.players.values()).map(p => p.name));
    let uniqueName = trimmed;
    let counter = 1;
    while (existingNames.has(uniqueName)) {
      uniqueName = `${trimmed} ${++counter}`;
    }
    room.players.set(socket.id, { id: socket.id, name: uniqueName, score: 0 });
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.name = uniqueName;
    io.to(roomId).emit('roomUpdate', publicRoomState(room));
    cb?.({ ok: true, room: publicRoomState(room) });
  });

  socket.on('startGame', (_, cb) => {
    const roomId = socket.data.roomId;
    const room = roomId ? rooms.get(roomId) : null;
    if (!room) return cb?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    if (room.ownerId !== socket.id) return cb?.({ ok: false, error: 'NOT_OWNER' });
    if (room.players.size < 3) return cb?.({ ok: false, error: 'NEED_3_PLAYERS' });

    resetRound(room);
    // Automatically start voting phase after role reveal
    room.phase = 'vote';
    room.votes.clear();
    // Send personal role info
    for (const [playerId] of room.players) {
      const isImposter = playerId === room.imposterId;
      io.to(playerId).emit('role', {
        isImposter,
        word: isImposter ? null : room.word
      });
    }
    io.to(roomId).emit('roomUpdate', publicRoomState(room));
    cb?.({ ok: true });
  });

  socket.on('submitVote', ({ targetId }, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return cb?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    if (room.phase !== 'vote') return cb?.({ ok: false, error: 'NOT_VOTING' });
    if (!room.players.has(targetId)) return cb?.({ ok: false, error: 'INVALID_TARGET' });
    room.votes.set(socket.id, targetId);
    io.to(room.id).emit('roomUpdate', publicRoomState(room));
    
    // Auto-end voting if all players have voted
    if (room.votes.size === room.players.size) {
      const { tally, votesForImposter } = tallyVotes(room);
      room.phase = 'results';
      const results = {
        imposterId: room.imposterId,
        word: room.word,
        votes: Array.from(room.votes.entries()).map(([voterId, targetId]) => ({ voterId, targetId })),
        votesForImposter
      };
      io.to(room.id).emit('results', results);
      io.to(room.id).emit('roomUpdate', publicRoomState(room));
    }
    
    cb?.({ ok: true });
  });

  socket.on('endVoting', (_, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return cb?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    if (room.ownerId !== socket.id) return cb?.({ ok: false, error: 'NOT_OWNER' });
    if (room.phase !== 'vote') return cb?.({ ok: false, error: 'NOT_VOTING' });
    const { tally, votesForImposter } = tallyVotes(room);
    room.phase = 'results';
    const results = {
      imposterId: room.imposterId,
      word: room.word,
      votes: Array.from(room.votes.entries()).map(([voterId, targetId]) => ({ voterId, targetId })),
      votesForImposter
    };
    io.to(room.id).emit('results', results);
    io.to(room.id).emit('roomUpdate', publicRoomState(room));
    cb?.({ ok: true, results });
  });

  socket.on('nextRound', (_, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return cb?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    if (room.ownerId !== socket.id) return cb?.({ ok: false, error: 'NOT_OWNER' });
    resetRound(room);
    room.phase = 'role';
    for (const [playerId] of room.players) {
      const isImposter = playerId === room.imposterId;
      io.to(playerId).emit('role', { isImposter, word: isImposter ? null : room.word });
    }
    io.to(room.id).emit('roomUpdate', publicRoomState(room));
    cb?.({ ok: true });
  });

  socket.on('makeOwner', ({ playerId }, cb) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return cb?.({ ok: false, error: 'ROOM_NOT_FOUND' });
    if (room.ownerId !== socket.id) return cb?.({ ok: false, error: 'NOT_OWNER' });
    if (!room.players.has(playerId)) return cb?.({ ok: false, error: 'INVALID_PLAYER' });
    room.ownerId = playerId;
    io.to(room.id).emit('roomUpdate', publicRoomState(room));
    cb?.({ ok: true });
  });

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    room.players.delete(socket.id);
    // Transfer ownership if needed
    if (room.ownerId === socket.id) {
      const first = room.players.keys().next();
      room.ownerId = first && !first.done ? first.value : null;
    }
    // If room empty, delete it
    if (room.players.size === 0) {
      rooms.delete(roomId);
      return;
    }
    // If imposter left during a round, end round and move to results
    if (room.imposterId === socket.id && room.phase !== 'lobby') {
      room.phase = 'results';
      io.to(room.id).emit('results', {
        imposterId: socket.id,
        word: room.word,
        votes: Array.from(room.votes.entries()).map(([voterId, targetId]) => ({ voterId, targetId })),
        disconnected: true
      });
    }
    io.to(room.id).emit('roomUpdate', publicRoomState(room));
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files from client/dist in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDistPath));
  
  // Handle React Router - serve index.html for all routes except API and Socket.IO
  app.get('*', (req, res) => {
    // Don't serve index.html for Socket.IO or API routes
    if (req.path.startsWith('/socket.io') || req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(join(clientDistPath, 'index.html'));
  });
} else {
  // Development mode - just return status
  app.get('/', (_req, res) => {
    res.json({ status: 'ok' });
  });
}

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on ${HOST}:${PORT}`);
});


