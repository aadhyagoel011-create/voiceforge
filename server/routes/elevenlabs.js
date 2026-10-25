import express from 'express';
import { ElevenLabsService } from '../services/elevenLabsService.js';

const router = express.Router();

// GET /api/elevenlabs/status - Integration status without revealing private key
router.get('/status', (req, res) => {
  try {
    const status = ElevenLabsService.getStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/elevenlabs/voices - Available voice catalog
router.get('/voices', async (req, res) => {
  try {
    const voices = await ElevenLabsService.getVoices();
    res.json({ success: true, count: voices.length, data: voices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/elevenlabs/signed-url - Request signed conversation URL
router.post('/signed-url', async (req, res) => {
  try {
    const agentId = req.body?.agentId;
    const result = await ElevenLabsService.getSignedUrl(agentId);

    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/elevenlabs/verify - Check integration live readiness and diagnostic
router.get('/verify', async (req, res) => {
  try {
    const status = ElevenLabsService.getStatus();
    const result = await ElevenLabsService.getSignedUrl();
    res.json({
      success: true,
      data: {
        ...status,
        signedUrlTest: result.success ? "READY" : "FAILED",
        diagnostic: result.success
          ? "Live ElevenLabs connection verified successfully."
          : result.error
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
