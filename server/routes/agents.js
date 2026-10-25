import express from 'express';
import { StorageService } from '../services/storage.js';
import { parsePromptToAgentConfig, refineAgentConfig } from '../services/agentParser.js';

const router = express.Router();

// GET /api/agents - List all agents
router.get('/', async (req, res) => {
  try {
    const agents = await StorageService.getAgents();
    res.json({ success: true, count: agents.length, data: agents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agents/parse-prompt - Convert natural language description into structured config
router.post('/parse-prompt', async (req, res) => {
  try {
    const { prompt, name, useCase } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: "A non-empty prompt description is required." });
    }

    const parsedConfig = parsePromptToAgentConfig({ prompt, name, useCase });
    res.json({ success: true, data: parsedConfig });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/agents/:id - Get single agent
router.get('/:id', async (req, res) => {
  try {
    const agent = await StorageService.getAgentById(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }
    res.json({ success: true, data: agent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agents - Save new agent
router.post('/', async (req, res) => {
  try {
    const { name, role, purpose, welcomeMessage, systemInstructions } = req.body;
    if (!name || !purpose) {
      return res.status(400).json({ success: false, error: "Agent name and purpose are required." });
    }

    const saved = await StorageService.saveAgent(req.body);
    res.status(201).json({ success: true, data: saved, message: "Agent created successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/agents/:id - Update agent configuration
router.put('/:id', async (req, res) => {
  try {
    const updated = await StorageService.updateAgent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }
    res.json({ success: true, data: updated, message: "Agent updated successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/agents/:id - Delete agent
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await StorageService.deleteAgent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }
    res.json({ success: true, message: "Agent deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agents/:id/duplicate - Duplicate agent
router.post('/:id/duplicate', async (req, res) => {
  try {
    const duplicate = await StorageService.duplicateAgent(req.params.id);
    if (!duplicate) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }
    res.status(201).json({ success: true, data: duplicate, message: "Agent duplicated successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agents/:id/refine - Refine agent with natural language instruction
router.post('/:id/refine', async (req, res) => {
  try {
    const { instruction, saveDirectly } = req.body;
    if (!instruction || typeof instruction !== 'string' || instruction.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Refinement instruction is required." });
    }

    const currentAgent = await StorageService.getAgentById(req.params.id);
    if (!currentAgent) {
      return res.status(404).json({ success: false, error: "Agent not found" });
    }

    const { refinedAgent, changes, statusNote } = refineAgentConfig(currentAgent, instruction);

    if (saveDirectly) {
      const saved = await StorageService.updateAgent(req.params.id, refinedAgent);
      return res.json({
        success: true,
        data: saved,
        changes,
        statusNote,
        saved: true,
        message: "Refinements saved to local agent configuration."
      });
    }

    res.json({
      success: true,
      data: refinedAgent,
      changes,
      statusNote,
      saved: false,
      message: "Refinements generated. Review and save changes."
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
