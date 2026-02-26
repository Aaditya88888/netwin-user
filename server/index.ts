import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerRoutes } from './routes.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5001; // Main app backend on 5001

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',   // Admin frontend
      'http://localhost:5174',   // Main app frontend (new)
      'http://localhost:5173',   // Main app frontend (fallback)
      'http://localhost:5175',   // Backup
      'https://netwin-tournament.web.app',
      'https://netwin-tournament--preview-fkc3zotn.web.app'
    ],
    credentials: true
  }
});

// Enable CORS for frontend
app.use(cors({
  origin: [
    'http://localhost:3000',   // Admin frontend
    'http://localhost:5174',   // Main app frontend (new)
    'http://localhost:5173',   // Main app frontend (fallback)
    'http://localhost:5175',   // Backup
    'https://netwin-tournament.web.app',
    'https://netwin-tournament--preview-fkc3zotn.web.app'
  ],
  credentials: true
}));

app.use(express.json());

// API routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  // Join tournament room
  socket.on('join-tournament', (tournamentId: string) => {
    socket.join(`tournament-${tournamentId}`);
    logger.info(`User ${socket.id} joined tournament room ${tournamentId}`);
  });

  // Leave tournament room
  socket.on('leave-tournament', (tournamentId: string) => {
    socket.leave(`tournament-${tournamentId}`);
    logger.info(`User ${socket.id} left tournament room ${tournamentId}`);
  });

  // Join match room
  socket.on('join-match', (matchId: string) => {
    socket.join(`match-${matchId}`);
    logger.info(`User ${socket.id} joined match room ${matchId}`);
  });

  // Leave match room
  socket.on('leave-match', (matchId: string) => {
    socket.leave(`match-${matchId}`);
    logger.info(`User ${socket.id} left match room ${matchId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Export io for use in routes
export { io };

// Register all API routes
registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === 'production' || process.env.VITE_PROD === 'true') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.resolve(__dirname, '../dist');

  app.use(express.static(distPath));

  // Handle all other routes by serving index.html (client-side routing)
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Handle all other routes in development
  app.all('*', (_req, res) => {
    res.redirect('http://localhost:5174'); // Updated to new frontend port
  });
}

// Start server
httpServer.listen(port, () => {
  logger.info(`🚀 Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`🔗 WebSocket server ready`);
  logger.info(`📡 API endpoints available at http://localhost:${port}/api`);
});
