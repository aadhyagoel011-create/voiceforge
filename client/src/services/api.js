/**
 * Frontend API Service
 * Centralizes all communication with VoiceForge Express backend
 */

const API_BASE = '/api';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `Server error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Health & Stats
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return handleResponse(res);
  },

  // Agents
  async getAgents() {
    const res = await fetch(`${API_BASE}/agents`);
    return handleResponse(res);
  },

  async getAgent(id) {
    const res = await fetch(`${API_BASE}/agents/${id}`);
    return handleResponse(res);
  },

  async createAgent(agentData) {
    const res = await fetch(`${API_BASE}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentData)
    });
    return handleResponse(res);
  },

  async updateAgent(id, agentData) {
    const res = await fetch(`${API_BASE}/agents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentData)
    });
    return handleResponse(res);
  },

  async deleteAgent(id) {
    const res = await fetch(`${API_BASE}/agents/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  async duplicateAgent(id) {
    const res = await fetch(`${API_BASE}/agents/${id}/duplicate`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async parsePrompt(prompt, name = '', useCase = '') {
    const res = await fetch(`${API_BASE}/agents/parse-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, name, useCase })
    });
    return handleResponse(res);
  },

  async refineAgent(id, instruction, saveDirectly = false) {
    const res = await fetch(`${API_BASE}/agents/${id}/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instruction, saveDirectly })
    });
    return handleResponse(res);
  },

  // Conversations
  async getConversations(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/conversations?${query}` : `${API_BASE}/conversations`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async getConversation(id) {
    const res = await fetch(`${API_BASE}/conversations/${id}`);
    return handleResponse(res);
  },

  async saveConversation(convData) {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convData)
    });
    return handleResponse(res);
  },

  // ElevenLabs
  async getElevenLabsStatus() {
    const res = await fetch(`${API_BASE}/elevenlabs/status`);
    return handleResponse(res);
  },

  async verifyElevenLabs() {
    const res = await fetch(`${API_BASE}/elevenlabs/verify`);
    return handleResponse(res);
  },

  async getVoices() {
    const res = await fetch(`${API_BASE}/elevenlabs/voices`);
    return handleResponse(res);
  },

  async getSignedUrl(agentId = null) {
    const res = await fetch(`${API_BASE}/elevenlabs/signed-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId })
    });
    return handleResponse(res);
  }
};
