import express from 'express';
import { StorageService } from '../services/storage.js';

const router = express.Router();

// GET /api/conversations - List all conversation sessions
router.get('/', async (req, res) => {
  try {
    const { agentId, type, search } = req.query;
    let conversations = await StorageService.getConversations();

    if (agentId) {
      conversations = conversations.filter(c => c.agentId === agentId);
    }

    if (type) {
      conversations = conversations.filter(c => c.type && c.type.toLowerCase() === type.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      conversations = conversations.filter(c => 
        (c.agentName && c.agentName.toLowerCase().includes(q)) ||
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.transcript && c.transcript.some(t => t.text && t.text.toLowerCase().includes(q)))
      );
    }

    res.json({ success: true, count: conversations.length, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/conversations/:id - Single conversation
router.get('/:id', async (req, res) => {
  try {
    const conversation = await StorageService.getConversationById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/conversations - Save new conversation session
router.post('/', async (req, res) => {
  try {
    const { agentId, agentName, transcript, type, duration, metadata } = req.body;
    if (!agentId) {
      return res.status(400).json({ success: false, error: "agentId is required" });
    }

    const saved = await StorageService.saveConversation({
      agentId,
      agentName,
      transcript: transcript || [],
      type: type || "Demo Mode",
      duration: duration || "0m 00s",
      metadata: metadata || {}
    });

    res.status(201).json({ success: true, data: saved, message: "Conversation session saved." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
