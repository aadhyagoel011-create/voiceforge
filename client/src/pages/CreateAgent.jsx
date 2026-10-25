import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Save,
  CheckCircle2,
  ArrowRight,
  Plus,
  Trash2,
  Volume2,
  Globe,
  Shield,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

const PRESET_EXAMPLES = [
  {
    name: "Aarogya Clinic Receptionist",
    useCase: "Healthcare & Clinic Front Desk",
    prompt: "Create a friendly clinic receptionist who speaks Hindi and English, answers clinic FAQs, explains opening hours, and helps patients with appointment enquiries."
  },
  {
    name: "AI Interview Practice Coach",
    useCase: "Career & Mock Technical Interviews",
    prompt: "The agent conducts mock interviews, asks questions by voice, and gives feedback on your answers."
  },
  {
    name: "Customer Support Assistant",
    useCase: "SaaS Billing & Account Support",
    prompt: "Create a fast and polite SaaS customer support assistant that handles monthly invoice questions, password resets, and tier upgrades."
  },
  {
    name: "University Admissions Counselor",
    useCase: "Higher Education Admissions",
    prompt: "Build an encouraging university admissions advisor who guides prospective students on entrance exams, cutoff marks, tuition fees, and campus tours in English and Hindi."
  }
];

export default function CreateAgent() {
  const location = useLocation();
  const navigate = useNavigate();

  // Input state
  const [prompt, setPrompt] = useState(location.state?.initialPrompt || PRESET_EXAMPLES[0].prompt);
  const [agentName, setAgentName] = useState(location.state?.initialName || '');
  const [useCase, setUseCase] = useState(location.state?.initialUseCase || '');

  // Generation & Form state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [voices, setVoices] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Editable structured configuration
  const [config, setConfig] = useState({
    name: '',
    role: '',
    purpose: '',
    primaryLanguage: 'English',
    supportedLanguages: ['English'],
    tone: 'Empathetic, clear, and reassuring',
    welcomeMessage: '',
    systemInstructions: '',
    conversationGoals: [],
    faqs: [],
    guardrails: {
      topicsToAvoid: [],
      unknownAnswerBehavior: '',
      humanEscalation: '',
      behavioralConstraints: ''
    },
    voice: { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', provider: 'elevenlabs' },
    status: 'Ready to Test'
  });

  // Active customization tab
  const [activeTab, setActiveTab] = useState('overview');

  // Load available voices
  useEffect(() => {
    async function loadVoices() {
      try {
        const res = await api.getVoices();
        if (res.success && res.data) {
          setVoices(res.data);
        }
      } catch (err) {
        console.warn("Could not load voices catalog:", err.message);
      }
    }
    loadVoices();

    // If initial prompt came from Overview page, automatically parse it!
    if (location.state?.initialPrompt) {
      handleGenerateConfig(location.state.initialPrompt);
    }
  }, []);

  const handleGenerateConfig = async (overridePrompt = null) => {
    const textToParse = overridePrompt || prompt;
    if (!textToParse.trim()) {
      setErrorMsg("Please enter a description for your voice agent.");
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMsg('');
      const res = await api.parsePrompt(textToParse, agentName, useCase);
      if (res.success) {
        setConfig(res.data);
        setHasGenerated(true);
      }
    } catch (err) {
      setErrorMsg(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // FAQ management
  const handleAddFaq = () => {
    setConfig({
      ...config,
      faqs: [
        ...config.faqs,
        { id: `faq-${Date.now()}`, question: '', answer: '' }
      ]
    });
  };

  const handleUpdateFaq = (index, field, value) => {
    const updated = [...config.faqs];
    updated[index][field] = value;
    setConfig({ ...config, faqs: updated });
  };

  const handleDeleteFaq = (index) => {
    const updated = config.faqs.filter((_, i) => i !== index);
    setConfig({ ...config, faqs: updated });
  };

  // Save agent
  const handleSave = async () => {
    if (!config.name.trim()) {
      alert("Please give your voice agent a name before saving.");
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.createAgent(config);
      if (res.success && res.data) {
        // Navigate to the saved agent details page
        navigate(`/agents/${res.data.id}`, {
          state: { flashMessage: `Agent "${res.data.name}" successfully created and saved!` }
        });
      }
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>Natural-Language Voice Agent Builder</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Step 1: Describe your agent in plain natural language. Step 2: Review and customize the generated configuration. Step 3: Save and test.
        </p>
      </div>

      {errorMsg && (
        <div style={{
          padding: '12px 16px',
          background: '#FFF1F2',
          border: '1px solid #FECDD3',
          color: '#E11D48',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontSize: '0.88rem'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Step 1: Describe */}
      <div className="card" style={{ marginBottom: '28px', border: '1.5px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--primary-purple)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            1
          </div>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Describe Your Voice Agent</h2>
        </div>

        {/* Quick Presets */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Choose a quick example prompt:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PRESET_EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(ex.prompt);
                  setAgentName(ex.name);
                  setUseCase(ex.useCase);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  background: prompt === ex.prompt ? 'var(--bg-muted)' : '#FFFFFF',
                  color: prompt === ex.prompt ? 'var(--primary-purple)' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Natural-Language Instructions & Purpose *</label>
          <textarea
            className="form-textarea"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Create a friendly clinic receptionist who speaks Hindi and English, answers clinic FAQs, explains opening hours, and helps patients with appointment enquiries."
          />
          <div className="form-hint">
            Include language preferences (Hindi, English, Bilingual), role persona, key knowledge, and behaviors.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label className="form-label">Agent Name (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Aarogya Clinic Receptionist"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Use Case / Industry (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Healthcare, Customer Support, Admissions"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleGenerateConfig()}
            disabled={isGenerating || !prompt.trim()}
            id="btn-generate-agent-config"
          >
            <Sparkles size={17} />
            <span>{isGenerating ? 'Structuring Agent...' : 'Generate Structured Configuration'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Step 2: Customise & Step 3: Save */}
      {hasGenerated && (
        <div className="card" style={{ border: '1.5px solid var(--secondary-lavender)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#1E824C',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                2
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Review & Customise Generated Agent</h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  All attributes are fully editable before saving.
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleSave}
              disabled={isSaving}
              id="btn-save-new-agent"
            >
              <Save size={18} />
              <span>{isSaving ? 'Saving Agent...' : 'Save Agent'}</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="tabs-header">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview & Voice
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'instructions' ? 'active' : ''}`}
              onClick={() => setActiveTab('instructions')}
            >
              Instructions & Persona
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'faqs' ? 'active' : ''}`}
              onClick={() => setActiveTab('faqs')}
            >
              Knowledge & FAQs ({config.faqs?.length || 0})
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'guardrails' ? 'active' : ''}`}
              onClick={() => setActiveTab('guardrails')}
            >
              Guardrails & Safety
            </button>
          </div>

          {/* Tab 1: Overview & Voice */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '18px' }}>
                <div className="form-group">
                  <label className="form-label">Agent Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Language</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.primaryLanguage}
                    onChange={(e) => setConfig({ ...config, primaryLanguage: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Selected Voice</label>
                  <select
                    className="form-select"
                    value={config.voice?.id || ''}
                    onChange={(e) => {
                      const selected = voices.find(v => v.id === e.target.value) || { id: e.target.value, name: 'Custom Voice' };
                      setConfig({ ...config, voice: { id: selected.id, name: selected.name, tone: selected.tone, provider: 'elevenlabs' } });
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
                  <label className="form-label">Initial Status</label>
                  <select
                    className="form-select"
                    value={config.status}
                    onChange={(e) => setConfig({ ...config, status: e.target.value })}
                  >
                    <option value="Ready to Test">Ready to Test</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role & Purpose</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={config.purpose}
                  onChange={(e) => setConfig({ ...config, purpose: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">First Welcome Greeting Spoken by Agent *</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                />
                <div className="form-hint">This is the first sentence the agent says when a call connects.</div>
              </div>
            </div>
          )}

          {/* Tab 2: Instructions & Persona */}
          {activeTab === 'instructions' && (
            <div>
              <div className="form-group">
                <label className="form-label">Tone of Voice & Personality</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.tone}
                  onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">System Instructions (Prompts & Behavioral Rules)</label>
                <textarea
                  className="form-textarea"
                  rows={8}
                  value={config.systemInstructions}
                  onChange={(e) => setConfig({ ...config, systemInstructions: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Key Conversation Goals</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(config.conversationGoals || []).map((goal, gIdx) => (
                    <div key={gIdx} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={goal}
                        onChange={(e) => {
                          const updated = [...config.conversationGoals];
                          updated[gIdx] = e.target.value;
                          setConfig({ ...config, conversationGoals: updated });
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          const updated = config.conversationGoals.filter((_, i) => i !== gIdx);
                          setConfig({ ...config, conversationGoals: updated });
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
                    onClick={() => setConfig({ ...config, conversationGoals: [...(config.conversationGoals || []), ''] })}
                  >
                    <Plus size={15} />
                    <span>Add Goal</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Knowledge & FAQs */}
          {activeTab === 'faqs' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Questions and verified answers taught to this voice agent.
                </span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddFaq}>
                  <Plus size={15} />
                  <span>Add FAQ</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(config.faqs || []).map((faq, fIdx) => (
                  <div
                    key={faq.id || fIdx}
                    style={{
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '0.82rem', margin: 0 }}>
                        FAQ Item #{fIdx + 1}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(fIdx)}
                        style={{ background: 'none', border: 'none', color: '#E11D48', cursor: 'pointer' }}
                        title="Delete FAQ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="User question (e.g. What are your opening hours?)"
                        value={faq.question}
                        onChange={(e) => handleUpdateFaq(fIdx, 'question', e.target.value)}
                      />
                    </div>

                    <div>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder="Spoken answer by the voice agent..."
                        value={faq.answer}
                        onChange={(e) => handleUpdateFaq(fIdx, 'answer', e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                {(config.faqs || []).length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    No FAQs added yet. Click "+ Add FAQ" above.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Guardrails & Safety */}
          {activeTab === 'guardrails' && (
            <div>
              <div className="form-group">
                <label className="form-label">Behavior when an Answer is Unknown</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={config.guardrails?.unknownAnswerBehavior || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    guardrails: { ...config.guardrails, unknownAnswerBehavior: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Human Escalation Protocol</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={config.guardrails?.humanEscalation || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    guardrails: { ...config.guardrails, humanEscalation: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Behavioral Constraints</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={config.guardrails?.behavioralConstraints || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    guardrails: { ...config.guardrails, behavioralConstraints: e.target.value }
                  })}
                />
              </div>
            </div>
          )}

          {/* Bottom Save Action */}
          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/agents')}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save size={18} />
              <span>{isSaving ? 'Saving...' : 'Save Agent & Continue'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
