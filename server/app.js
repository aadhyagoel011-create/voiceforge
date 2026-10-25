import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from root directory if available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import healthRouter from './routes/health.js';
import agentsRouter from './routes/agents.js';
import conversationsRouter from './routes/conversations.js';
import elevenlabsRouter from './routes/elevenlabs.js';

const app = express();

// Middleware
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);
    if (
      origin === clientUrl ||
      origin === 'http://localhost:5173' ||
      origin === 'http://127.0.0.1:5173' ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api', healthRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/elevenlabs', elevenlabsRouter);

// Root fallback info
app.get('/', (req, res) => {
  res.json({
    name: "VoiceForge API",
    status: "online",
    endpoints: {
      health: "/api/health",
      stats: "/api/stats",
      agents: "/api/agents",
      conversations: "/api/conversations",
      elevenlabsStatus: "/api/elevenlabs/status",
      elevenlabsVoices: "/api/elevenlabs/voices"
    }
  });
});

// Centralized 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("Unhandled API error:", err);
  res.status(500).json({ success: false, error: err.message || "Internal server error" });
});

export default app;
