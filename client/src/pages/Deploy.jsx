import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Rocket,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Mic,
  ArrowRight,
  PhoneCall
} from 'lucide-react';
import { api } from '../services/api';

export default function Deploy() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agentsRes, statusRes] = await Promise.all([
        api.getAgents(),
        api.getElevenLabsStatus()
      ]);

      if (agentsRes.success) {
        setAgents(agentsRes.data || []);
        const target = id ? agentsRes.data.find(a => a.id === id) : agentsRes.data[0];
        setSelectedAgent(target || agentsRes.data[0] || null);
      }

      if (statusRes.success) {
        setIntegrationStatus(statusRes.data);
      }
    } catch (err) {
      console.error("Failed to load deploy data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (snippet, index) => {
    navigator.clipboard.writeText(snippet);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  // Readiness evaluation
  const hasLocalConfig = !!selectedAgent;
  const hasInstructions = !!selectedAgent?.systemInstructions && selectedAgent.systemInstructions.length > 20;
  const hasVoice = !!selectedAgent?.voice?.id;
  const hasElevenLabsApiKey = !!integrationStatus?.hasApiKey;
  const hasRemoteAgentId = !!integrationStatus?.hasAgentId;
  const hasTestedLive = !!integrationStatus?.elevenLabsLiveAvailable;

  const checklistItems = [
    {
      title: "Local Agent Configuration Saved",
      description: "Agent metadata, welcome greeting, and personality are saved in local JSON storage.",
      passed: hasLocalConfig,
      action: null
    },
    {
      title: "Agent Instructions & Behavioral Rules Configured",
      description: "System instructions and role boundaries are defined.",
      passed: hasInstructions,
      action: `/agents/${selectedAgent?.id}`
    },
    {
      title: "Voice ID Selected",
      description: `Assigned voice: ${selectedAgent?.voice?.name || 'None'}`,
      passed: hasVoice,
      action: `/agents/${selectedAgent?.id}`
    },
    {
      title: "ElevenLabs API Key Configured",
      description: hasElevenLabsApiKey
        ? "ELEVENLABS_API_KEY detected in .env (Masked for security)."
        : "ELEVENLABS_API_KEY is missing in root .env file.",
      passed: hasElevenLabsApiKey,
      action: "/settings"
    },
    {
      title: "Remote ElevenLabs Agent ID Configured",
      description: hasRemoteAgentId
        ? `ELEVENLABS_AGENT_ID detected (${integrationStatus?.agentIdMasked}).`
        : "ELEVENLABS_AGENT_ID is blank in .env. Create an agent in ElevenLabs UI and paste the ID.",
      passed: hasRemoteAgentId,
      action: "/settings"
    },
    {
      title: "Web Conversational AI Session Ready",
      description: hasElevenLabsApiKey && hasRemoteAgentId
        ? "Signed URL authorization ready for client-side embedding."
        : "Demo Mode active. Configure keys in .env for production client SDK session.",
      passed: hasElevenLabsApiKey && hasRemoteAgentId,
      action: `/playground?agentId=${selectedAgent?.id}`
    }
  ];

  const totalChecks = checklistItems.length;
  const passedChecks = checklistItems.filter(i => i.passed).length;
  const readinessPercent = Math.round((passedChecks / totalChecks) * 100);

  // Copyable Embed snippets
  const embedSnippetReact = `// 1. Install official SDK in your app:
// npm install @11labs/client

import React, { useState } from 'react';
import { Conversation } from '@11labs/client';

export function VoiceAssistantWidget() {
  const [conversation, setConversation] = useState(null);
  const [status, setStatus] = useState('disconnected');

  async function startCall() {
    // Request signed url from your backend (never expose your API key)
    const res = await fetch('/api/elevenlabs/signed-url', { method: 'POST' });
    const { signedUrl } = await res.json();

    const conv = await Conversation.startSession({
      signedUrl,
      onConnect: () => setStatus('connected'),
      onDisconnect: () => setStatus('disconnected'),
      onModeChange: (mode) => console.log('Mode:', mode),
      onMessage: (msg) => console.log('Transcript:', msg)
    });
    setConversation(conv);
  }

  return (
    <button onClick={conversation ? () => conversation.endSession() : startCall}>
      {status === 'connected' ? 'End Voice Call' : 'Talk with Voice Assistant'}
    </button>
  );
}`;

  const embedSnippetVanilla = `<!-- Include ElevenLabs Conversational AI Web Widget -->
<script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>
<elevenlabs-convai agent-id="${integrationStatus?.hasAgentId ? process.env?.ELEVENLABS_AGENT_ID || 'YOUR_ELEVENLABS_AGENT_ID' : 'YOUR_ELEVENLABS_AGENT_ID'}"></elevenlabs-convai>`;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
        Loading deployment checklist...
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Deployment Readiness</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Inspect production readiness, credentials status, and copy integration code.
          </p>
        </div>

        {/* Agent Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Agent:</span>
          <select
            className="form-select"
            value={selectedAgent?.id || ''}
            onChange={(e) => {
              const a = agents.find(ag => ag.id === e.target.value);
              setSelectedAgent(a || null);
            }}
          >
            {agents.map(ag => (
              <option key={ag.id} value={ag.id}>{ag.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Readiness Score Banner */}
      <div className="card" style={{ marginBottom: '28px', border: '1.5px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Rocket size={20} style={{ color: readinessPercent === 100 ? 'var(--mint-dark)' : 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                {readinessPercent === 100 ? 'Production Ready!' : `${passedChecks} of ${totalChecks} Deployment Checks Passed`}
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Agent: <strong>{selectedAgent?.name}</strong>
            </p>
          </div>

          <div style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: readinessPercent === 100 ? 'var(--mint-dark)' : 'var(--primary)'
          }}>
            {readinessPercent}%
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{
            width: `${readinessPercent}%`,
            height: '100%',
            background: readinessPercent === 100 ? 'var(--mint-dark)' : 'var(--primary)',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '18px' }}>Pre-Flight Checklist</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {checklistItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: item.passed ? 'rgba(221, 247, 236, 0.35)' : 'rgba(255, 241, 242, 0.45)',
                border: `1px solid ${item.passed ? '#A7F3D0' : '#FECDD3'}`
              }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ marginTop: '2px' }}>
                  {item.passed ? (
                    <CheckCircle2 size={19} style={{ color: '#1E824C' }} />
                  ) : (
                    <XCircle size={19} style={{ color: '#E11D48' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {item.description}
                  </div>
                </div>
              </div>

              {item.action && !item.passed && (
                <Link to={item.action} className="btn btn-secondary btn-sm" style={{ flexShrink: 0, marginLeft: '12px' }}>
                  Configure →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Integration Code Snippets */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Code2 size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Copyable Integration Code</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Use these client snippets to embed your voice agent into any React web application or static website.
        </p>

        {/* React SDK Snippet */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              React + @11labs/client (Recommended for Web Apps)
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleCopyCode(embedSnippetReact, 1)}
            >
              {copiedIndex === 1 ? <Check size={14} style={{ color: '#1E824C' }} /> : <Copy size={14} />}
              <span>{copiedIndex === 1 ? 'Copied!' : 'Copy React Code'}</span>
            </button>
          </div>
          <pre style={{
            background: '#20213A',
            color: '#F8F7FF',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            overflowX: 'auto',
            fontFamily: 'monospace',
            lineHeight: 1.45
          }}>
            {embedSnippetReact}
          </pre>
        </div>

        {/* Script Tag Snippet */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Vanilla HTML / Script Widget Embed
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleCopyCode(embedSnippetVanilla, 2)}
            >
              {copiedIndex === 2 ? <Check size={14} style={{ color: '#1E824C' }} /> : <Copy size={14} />}
              <span>{copiedIndex === 2 ? 'Copied!' : 'Copy Script Tag'}</span>
            </button>
          </div>
          <pre style={{
            background: '#20213A',
            color: '#F8F7FF',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem',
            overflowX: 'auto',
            fontFamily: 'monospace',
            lineHeight: 1.45
          }}>
            {embedSnippetVanilla}
          </pre>
        </div>
      </div>

      {/* Telephony Notice */}
      <div className="card" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <PhoneCall size={18} style={{ color: 'var(--text-muted)' }} />
          <h4 style={{ fontSize: '0.98rem', margin: 0, color: 'var(--text-secondary)' }}>
            Telephony & SIP Trunk Integration
          </h4>
          <span className="badge badge-draft">Roadmap — Coming Soon</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
          Direct inbound/outbound phone numbers via Twilio SIP trunking will be available in future releases. Web-based voice streaming via WebSockets is fully supported today.
        </p>
      </div>
    </div>
  );
}
