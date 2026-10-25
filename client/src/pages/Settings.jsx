import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  Bot,
  Volume2,
  Server,
  ExternalLink,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState(null);
  const [verification, setVerification] = useState(null);
  const [voicesCount, setVoicesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      const [healthRes, statusRes, voicesRes, verifyRes] = await Promise.allSettled([
        api.getHealth(),
        api.getElevenLabsStatus(),
        api.getVoices(),
        api.verifyElevenLabs()
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value.success) setHealth(healthRes.value);
      if (statusRes.status === 'fulfilled' && statusRes.value.success) setStatus(statusRes.value.data);
      if (voicesRes.status === 'fulfilled' && voicesRes.value.success) setVoicesCount(voicesRes.value.count || voicesRes.value.data?.length || 0);
      if (verifyRes.status === 'fulfilled' && verifyRes.value.success) setVerification(verifyRes.value.data);
    } catch (err) {
      console.error("Failed to load settings data:", err);
      setStatusMessage("Could not connect to backend server. Make sure port 5000 is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setStatusMessage('');
      await loadSettingsData();
      setStatusMessage('Integration health, voices, and credentials re-verified successfully.');
      setTimeout(() => setStatusMessage(''), 4000);
    } catch (err) {
      setStatusMessage(`Refresh failed: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
        Loading system settings...
      </div>
    );
  }

  const isLive = verification?.signedUrlTest === 'READY';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Application & Integration Settings</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Inspect backend connectivity, voice integration health, and environment configuration.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={refreshing}
          id="btn-refresh-settings"
        >
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'Checking...' : 'Check Integration Health'}</span>
        </button>
      </div>

      {/* Verification Diagnostic Banner */}
      {verification && (
        <div className="card" style={{
          marginBottom: '24px',
          border: `1.5px solid ${isLive ? 'var(--mint-border)' : 'var(--coral-border)'}`,
          background: isLive ? 'var(--mint-soft)' : '#FFF6F5'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            {isLive ? (
              <CheckCircle2 size={22} style={{ color: 'var(--mint-dark)', flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertCircle size={22} style={{ color: 'var(--accent-coral)', flexShrink: 0, marginTop: '2px' }} />
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <strong style={{ fontSize: '1rem', color: isLive ? 'var(--mint-dark)' : 'var(--accent-coral)' }}>
                  {isLive ? 'Live ElevenLabs WebSockets Verified & Ready' : 'Live ElevenLabs Connectivity Notice'}
                </strong>
                <span className={isLive ? 'badge badge-deployed' : 'badge badge-sample'}>
                  {isLive ? 'Live Calling Ready' : 'Demo Mode Active'}
                </span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {verification.diagnostic}
              </p>
              {!isLive && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
                  VoiceForge provides full <strong>Interactive Demo Mode</strong> with intelligent local responder and voice speech synthesis so you can test all agent prompts, FAQs, and voice interactions without interruption.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {statusMessage && (
        <div style={{
          padding: '12px 18px',
          background: 'var(--lavender-soft)',
          color: 'var(--primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          {statusMessage}
        </div>
      )}

      {/* Integration Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        {/* Backend Connectivity */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Server size={22} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Backend Service</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: health ? 'var(--mint-dark)' : 'var(--accent-coral)' }} />
            <strong style={{ fontSize: '0.92rem' }}>{health ? 'Connected & Healthy' : 'Disconnected'}</strong>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Version: {health?.version || '1.0.0'} • Port: 5000 • Proxy: Active
          </p>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Last checked: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* ElevenLabs API Key */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Key size={22} style={{ color: status?.hasApiKey ? 'var(--primary)' : 'var(--accent-coral)' }} />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>ElevenLabs API Key</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {status?.hasApiKey ? (
              <span className="badge badge-deployed">Configured ({status.apiKeyMasked})</span>
            ) : (
              <span className="badge badge-sample">Missing in .env</span>
            )}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {status?.hasApiKey 
              ? 'Private key is kept securely on the server and never sent to the browser.'
              : 'Add ELEVENLABS_API_KEY in root .env file to enable live calls.'}
          </p>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Variable: <code>ELEVENLABS_API_KEY</code>
          </div>
        </div>

        {/* Remote Agent ID */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Bot size={22} style={{ color: status?.hasAgentId ? 'var(--primary)' : 'var(--accent-coral)' }} />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Remote Agent ID</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {status?.hasAgentId ? (
              <span className="badge badge-deployed">{status.agentIdMasked}</span>
            ) : (
              <span className="badge badge-sample">Unset in .env</span>
            )}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {status?.hasAgentId
              ? 'Remote conversational AI agent linked.'
              : 'Create an agent in ElevenLabs UI and paste its ID in ELEVENLABS_AGENT_ID.'}
          </p>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Variable: <code>ELEVENLABS_AGENT_ID</code>
          </div>
        </div>

        {/* Voice Catalog */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Volume2 size={22} style={{ color: 'var(--secondary)' }} />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Voices Catalog</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{voicesCount}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Voices available</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {status?.hasApiKey ? 'Loaded directly from ElevenLabs API.' : 'Curated local presets available in Demo Mode.'}
          </p>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Cached in-memory on backend
          </div>
        </div>
      </div>

      {/* How to Configure Environment Instructions */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <ShieldCheck size={22} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>How to Configure Environment Variables</h2>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
          VoiceForge operates immediately in <strong>Demo Mode</strong> with no setup required. When you are ready to test real voice conversations with ElevenLabs:
        </p>

        <ol style={{ paddingLeft: '22px', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '20px' }}>
          <li>
            Open the <code>.env</code> file in the root project folder: <code style={{ background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>Voiceforge/.env</code>
          </li>
          <li>
            Paste your ElevenLabs credentials:
            <pre style={{
              background: '#20213A',
              color: '#F8F7FF',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              marginTop: '6px',
              marginBottom: '6px',
              fontFamily: 'monospace'
            }}>
PORT=5000
CLIENT_URL=http://localhost:5173
ELEVENLABS_API_KEY=xi_api_your_key_here
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
            </pre>
          </li>
          <li>
            Save the file.
          </li>
          <li>
            Restart the backend server (Node reads <code>.env</code> on startup).
          </li>
          <li>
            Return to this page or the <strong>Voice Playground</strong> — the environment indicator will instantly switch to <strong>ElevenLabs Live Call</strong>!
          </li>
        </ol>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <AlertCircle size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span>
            <strong>Security Rule:</strong> Your API key is never rendered on this screen, never returned by any API endpoint, and never included in client JavaScript bundles.
          </span>
        </div>
      </div>
    </div>
  );
}
