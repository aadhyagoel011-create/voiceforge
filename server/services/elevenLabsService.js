/**
 * ElevenLabs Backend Integration Service
 * Securely handles voice retrieval, signed-url conversation authentication,
 * and status checks without leaking private keys to frontend.
 */

import { DEFAULT_VOICES } from './agentParser.js';

let cachedVoices = null;
let lastVoiceFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const ElevenLabsService = {
  getStatus() {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim() || "";
    const agentId = process.env.ELEVENLABS_AGENT_ID?.trim() || "";
    const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || "";
    const llmApiKey = process.env.LLM_API_KEY?.trim() || "";

    const hasApiKey = apiKey.length > 0;
    const hasAgentId = agentId.length > 0;
    const hasVoiceId = voiceId.length > 0;
    const hasLlmKey = llmApiKey.length > 0;

    return {
      hasApiKey,
      hasAgentId,
      hasVoiceId,
      hasLlmKey,
      apiKeyMasked: hasApiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : null,
      agentIdMasked: hasAgentId ? `${agentId.slice(0, 4)}...${agentId.slice(-4)}` : null,
      voiceIdMasked: hasVoiceId ? `${voiceId.slice(0, 4)}...${voiceId.slice(-4)}` : null,
      elevenLabsLiveAvailable: hasApiKey && hasAgentId,
      demoModeAvailable: true,
      message: hasApiKey && hasAgentId
        ? "ElevenLabs credentials configured in environment. Ready for live session verification."
        : "Interactive Demo Mode active. Configure ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in root .env to enable live calls."
    };
  },

  async getVoices() {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();

    // If cache is fresh, return cached
    const now = Date.now();
    if (cachedVoices && (now - lastVoiceFetchTime < CACHE_TTL_MS)) {
      return cachedVoices;
    }

    if (!apiKey) {
      // Return curated preset voices with clean presentation
      const mapped = DEFAULT_VOICES.map(v => ({
        id: v.id,
        name: v.name,
        tone: v.tone || "Natural",
        description: v.description,
        accent: v.accent || "American",
        isCustom: false,
        previewUrl: null
      }));
      return mapped;
    }

    try {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: {
          "xi-api-key": apiKey
        }
      });

      if (!response.ok) {
        console.warn(`ElevenLabs API returned ${response.status} when fetching voices. Falling back to clean preset voices.`);
        return DEFAULT_VOICES.map(v => ({
          id: v.id,
          name: v.name,
          tone: v.tone || "Natural",
          description: v.description,
          accent: v.accent || "American",
          isCustom: false,
          previewUrl: null
        }));
      }

      const data = await response.json();
      const voices = (data.voices || []).map(v => ({
        id: v.voice_id,
        name: v.name,
        description: v.labels ? Object.values(v.labels).join(', ') : v.category || 'Conversational',
        tone: v.labels?.accent || v.category || 'Conversational',
        previewUrl: v.preview_url || null,
        isCustom: v.category === 'cloned' || v.category === 'generated',
        accent: v.labels?.accent || 'American'
      }));

      cachedVoices = voices;
      lastVoiceFetchTime = now;
      return voices;
    } catch (err) {
      console.error("Failed to fetch voices from ElevenLabs:", err.message);
      return DEFAULT_VOICES.map(v => ({
        id: v.id,
        name: v.name,
        tone: v.tone || "Natural",
        description: v.description,
        accent: v.accent || "American",
        isCustom: false,
        previewUrl: null
      }));
    }
  },

  /**
   * Generates a signed URL for secure client-side conversation session
   * Supported endpoint: GET https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=<AGENT_ID>
   */
  async getSignedUrl(customAgentId = null) {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    const agentId = customAgentId?.trim() || process.env.ELEVENLABS_AGENT_ID?.trim();

    if (!apiKey) {
      return {
        success: false,
        error: "ELEVENLABS_API_KEY is not configured in .env",
        code: "MISSING_API_KEY",
        demoModeAvailable: true
      };
    }

    if (!agentId) {
      return {
        success: false,
        error: "No ElevenLabs Agent ID configured in .env (ELEVENLABS_AGENT_ID)",
        code: "MISSING_AGENT_ID",
        demoModeAvailable: true
      };
    }

    try {
      const url = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`;
      const response = await fetch(url, {
        headers: {
          "xi-api-key": apiKey
        }
      });

      if (!response.ok) {
        let errorDetail = "";
        try {
          const errJson = await response.json();
          errorDetail = errJson.detail?.message || errJson.message || JSON.stringify(errJson);
        } catch {
          errorDetail = await response.text();
        }

        if (response.status === 401) {
          return {
            success: false,
            status: 401,
            code: "UNAUTHORIZED_API_KEY",
            error: "The configured ELEVENLABS_API_KEY was rejected by ElevenLabs (401 Unauthorized). Please check your key in .env or use Interactive Demo Mode.",
            demoModeAvailable: true
          };
        }

        if (response.status === 404) {
          return {
            success: false,
            status: 404,
            code: "AGENT_NOT_FOUND",
            error: `ElevenLabs Agent ID "${agentId}" was not found (404). Please verify your remote agent ID in .env.`,
            demoModeAvailable: true
          };
        }

        return {
          success: false,
          status: response.status,
          code: "ELEVENLABS_ERROR",
          error: `ElevenLabs error (${response.status}): ${errorDetail}`,
          demoModeAvailable: true
        };
      }

      const data = await response.json();
      return {
        success: true,
        signedUrl: data.signed_url,
        agentId: agentId
      };
    } catch (err) {
      return {
        success: false,
        code: "NETWORK_ERROR",
        error: `Network failure connecting to ElevenLabs: ${err.message}`,
        demoModeAvailable: true
      };
    }
  }
};
