const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { initDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  // In development, allow all origins (useful when frontend runs on different localhost ports)
  origin: process.env.NODE_ENV === 'development'
    ? true
    : (process.env.FRONTEND_URL || 'http://localhost:3000'),
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug: Log all incoming requests (for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DelayPilot Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/mitigation', require('./routes/mitigation'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();

    // Start listening — capture httpServer so WebSocket can share the port
    const httpServer = app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
    });

    // ── WebSocket server ──────────────────────────────────────────
    const wss = new WebSocket.Server({ server: httpServer });
    const rooms = new Map(); // Map<caseId: number, Set<WebSocket>>

    // Make broadcast available to Express route handlers via app.locals
    app.locals.broadcastComment = (caseId, comment) => {
      const room = rooms.get(Number(caseId));
      if (!room) return;
      const msg = JSON.stringify({ type: 'comment', comment });
      for (const client of room) {
        if (client.readyState === WebSocket.OPEN) client.send(msg);
      }
    };

    wss.on('connection', (ws) => {
      let authenticated = false;
      let joinedRoom = null;

      ws.on('message', (data) => {
        let msg;
        try { msg = JSON.parse(data); } catch { return; }

        // First message must be auth
        if (!authenticated) {
          if (msg.type === 'auth' && msg.token) {
            try {
              jwt.verify(msg.token, JWT_SECRET);
              authenticated = true;
            } catch {
              ws.close(4001, 'Unauthorized');
            }
          }
          return;
        }

        if (msg.type === 'join' && msg.caseId) {
          const caseId = Number(msg.caseId);
          // Leave previous room if any
          if (joinedRoom !== null) rooms.get(joinedRoom)?.delete(ws);
          joinedRoom = caseId;
          if (!rooms.has(caseId)) rooms.set(caseId, new Set());
          rooms.get(caseId).add(ws);
        }

        if (msg.type === 'leave') {
          if (joinedRoom !== null) {
            rooms.get(joinedRoom)?.delete(ws);
            joinedRoom = null;
          }
        }
      });

      ws.on('close', () => {
        if (joinedRoom !== null) rooms.get(joinedRoom)?.delete(ws);
      });
    });

    console.log(`🔌 WebSocket server attached on ws://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
