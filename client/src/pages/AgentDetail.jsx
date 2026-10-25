import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Save,
  Mic,
  Rocket,
  Trash2,
  Copy,
  ArrowLeft,
  CheckCircle2,
  Plus,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function AgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [voices, setVoices] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [flashMsg, setFlashMsg] = useState(location.state?.flashMessage || '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadAgent();
    loadVoices();
  }, [id]);

  const loadAgent = async () => {
    try {
      setLoading(true);
      const res = await api.getAgent(id);
      if (res.success) {
        setAgent(res.data);
      } else {
        alert("Agent not found");
        navigate('/agents');
      }
    } catch (err) {
      console.error("Failed to fetch agent:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadVoices = async () => {
    try {
      const res = await api.getVoices();
      if (res.success && res.data) {
        setVoices(res.data);
      }
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.updateAgent(id, agent);
      if (res.success) {
        setAgent(res.data);
        setFlashMsg("Agent configuration saved successfully.");
        setTimeout(() => setFlashMsg(''), 4000);
      }
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await api.duplicateAgent(id);
      if (res.success) {
        navigate(`/agents/${res.data.id}`, {
          state: { flashMessage: `Duplicated as "${res.data.name}"` }
        });
      }
    } catch (err) {
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await api.deleteAgent(id);
      if (res.success) {
        navigate('/agents');
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // FAQ helpers
  const handleAddFaq = () => {
    setAgent({
      ...agent,
      faqs: [...(agent.faqs || []), { id: `faq-${Date.now()}`, question: '', answer: '' }]
    });
  };

  const handleUpdateFaq = (idx, field, val) => {
    const updated = [...(agent.faqs || [])];
    updated[idx][field] = val;
    setAgent({ ...agent, faqs: updated });
  };

  const handleDeleteFaq = (idx) => {
    const updated = (agent.faqs || []).filter((_, i) => i !== idx);
    setAgent({ ...agent, faqs: updated });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
        Loading agent details...
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div>
      {/* Flash message banner */}
      {flashMsg && (
        <div style={{
          padding: '12px 18px',
          background: 'var(--soft-mint)',
          color: 'var(--mint-dark)',
          border: '1px solid #A7F3D0',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          <span>{flashMsg}</span>
        </div>
      )}

      {/* Top Header & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Link to="/agents" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <ArrowLeft size={18} />
            </Link>
            <h1 style={{ fontSize: '1.6rem', margin: 0 }}>{agent.name}</h1>
            <StatusBadge status={agent.status} isSample={agent.isSample} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ID: <code style={{ background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>{agent.id}</code>
            {' '}• Last updated: {new Date(agent.updatedAt).toLocaleString()}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline-purple"
            onClick={() => navigate(`/playground?agentId=${agent.id}`)}
            id="btn-agent-detail-playground"
          >
            <Mic size={16} />
            <span>Talk to Agent</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/deploy/${agent.id}`)}
          >
            <Rocket size={16} />
            <span>Deployment</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleDuplicate}
            title="Duplicate Agent"
          >
            <Copy size={16} />
          </button>

          <button
            className="btn btn-danger"
            onClick={() => setShowDeleteModal(true)}
            title="Delete Agent"
          >
            <Trash2 size={16} />
          </button>

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="card">
        {/* Tabs */}
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview & Voice
          </button>
          <button
            className={`tab-btn ${activeTab === 'instructions' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructions')}
          >
            Instructions & Persona
          </button>
          <button
            className={`tab-btn ${activeTab === 'faqs' ? 'active' : ''}`}
            onClick={() => setActiveTab('faqs')}
          >
            Knowledge & FAQs ({agent.faqs?.length || 0})
          </button>
          <button
            className={`tab-btn ${activeTab === 'guardrails' ? 'active' : ''}`}
            onClick={() => setActiveTab('guardrails')}
          >
            Guardrails & Safety
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '18px' }}>
              <div className="form-group">
                <label className="form-label">Agent Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={agent.name}
                  onChange={(e) => setAgent({ ...agent, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Language</label>
                <input
                  type="text"
                  className="form-input"
                  value={agent.primaryLanguage || ''}
                  onChange={(e) => setAgent({ ...agent, primaryLanguage: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Voice</label>
                <select
                  className="form-select"
                  value={agent.voice?.id || ''}
                  onChange={(e) => {
                    const sel = voices.find(v => v.id === e.target.value) || { id: e.target.value, name: 'Custom Voice' };
                    setAgent({ ...agent, voice: { id: sel.id, name: sel.name, tone: sel.tone, provider: 'elevenlabs' } });
                  }}
                >
                  {voices.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.tone || v.accent || 'Natural'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={agent.status || 'Ready to Test'}
                  onChange={(e) => setAgent({ ...agent, status: e.target.value })}
                >
                  <option value="Ready to Test">Ready to Test</option>
                  <option value="Draft">Draft</option>
                  <option value="Deployed">Deployed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Role & Purpose</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={agent.purpose || ''}
                onChange={(e) => setAgent({ ...agent, purpose: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Welcome Message (First Spoken Greeting)</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={agent.welcomeMessage || ''}
                onChange={(e) => setAgent({ ...agent, welcomeMessage: e.target.value })}
              />
              <div className="form-hint">Agent will speak this message as soon as the session begins.</div>
            </div>
          </div>
        )}

        {/* Tab 2: Instructions */}
        {activeTab === 'instructions' && (
          <div>
            <div className="form-group">
              <label className="form-label">Personality & Tone</label>
              <input
                type="text"
                className="form-input"
                value={agent.tone || ''}
                onChange={(e) => setAgent({ ...agent, tone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">System Instructions</label>
              <textarea
                className="form-textarea"
                rows={9}
                value={agent.systemInstructions || ''}
                onChange={(e) => setAgent({ ...agent, systemInstructions: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Conversation Goals</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(agent.conversationGoals || []).map((goal, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={goal}
                      onChange={(e) => {
                        const updated = [...agent.conversationGoals];
                        updated[idx] = e.target.value;
                        setAgent({ ...agent, conversationGoals: updated });
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        const updated = agent.conversationGoals.filter((_, i) => i !== idx);
                        setAgent({ ...agent, conversationGoals: updated });
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                  onClick={() => setAgent({ ...agent, conversationGoals: [...(agent.conversationGoals || []), ''] })}
                >
                  <Plus size={15} />
                  <span>Add Goal</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: FAQs */}
        {activeTab === 'faqs' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Knowledge base question & answer pairs for instant spoken answers.
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddFaq}>
                <Plus size={15} />
                <span>Add FAQ</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(agent.faqs || []).map((faq, idx) => (
                <div
                  key={faq.id || idx}
                  style={{
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>FAQ #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(idx)}
                      style={{ background: 'none', border: 'none', color: '#E11D48', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Question..."
                      value={faq.question}
                      onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                    />
                  </div>
                  <div>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Spoken answer..."
                      value={faq.answer}
                      onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Guardrails */}
        {activeTab === 'guardrails' && (
          <div>
            <div className="form-group">
              <label className="form-label">Behavior when an Answer is Unknown</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={agent.guardrails?.unknownAnswerBehavior || ''}
                onChange={(e) => setAgent({
                  ...agent,
                  guardrails: { ...agent.guardrails, unknownAnswerBehavior: e.target.value }
                })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Human Escalation Protocol</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={agent.guardrails?.humanEscalation || ''}
                onChange={(e) => setAgent({
                  ...agent,
                  guardrails: { ...agent.guardrails, humanEscalation: e.target.value }
                })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Behavioral Constraints</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={agent.guardrails?.behavioralConstraints || ''}
                onChange={(e) => setAgent({
                  ...agent,
                  guardrails: { ...agent.guardrails, behavioralConstraints: e.target.value }
                })}
              />
            </div>
          </div>
        )}

        {/* Save button footer */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Deletion"
      >
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Are you sure you want to permanently delete <strong>{agent.name}</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Agent
          </button>
        </div>
      </Modal>
    </div>
  );
}
