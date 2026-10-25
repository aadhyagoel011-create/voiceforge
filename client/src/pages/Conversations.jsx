import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Filter, Eye, Clock, Calendar, Bot, Volume2, Square } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState(null);
  const [replayingText, setReplayingText] = useState(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await api.getConversations();
      if (res.success) {
        setConversations(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (replayingText === text) {
      window.speechSynthesis.cancel();
      setReplayingText(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setReplayingText(null);
    utterance.onerror = () => setReplayingText(null);
    setReplayingText(text);
    window.speechSynthesis.speak(utterance);
  };

  const filteredConversations = conversations.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (c.agentName && c.agentName.toLowerCase().includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.transcript && c.transcript.some(t => t.text && t.text.toLowerCase().includes(q)));

    if (!matchesSearch) return false;

    if (typeFilter === 'ALL') return true;
    if (typeFilter === 'LIVE') return c.type && c.type.toLowerCase().includes('live');
    if (typeFilter === 'DEMO') return c.isSample || (c.type && c.type.toLowerCase().includes('demo'));
    return true;
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Conversation Sessions</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Review recorded voice conversations, transcript logs, and call metadata.
        </p>
      </div>

      {/* Filter and Search Card */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search conversations by agent name, transcript keywords, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Session Types ({conversations.length})</option>
              <option value="LIVE">Live ElevenLabs Calls</option>
              <option value="DEMO">Demo Mode & Samples</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table or List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Loading conversation history...
        </div>
      ) : filteredConversations.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Agent Name</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Type / Classification</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Start Time</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Duration</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Transcript Preview</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredConversations.map((conv) => {
                  const firstMessage = conv.transcript?.[0]?.text || 'No transcript available';
                  const dateStr = conv.startTime ? new Date(conv.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Unknown';

                  return (
                    <tr
                      key={conv.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Bot size={16} style={{ color: 'var(--primary)' }} />
                          <span>{conv.agentName}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{conv.id}</span>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <StatusBadge type={conv.type} isSample={conv.isSample} />
                      </td>

                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                        {dateStr}
                      </td>

                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                        {conv.duration || '0m 00s'}
                      </td>

                      <td style={{ padding: '14px 18px', maxWidth: '320px' }}>
                        <p style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          margin: 0
                        }}>
                          "{firstMessage}"
                        </p>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {conv.transcript?.length || 0} turn{(conv.transcript?.length || 0) === 1 ? '' : 's'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setSelectedSession(conv)}
                        >
                          <Eye size={14} />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <MessageSquare size={48} style={{ color: 'var(--secondary)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No conversation sessions found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Try adjusting your search query or start a voice conversation in the Playground.
          </p>
        </div>
      )}

      {/* Session Details Modal */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => {
          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
          setReplayingText(null);
          setSelectedSession(null);
        }}
        title={selectedSession ? `Session: ${selectedSession.agentName}` : 'Session'}
      >
        {selectedSession && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', background: 'var(--bg-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Classification</span>
                <StatusBadge type={selectedSession.type} isSample={selectedSession.isSample} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Duration</span>
                <span style={{ fontWeight: 600 }}>{selectedSession.duration || '0m 00s'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block' }}>Date</span>
                <span style={{ fontWeight: 600 }}>{new Date(selectedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', marginBottom: '10px' }}>Complete Transcript:</h4>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              maxHeight: '360px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {(selectedSession.transcript || []).map((t, idx) => (
                <div
                  key={idx}
                  className={`transcript-message ${t.speaker === 'agent' ? 'agent' : 'user'}`}
                  style={{ maxWidth: '85%' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.75rem', opacity: 0.85 }}>
                      {t.speaker === 'agent' ? selectedSession.agentName : 'Caller'}
                    </span>
                    <button
                      className="btn-replay"
                      onClick={() => handleReplay(t.text)}
                      title="Replay message audio"
                      style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                    >
                      {replayingText === t.text ? <Square size={10} /> : <Volume2 size={11} />}
                      <span>{replayingText === t.text ? 'Stop' : 'Listen'}</span>
                    </button>
                  </div>
                  <div>{t.text}</div>
                  <div className="transcript-meta">{t.timestamp}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setReplayingText(null);
                  setSelectedSession(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
