import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Store rooms and their states
  // rooms[roomId] = { players: {}, map: [] }
  const rooms: Record<string, any> = {};

  const createDefaultMap = () => {
    const map = [];
    for (let x = -10; x <= 10; x++) {
        for (let z = -10; z <= 10; z++) {
            map.push({ pos: [x, 0, z], type: 'default' });
        }
    }
    return map;
  };

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', ({ roomId, playerInfo }) => {
      socket.join(roomId);
      
      if (!rooms[roomId]) {
        rooms[roomId] = { players: {}, map: createDefaultMap() };
      }

      rooms[roomId].players[socket.id] = {
        id: socket.id,
        pos: [0, 5, 0],
        rot: [0, 0, 0],
        health: 100,
        ...playerInfo
      };

      // Send current room state to the new player
      socket.emit('room-state', rooms[roomId]);

      // Notify others in the room
      socket.to(roomId).emit('player-joined', rooms[roomId].players[socket.id]);
      
      socket.on('update-player', (update) => {
        if (rooms[roomId] && rooms[roomId].players[socket.id]) {
          Object.assign(rooms[roomId].players[socket.id], update);
          socket.to(roomId).emit('player-updated', rooms[roomId].players[socket.id]);
        }
      });

      socket.on('map-change', (changes) => {
        if (rooms[roomId]) {
          rooms[roomId].map = changes; // In a real app, you'd apply deltas
          socket.to(roomId).emit('map-updated', changes);
        }
      });

      socket.on('player-action', (action) => {
        // e.g., shooting, hitting
        socket.to(roomId).emit('remote-action', { playerId: socket.id, ...action });
      });

      socket.on('disconnect', () => {
        if (rooms[roomId]) {
          delete rooms[roomId].players[socket.id];
          io.to(roomId).emit('player-left', socket.id);
          
          // Clean up empty rooms
          if (Object.keys(rooms[roomId].players).length === 0) {
            // keep map for a bit? or delete move to persistent storage
            // delete rooms[roomId]; 
          }
        }
      });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
