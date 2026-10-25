import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bot,
  CheckCircle2,
  Rocket,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Mic,
  Clock,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const SAMPLE_PROMPTS = [
  {
    label: "Healthcare Receptionist (Hindi & English)",
    prompt: "Create a friendly clinic receptionist who speaks Hindi and English, answers clinic FAQs, explains opening hours, and helps patients with appointment enquiries."
  },
  {
    label: "AI Mock Interview Coach",
    prompt: "The agent conducts mock interviews, asks questions by voice, and gives feedback on your answers."
  },
  {
    label: "Customer Support (Billing & SaaS)",
    prompt: "Create a fast and polite SaaS customer support assistant that handles monthly invoice questions, password resets, and tier upgrades."
  },
  {
    label: "University Admissions Counselor",
    prompt: "Build an encouraging university admissions advisor who guides prospective students on entrance exams, cutoff marks, tuition fees, and campus tours."
  }
];

export default function Overview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS[0].prompt);
  const [loadingStats, setLoadingStats] = useState(true);
  const [recentConversations, setRecentConversations] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoadingStats(true);
      const [statsRes, convsRes] = await Promise.all([
        api.getStats(),
        api.getConversations()
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (convsRes.success) setRecentConversations((convsRes.data || []).slice(0, 4));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    navigate('/agents/new', { state: { initialPrompt: prompt } });
  };

  return (
    <div>
      {/* Top Banner / Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-brand) 0%, #35258A 60%, var(--secondary-purple) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 40px',
        color: '#FFFFFF',
        marginBottom: '32px',
        boxShadow: 'var(--shadow-indigo)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative waveform in background */}
        <div style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: 0.12,
          pointerEvents: 'none'
        }}>
          <svg width="280" height="120" viewBox="0 0 280 120" fill="none">
            <rect x="10" y="40" width="8" height="40" rx="4" fill="#FFFFFF" />
            <rect x="30" y="25" width="8" height="70" rx="4" fill="#FFFFFF" />
            <rect x="50" y="10" width="8" height="100" rx="4" fill="#FF765F" />
            <rect x="70" y="30" width="8" height="60" rx="4" fill="#FFFFFF" />
            <rect x="90" y="45" width="8" height="30" rx="4" fill="#FFFFFF" />
            <rect x="110" y="20" width="8" height="80" rx="4" fill="#FFFFFF" />
            <rect x="130" y="5" width="8" height="110" rx="4" fill="#FF765F" />
            <rect x="150" y="35" width="8" height="50" rx="4" fill="#FFFFFF" />
            <rect x="170" y="15" width="8" height="90" rx="4" fill="#FFFFFF" />
            <rect x="190" y="40" width="8" height="40" rx="4" fill="#FFFFFF" />
            <rect x="210" y="25" width="8" height="70" rx="4" fill="#FFFFFF" />
            <rect x="230" y="50" width="8" height="20" rx="4" fill="#FFFFFF" />
          </svg>
        </div>

        <div style={{ maxWidth: '720px', position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(233, 227, 255, 0.18)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            padding: '5px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '16px',
            color: '#FFFFFF'
          }}>
            <Sparkles size={14} style={{ color: 'var(--accent-coral)' }} />
            <span>VoiceForge AI Agent Studio</span>
          </div>
          <h1 style={{ color: '#FFFFFF', fontSize: '2.2rem', marginBottom: '12px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Describe It. Talk to It. Deploy It.
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: '1.02rem', lineHeight: 1.55, marginBottom: '24px' }}>
            Convert natural language instructions into production-ready voice assistants. Test back-and-forth dialogue in the interactive Voice Playground with real speech completion and instant refinement.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/playground" className="btn btn-coral" style={{ padding: '11px 22px' }}>
              <Mic size={17} />
              <span>Open Voice Playground</span>
            </Link>
            <Link to="/agents/new" className="btn btn-secondary" style={{ padding: '11px 20px', background: 'rgba(255, 255, 255, 0.95)' }}>
              <span>Build New Agent</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon indigo">
            <Bot size={24} />
          </div>
          <div>
            <div className="stat-value">{loadingStats ? '—' : stats?.totalAgents ?? 0}</div>
            <div className="stat-label">Total Voice Agents</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon mint">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-value">{loadingStats ? '—' : stats?.readyAgents ?? 0}</div>
            <div className="stat-label">Ready to Test</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Rocket size={24} />
          </div>
          <div>
            <div className="stat-value">{loadingStats ? '—' : stats?.deployedAgents ?? 0}</div>
            <div className="stat-label">Production Deployments</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon coral">
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="stat-value">{loadingStats ? '—' : stats?.totalSessions ?? 0}</div>
            <div className="stat-label">Conversation Sessions</div>
          </div>
        </div>
      </div>

      {/* Natural Language Agent Creator Card */}
      <div className="card" style={{ marginBottom: '32px', border: '1.5px solid var(--border-subtle)', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Sparkles size={20} style={{ color: 'var(--primary-brand)' }} />
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Natural Language Voice Agent Generator</h2>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Describe what you want your voice agent to do in plain English or Hindi. Our engine will structure its personality, welcome greetings, system instructions, and FAQs.
        </p>

        {/* Quick sample prompt buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center', fontWeight: 600 }}>Try Example:</span>
          {SAMPLE_PROMPTS.map((sp, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(sp.prompt)}
              style={{
                background: prompt === sp.prompt ? 'var(--electric-lavender)' : '#FFFFFF',
                border: `1px solid ${prompt === sp.prompt ? 'var(--primary-brand)' : 'var(--border-subtle)'}`,
                color: prompt === sp.prompt ? 'var(--primary-brand)' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '6px 13px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {sp.label}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <textarea
            className="form-textarea"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Create a friendly clinic receptionist who speaks Hindi and English, answers clinic FAQs, explains opening hours, and helps patients with appointment enquiries."
            style={{ fontSize: '0.94rem' }}
          />
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <AlertCircle size={15} style={{ color: 'var(--primary-brand)' }} />
            <span>Deterministic local template engine active (No LLM key required)</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            id="overview-generate-btn"
          >
            <Sparkles size={17} />
            <span>Generate Agent Configuration</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Agents & Recent Conversations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Recent Agents */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>Recent Agents</h3>
            <Link to="/agents" style={{ fontSize: '0.82rem', fontWeight: 600 }}>View all agents →</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats?.recentAgents && stats.recentAgents.length > 0 ? (
              stats.recentAgents.map((ag) => {
                const cleanVoice = ag.voice?.name?.replace(/\s*\([^)]*\)/g, '').trim() || 'Rachel';
                return (
                  <div
                    key={ag.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {ag.name}
                        </span>
                        {ag.isSample && <span className="badge badge-sample" style={{ fontSize: '0.7rem' }}>Sample</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {ag.primaryLanguage} • Voice: {cleanVoice}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link
                        to={`/playground?agentId=${ag.id}`}
                        className="btn btn-outline-purple btn-sm"
                        title="Talk to Agent"
                      >
                        <Mic size={14} />
                        <span>Test</span>
                      </Link>
                      <Link
                        to={`/agents/${ag.id}`}
                        className="btn btn-secondary btn-sm"
                        title="Configure Agent"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No agents created yet.</p>
            )}
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>Recent Conversation Sessions</h3>
            <Link to="/conversations" style={{ fontSize: '0.82rem', fontWeight: 600 }}>View all sessions →</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentConversations.length > 0 ? (
              recentConversations.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.agentName}</span>
                    <StatusBadge type={c.type} isSample={c.isSample} />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Duration: {c.duration} • {c.transcript?.length || 0} dialogue turns
                  </div>
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    margin: 0
                  }}>
                    "{c.transcript?.[0]?.text || 'No preview available'}"
                  </p>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No sessions recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
