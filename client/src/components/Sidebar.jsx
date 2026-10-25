import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  PlusCircle,
  Mic,
  MessageSquare,
  Rocket,
  Settings,
  CheckCircle2,
  Radio
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, integrationStatus }) {
  const navigate = useNavigate();

  const handleCreateAgentClick = () => {
    navigate('/agents/new');
    if (onClose) onClose();
  };

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/agents', label: 'My Agents', icon: Bot },
    { to: '/agents/new', label: 'Create Agent', icon: PlusCircle },
    { to: '/playground', label: 'Voice Playground', icon: Mic },
    { to: '/conversations', label: 'Conversations', icon: MessageSquare },
    { to: '/deploy', label: 'Deployment', icon: Rocket },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const isLive = integrationStatus?.elevenLabsLiveAvailable;

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Distinctive Brand Header with Waveform Logo */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="10" width="3" height="4" rx="1.5" fill="#FFFFFF" fillOpacity="0.8" />
            <rect x="7" y="6" width="3" height="12" rx="1.5" fill="#FFFFFF" />
            <rect x="12" y="3" width="3" height="18" rx="1.5" fill="#FF765F" />
            <rect x="17" y="7" width="3" height="10" rx="1.5" fill="#FFFFFF" />
            <rect x="22" y="10" width="2" height="4" rx="1" fill="#FFFFFF" fillOpacity="0.8" />
          </svg>
        </div>
        <div className="brand-text">
          <h1>VoiceForge</h1>
          <span>AI Voice Studio</span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="sidebar-cta">
        <button
          className="btn-create-agent-sidebar"
          onClick={handleCreateAgentClick}
          id="sidebar-create-btn"
        >
          <PlusCircle size={18} />
          <span>Create Agent</span>
        </button>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer with Live / Demo Mode indicator */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>
            SESSION ENGINE
          </span>
          <span className={`mode-badge ${isLive ? 'live' : 'demo'}`}>
            {isLive ? <Radio size={12} className="pulse" /> : <CheckCircle2 size={12} />}
            {isLive ? 'Live Call Ready' : 'Demo Mode Active'}
          </span>
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>
          {isLive ? 'ElevenLabs credentials loaded' : 'Local speech synthesis active'}
        </p>
      </div>
    </aside>
  );
}
