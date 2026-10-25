import express from 'express';
import { StorageService } from '../services/storage.js';
import { ElevenLabsService } from '../services/elevenLabsService.js';

const router = express.Router();

// GET /api/health - Connectivity and system status
router.get('/health', (req, res) => {
  const elevenStatus = ElevenLabsService.getStatus();
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    service: "VoiceForge Backend API",
    mode: elevenStatus.elevenLabsLiveAvailable ? "Live ElevenLabs" : "Demo Mode",
    integrations: {
      elevenlabs: elevenStatus.hasApiKey,
      remoteAgentId: elevenStatus.hasAgentId
    }
  });
});

// GET /api/stats - Derived live stats for dashboard
router.get('/stats', async (req, res) => {
  try {
    const stats = await StorageService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
