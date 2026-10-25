import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Edit3, Copy, Trash2, Globe, Volume2, Calendar, MoreVertical } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function AgentCard({ agent, onDuplicate, onDelete }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const formattedDate = agent.updatedAt 
    ? new Date(agent.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';

  // Clean voice name (strip any residual parenthetical provider strings)
  const cleanVoiceName = agent.voice?.name?.replace(/\s*\([^)]*\)/g, '').trim() || 'Rachel';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header with Title, Badge, and Action dropdown */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '1.08rem', margin: 0, fontWeight: 700 }}>{agent.name}</h3>
            {agent.isSample && <span className="badge badge-sample">Sample Data</span>}
          </div>
          <StatusBadge status={agent.status} />
        </div>

        {/* More actions menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '6px',
              borderRadius: '6px'
            }}
            title="Agent Actions"
            aria-label="Agent options"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                background: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-md)',
                minWidth: '140px',
                zIndex: 20,
                padding: '4px'
              }}
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDuplicate(agent.id);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  border: 'none',
                  background: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
                className="hover-subtle"
              >
                <Copy size={15} />
                <span>Duplicate</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(agent);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  border: 'none',
                  background: 'none',
                  color: '#E11D48',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
                className="hover-subtle"
              >
                <Trash2 size={15} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Purpose / Description */}
      <p style={{
        fontSize: '0.88rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.48,
        marginBottom: '16px',
        flex: 1,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {agent.purpose}
      </p>

      {/* Meta Specs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        fontSize: '0.8rem',
        padding: '10px 12px',
        background: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '16px',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <Globe size={14} style={{ color: 'var(--primary-brand)' }} />
          <span>{agent.primaryLanguage || 'English'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <Volume2 size={14} style={{ color: 'var(--secondary-purple)' }} />
          <span>Voice: {cleanVoiceName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', gridColumn: 'span 2' }}>
          <Calendar size={13} />
          <span>Updated {formattedDate}</span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="btn btn-outline-purple btn-sm"
          style={{ flex: 1 }}
          onClick={() => navigate(`/playground?agentId=${agent.id}`)}
          id={`btn-test-agent-${agent.id}`}
        >
          <Mic size={14} />
          <span>Talk to Agent</span>
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
          onClick={() => navigate(`/agents/${agent.id}`)}
        >
          <Edit3 size={14} />
          <span>Configure</span>
        </button>
      </div>
    </div>
  );
}
