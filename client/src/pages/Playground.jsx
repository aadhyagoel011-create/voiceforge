import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Square,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Save,
  Volume2,
  VolumeX,
  Pause,
  Send,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  User,
  Bot
} from 'lucide-react';
import { api } from '../services/api';
import { VoiceSessionManager } from '../services/elevenLabsClient';
import WaveformAnimation from '../components/WaveformAnimation';
import StatusBadge from '../components/StatusBadge';

const REFINEMENT_SUGGESTIONS = [
  "Make the greeting shorter and warmer.",
  "Use simpler language without technical jargon.",
  "Respond in Hindi when the caller speaks Hindi.",
  "Ask one question at a time to improve flow.",
  "Recommend human assistance when uncertain."
];

export default function Playground() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedAgentId = searchParams.get('agentId');

  // Agent State
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Integration State
  const [integrationStatus, setIntegrationStatus] = useState(null);

  // Session State
  const [sessionStatus, setSessionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'
  const [sessionMode, setSessionMode] = useState('idle'); // 'idle' | 'listening' | 'speaking'
  const [sessionType, setSessionType] = useState(''); // 'Live ElevenLabs Call' | 'Interactive Demo Mode'
  const [transcripts, setTranscripts] = useState([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [micPermission, setMicPermission] = useState('prompt'); // 'granted' | 'prompt' | 'denied' | 'unsupported'

  // Spoken / Typed input state
  const [userInputValue, setUserInputValue] = useState('');
  const [isMicListening, setIsMicListening] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [waveformData, setWaveformData] = useState(null);

  // Natural Language Refinement State
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinementResult, setRefinementResult] = useState(null);
  const [refinementSaved, setRefinementSaved] = useState(false);

  // Refs
  const voiceManagerRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const transcriptBottomRef = useRef(null);

  useEffect(() => {
    checkMicrophonePermission();
    loadData();

    // Initialize VoiceSessionManager
    voiceManagerRef.current = new VoiceSessionManager({
      onStatusChange: (status) => {
        setSessionStatus(status);
        if (status === 'connected') {
          startDurationTimer();
        } else if (status === 'disconnected') {
          stopDurationTimer();
          setIsMicListening(false);
          setIsAudioPaused(false);
        }
      },
      onModeChange: (mode) => {
        setSessionMode(mode);
        if (mode === 'speaking') {
          setIsMicListening(false);
        }
      },
      onTranscript: (item) => {
        setTranscripts((prev) => [...prev, item]);
      },
      onWaveformData: (freqData) => {
        setWaveformData(freqData);
      },
      onError: (err) => {
        setErrorMessage(err);
      }
    });

    return () => {
      // Clean up session and microphone when leaving page
      if (voiceManagerRef.current) {
        voiceManagerRef.current.endSession();
      }
      stopDurationTimer();
    };
  }, []);

  useEffect(() => {
    // Scroll transcript smoothly to bottom when new message arrives
    if (transcriptBottomRef.current) {
      transcriptBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);

  const checkMicrophonePermission = async () => {
    if (!navigator.permissions?.query) {
      setMicPermission('prompt');
      return;
    }
    try {
      const res = await navigator.permissions.query({ name: 'microphone' });
      setMicPermission(res.state);
      res.onchange = () => {
        setMicPermission(res.state);
      };
    } catch {
      setMicPermission('prompt');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [agentsRes, statusRes] = await Promise.all([
        api.getAgents(),
        api.getElevenLabsStatus()
      ]);

      if (agentsRes.success) {
        setAgents(agentsRes.data || []);
        const initial = requestedAgentId 
          ? agentsRes.data.find(a => a.id === requestedAgentId) || agentsRes.data[0]
          : agentsRes.data[0];
        setSelectedAgent(initial || null);
      }

      if (statusRes.success) {
        setIntegrationStatus(statusRes.data);
      }
    } catch (err) {
      console.error("Failed to load playground data:", err);
      setErrorMessage("Could not load agent details or backend integration status.");
    } finally {
      setLoading(false);
    }
  };

  const handleAgentSelect = (agentId) => {
    if (sessionStatus !== 'disconnected') {
      handleEndConversation();
    }
    const found = agents.find(a => a.id === agentId);
    setSelectedAgent(found || null);
    setSearchParams({ agentId });
    setTranscripts([]);
    setErrorMessage('');
    setRefinementResult(null);
  };

  const startDurationTimer = () => {
    stopDurationTimer();
    setSessionDuration(0);
    timerIntervalRef.current = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}m ${rem < 10 ? '0' : ''}${rem}s`;
  };

  // Start Real Live ElevenLabs Conversation
  const handleStartLiveConversation = async () => {
    if (!selectedAgent) return;
    setErrorMessage('');
    setTranscripts([]);
    setRefinementResult(null);
    setSessionType('Live ElevenLabs Call');

    try {
      // Step 1: Request signed URL from backend
      const signedRes = await api.getSignedUrl(selectedAgent.id);
      if (!signedRes.success) {
        throw new Error(signedRes.error || "Unable to acquire ElevenLabs signed conversation URL.");
      }

      setMicPermission('granted');
      await voiceManagerRef.current.startLiveSession({
        signedUrl: signedRes.data.signedUrl
      });
    } catch (err) {
      console.warn("Live conversation error:", err);
      setErrorMessage(err.message);
      setSessionStatus('disconnected');
    }
  };

  // Start Interactive Demo Conversation
  const handleStartDemoConversation = async () => {
    if (!selectedAgent) return;
    setErrorMessage('');
    setTranscripts([]);
    setRefinementResult(null);
    setSessionType('Interactive Demo Mode');
    setIsAudioPaused(false);

    try {
      await voiceManagerRef.current.startDemoSession(selectedAgent);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  // User submits message (typed or spoken)
  const handleSendUserMessage = async () => {
    if (!userInputValue.trim() || sessionStatus !== 'connected') return;
    const textToSend = userInputValue.trim();
    setUserInputValue('');

    if (sessionType.includes('Live')) {
      // In live mode with SDK, if we want to submit text:
      // Note: @11labs/client primarily streams user mic audio; user text fallback adds to transcript
      setTranscripts(prev => [...prev, {
        speaker: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }]);
    } else {
      // Interactive Demo Mode: passes to local intelligent responder
      await voiceManagerRef.current.handleUserMessage(textToSend);
    }
  };

  // Toggle Microphone Spoken Input (Web Speech Recognition in Demo Mode)
  const handleToggleMicInput = () => {
    if (sessionStatus !== 'connected') return;

    if (isMicListening) {
      voiceManagerRef.current.stopSpeechRecognition();
      setIsMicListening(false);
    } else {
      setIsMicListening(true);
      voiceManagerRef.current.startSpeechRecognition({
        onSpeechStart: () => {
          setIsMicListening(true);
        },
        onSpeechResult: (transcript, isFinal) => {
          setUserInputValue(transcript);
          if (isFinal && transcript.trim().length > 0) {
            voiceManagerRef.current.handleUserMessage(transcript.trim());
            setUserInputValue('');
            setIsMicListening(false);
          }
        },
        onSpeechEnd: () => {
          setIsMicListening(false);
        },
        onError: (err) => {
          setIsMicListening(false);
          setErrorMessage(typeof err === 'string' ? err : 'Speech recognition error. You can still type your message.');
        }
      });
    }
  };

  // Audio Playback Controls
  const handleStopAudio = () => {
    voiceManagerRef.current.stopPlayback();
    setIsAudioPaused(false);
  };

  const handleTogglePauseAudio = () => {
    if (isAudioPaused) {
      voiceManagerRef.current.resumePlayback();
      setIsAudioPaused(false);
    } else {
      voiceManagerRef.current.pausePlayback();
      setIsAudioPaused(true);
    }
  };

  const handleReplayMessage = (text) => {
    voiceManagerRef.current.replayMessage(text);
  };

  // End Conversation & Persist to History
  const handleEndConversation = async () => {
    if (voiceManagerRef.current) {
      await voiceManagerRef.current.endSession();
    }
    stopDurationTimer();
    setIsMicListening(false);
    setIsAudioPaused(false);

    // Persist this completed session to conversation history
    if (transcripts.length > 0 && selectedAgent) {
      try {
        await api.saveConversation({
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
          type: sessionType || "Interactive Demo Mode",
          duration: formatDuration(sessionDuration),
          transcript: transcripts,
          metadata: {
            sessionType,
            voice: cleanVoiceName,
            language: selectedAgent.primaryLanguage,
            endedAt: new Date().toISOString()
          }
        });
      } catch (err) {
        console.warn("Could not save session to history:", err.message);
      }
    }
  };

  // Handle Natural Language Refinement
  const handleApplyRefinement = async (instructionToUse = null) => {
    const instr = instructionToUse || refinementPrompt;
    if (!instr.trim() || !selectedAgent) return;

    try {
      setIsRefining(true);
      setRefinementSaved(false);
      const res = await api.refineAgent(selectedAgent.id, instr, false);
      if (res.success) {
        setRefinementResult(res);
      }
    } catch (err) {
      alert(`Refinement error: ${err.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  // Save Refinement to Agent
  const handleSaveRefinement = async () => {
    if (!refinementResult || !selectedAgent) return;
    try {
      const res = await api.updateAgent(selectedAgent.id, refinementResult.data);
      if (res.success) {
        setSelectedAgent(res.data);
        setRefinementSaved(true);
        // Also update local agents list
        setAgents(agents.map(a => a.id === res.data.id ? res.data : a));
      }
    } catch (err) {
      alert(`Save error: ${err.message}`);
    }
  };

  const isLiveConfigured = integrationStatus?.elevenLabsLiveAvailable;
  const isConnected = sessionStatus === 'connected';
  const cleanVoiceName = selectedAgent?.voice?.name?.replace(/\s*\([^)]*\)/g, '').trim() || 'Rachel';

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
        Loading voice testing playground...
      </div>
    );
  }

  return (
    <div>
      {/* Top Header with Agent Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '4px', fontWeight: 800 }}>Voice Playground</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Real-time interactive voice testing workspace with live waveform, turn completion, and instant refinement.
          </p>
        </div>

        {/* Agent Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Select Agent:</span>
          <select
            className="form-select"
            style={{ minWidth: '240px', fontWeight: 600 }}
            value={selectedAgent?.id || ''}
            onChange={(e) => handleAgentSelect(e.target.value)}
            disabled={isConnected}
            id="playground-agent-select"
          >
            {agents.map(ag => (
              <option key={ag.id} value={ag.id}>
                {ag.name} {ag.isSample ? '(Sample)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Playground Workspace: Left Audio Console & Right Live Transcript */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Left: Audio Testing Console */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
          
          {/* Agent Meta Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Bot size={20} style={{ color: 'var(--primary-brand)' }} />
                <h2 style={{ fontSize: '1.24rem', margin: 0, fontWeight: 700 }}>{selectedAgent?.name}</h2>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span>Voice: <strong>{cleanVoiceName}</strong></span>
                <span>•</span>
                <span>Language: <strong>{selectedAgent?.primaryLanguage || 'English'}</strong></span>
                <span>•</span>
                <span>Tone: <strong>{selectedAgent?.tone || 'Conversational'}</strong></span>
              </div>
            </div>

            {/* Session Type Badge */}
            {isConnected && (
              <span className={`badge ${sessionType.includes('Live') ? 'badge-live' : 'badge-ready'}`}>
                <Radio size={12} className="pulse" />
                <span>{sessionType}</span>
              </span>
            )}
          </div>

          {/* Active Voice Waveform Visualization Box */}
          <div style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 20px',
            textAlign: 'center',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)',
            position: 'relative'
          }}>
            <WaveformAnimation
              mode={sessionMode}
              frequencyData={waveformData}
              height={56}
              barCount={28}
            />

            {/* Speaking / Listening State indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isConnected 
                  ? (sessionMode === 'speaking' ? 'var(--accent-coral)' : sessionMode === 'listening' ? 'var(--primary-brand)' : '#1B7A4C')
                  : '#CBD5E1',
                boxShadow: isConnected && sessionMode !== 'idle' ? '0 0 8px currentColor' : 'none'
              }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {sessionStatus === 'connecting' && 'Connecting to voice session...'}
                {sessionStatus === 'connected' && sessionMode === 'speaking' && 'Agent Speaking (Playing Response)...'}
                {sessionStatus === 'connected' && sessionMode === 'listening' && (isMicListening ? 'Listening to your voice...' : 'Your Turn • Speak or Type below')}
                {sessionStatus === 'connected' && sessionMode === 'idle' && 'Session Active • Ready'}
                {sessionStatus === 'disconnected' && 'Session Idle (Click below to start)'}
              </span>
            </div>

            {/* Duration and Audio status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              {isConnected && (
                <span>Session Duration: <strong>{formatDuration(sessionDuration)}</strong></span>
              )}
              {sessionType === 'Interactive Demo Mode' && isConnected && (
                <span style={{ color: 'var(--secondary-purple)', fontWeight: 600 }}>
                  Local Audio
                </span>
              )}
            </div>

            {/* Playback Controls (Pause / Resume / Stop) */}
            {isConnected && sessionType === 'Interactive Demo Mode' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleTogglePauseAudio}
                  title={isAudioPaused ? "Resume Audio" : "Pause Audio"}
                  disabled={sessionMode !== 'speaking' && !isAudioPaused}
                >
                  {isAudioPaused ? <Play size={14} /> : <Pause size={14} />}
                  <span>{isAudioPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleStopAudio}
                  title="Stop Current Speech"
                  disabled={sessionMode !== 'speaking'}
                >
                  <VolumeX size={14} />
                  <span>Stop Speech</span>
                </button>
              </div>
            )}
          </div>

          {/* Interactive User Input Console (Microphone + Text Fallback) */}
          {isConnected && (
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  YOUR RESPONSE:
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  (Speak via microphone or type a query)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Microphone Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleMicInput}
                  className={`btn ${isMicListening ? 'btn-coral' : 'btn-secondary'} btn-sm`}
                  style={{ flexShrink: 0, padding: '10px 14px' }}
                  title={isMicListening ? "Stop Microphone" : "Speak via Microphone"}
                  disabled={sessionMode === 'speaking'}
                  id="btn-playground-mic"
                >
                  {isMicListening ? <MicOff size={16} /> : <Mic size={16} />}
                  <span>{isMicListening ? 'Listening...' : 'Speak'}</span>
                </button>

                {/* Text Fallback Input */}
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '9px 12px', fontSize: '0.88rem' }}
                  placeholder={sessionMode === 'speaking' ? "Wait for assistant to finish speaking..." : "Type your message or ask a question (e.g. clinic hours, doctor slot, fee)..."}
                  value={userInputValue}
                  onChange={(e) => setUserInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendUserMessage();
                  }}
                  disabled={sessionMode === 'speaking'}
                  id="playground-user-input"
                />

                {/* Send Button */}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0, padding: '10px 16px' }}
                  onClick={handleSendUserMessage}
                  disabled={!userInputValue.trim() || sessionMode === 'speaking'}
                  id="btn-playground-send"
                >
                  <Send size={15} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

          {/* Actionable Error Banner */}
          {errorMessage && (
            <div style={{
              padding: '14px 16px',
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              borderRadius: 'var(--radius-md)',
              color: '#9F1239',
              fontSize: '0.86rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#E11D48' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Connection Notice:</strong>
                <p style={{ margin: 0, color: '#9F1239', lineHeight: 1.45 }}>{errorMessage}</p>
                {!isConnected && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '10px', background: '#FFFFFF' }}
                    onClick={handleStartDemoConversation}
                  >
                    <Play size={13} />
                    <span>Switch to Interactive Demo Mode</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
            {!isConnected ? (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {/* Live Button */}
                {isLiveConfigured ? (
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '13px' }}
                    onClick={handleStartLiveConversation}
                    id="btn-start-live-conv"
                  >
                    <Mic size={18} />
                    <span>Start ElevenLabs Live Call</span>
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, opacity: 0.75 }}
                    title="Configure valid ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in .env to unlock live calls"
                    onClick={() => alert("ElevenLabs credentials not configured or verified in .env. Click 'Start Demo Conversation' to test immediately with local voice, or update .env and restart.")}
                  >
                    <MicOff size={18} style={{ color: 'var(--text-muted)' }} />
                    <span>Live Call (Requires .env Key)</span>
                  </button>
                )}

                {/* Demo Conversation Button (Always works with back-and-forth interactivity!) */}
                <button
                  className="btn btn-outline-purple"
                  style={{ flex: 1, padding: '13px' }}
                  onClick={handleStartDemoConversation}
                  id="btn-start-demo-conv"
                >
                  <Play size={18} />
                  <span>Start Demo Conversation</span>
                </button>
              </div>
            ) : (
              <button
                className="btn btn-danger btn-lg"
                onClick={handleEndConversation}
                id="btn-end-conv"
              >
                <Square size={18} />
                <span>End Conversation & Save Transcript</span>
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>
                {sessionType === 'Interactive Demo Mode' && 'Interactive simulation with browser speech synthesis and local knowledge matching.'}
                {sessionType.includes('Live') && 'Live WebSockets connected to remote ElevenLabs Conversational AI agent.'}
                {!isConnected && 'Demo Mode is always available. ElevenLabs keys can be configured in Settings.'}
              </span>
              <Link to="/settings" style={{ fontSize: '0.78rem', fontWeight: 600 }}>API Settings →</Link>
            </div>
          </div>
        </div>

        {/* Right: Live Transcript Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>Conversation Transcript</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Full spoken dialogue turns with speaker timestamps
              </span>
            </div>
            <span className="badge badge-draft">
              {transcripts.length} message{transcripts.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Scrollable messages container */}
          <div className="transcript-box" style={{ flex: 1 }}>
            {transcripts.length > 0 ? (
              transcripts.map((item, idx) => (
                <div
                  key={idx}
                  className={`transcript-message ${item.speaker === 'agent' ? 'agent' : 'user'}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {item.speaker === 'agent' ? (
                        <>
                          <Bot size={13} style={{ color: 'var(--primary-brand)' }} />
                          <span>{selectedAgent?.name || 'Voice Assistant'}</span>
                        </>
                      ) : (
                        <>
                          <User size={13} />
                          <span>You (Caller)</span>
                        </>
                      )}
                    </div>

                    {/* Replay audio button for assistant messages */}
                    {item.speaker === 'agent' && (
                      <button
                        type="button"
                        className="btn-replay-inline"
                        onClick={() => handleReplayMessage(item.text)}
                        title="Replay Spoken Message"
                        aria-label="Replay audio"
                      >
                        <Volume2 size={12} />
                        <span>Replay</span>
                      </button>
                    )}
                  </div>

                  <div style={{ lineHeight: 1.5 }}>{item.text}</div>
                  <div className="transcript-meta">{item.timestamp}</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', margin: 'auto', padding: '30px 20px', color: 'var(--text-muted)' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--primary-brand)'
                }}>
                  <Mic size={26} />
                </div>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Ready to Start Conversation
                </h4>
                <p style={{ fontSize: '0.84rem', maxWidth: '340px', margin: '0 auto 18px', color: 'var(--text-secondary)' }}>
                  Click <strong>Start Demo Conversation</strong> for safe local testing or <strong>Start ElevenLabs Live Call</strong> if your keys are active.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.76rem', background: 'var(--bg-subtle)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                    Doctor appointment bookings
                  </span>
                  <span style={{ fontSize: '0.76rem', background: 'var(--bg-subtle)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                    Clinic opening timings
                  </span>
                  <span style={{ fontSize: '0.76rem', background: 'var(--bg-subtle)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
                    Hindi / English bilingual
                  </span>
                </div>
              </div>
            )}
            <div ref={transcriptBottomRef} />
          </div>
        </div>
      </div>

      {/* Natural-Language Refinement Section */}
      <div className="card" style={{ border: '1.5px solid var(--electric-lavender)', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--electric-lavender)',
            color: 'var(--primary-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={18} />
          </div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>How would you like to improve your agent?</h2>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Give natural-language feedback based on your conversation test. Our engine will adapt the agent's instructions, greetings, pacing, or guardrails.
        </p>

        {/* Suggestion Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {REFINEMENT_SUGGESTIONS.map((sug, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => {
                setRefinementPrompt(sug);
                handleApplyRefinement(sug);
              }}
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                background: refinementPrompt === sug ? 'var(--electric-lavender)' : '#FFFFFF',
                color: refinementPrompt === sug ? 'var(--primary-brand)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Make the greeting shorter and warmer, or ask one question at a time..."
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApplyRefinement();
            }}
            id="input-refinement-prompt"
          />
          <button
            className="btn btn-primary"
            onClick={() => handleApplyRefinement()}
            disabled={isRefining || !refinementPrompt.trim()}
            id="btn-apply-refinement"
          >
            <Sparkles size={16} />
            <span>{isRefining ? 'Refining...' : 'Apply Refinement'}</span>
          </button>
        </div>

        {/* Refinement Result Display */}
        {refinementResult && (
          <div style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '18px',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ color: '#1B7A4C' }} />
                <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Proposed Configuration Changes</span>
              </div>
              <span className="badge badge-draft">
                Local Draft — Remote Agent Unchanged
              </span>
            </div>

            <div style={{ marginBottom: '14px' }}>
              {(refinementResult.changes || []).map((ch, idx) => (
                <div key={idx} style={{ fontSize: '0.86rem', marginBottom: '8px', padding: '8px 12px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <strong>{ch.field}:</strong> {ch.reason}
                  {ch.to && <div style={{ fontSize: '0.82rem', color: 'var(--primary-brand)', marginTop: '4px' }}>New Value: "{ch.to}"</div>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {refinementSaved ? (
                <span style={{ color: '#1B7A4C', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> Changes Saved to Agent
                </span>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveRefinement}
                  id="btn-save-refinement"
                >
                  <Save size={15} />
                  <span>Save Refined Changes</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
