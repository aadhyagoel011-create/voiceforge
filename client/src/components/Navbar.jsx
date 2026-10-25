import React from 'react';
import { Menu, Mic } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ onMenuToggle, integrationStatus }) {
  const location = useLocation();

  const getPageTitle = (path) => {
    if (path === '/') return 'Overview';
    if (path.startsWith('/agents/new')) return 'Create Voice Agent';
    if (path.startsWith('/agents/') && path.length > 8) return 'Agent Configuration';
    if (path.startsWith('/agents')) return 'My Agents';
    if (path.startsWith('/playground')) return 'Voice Playground';
    if (path.startsWith('/conversations')) return 'Conversation History';
    if (path.startsWith('/deploy')) return 'Deployment Readiness';
    if (path.startsWith('/settings')) return 'Settings & Integration';
    return 'VoiceForge';
  };

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          className="mobile-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>{getPageTitle(location.pathname)}</h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            AI Voice Agent Studio & Interactive Testing Workspace
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/playground" className="btn btn-secondary btn-sm" id="nav-test-playground">
          <Mic size={15} style={{ color: 'var(--primary-brand)' }} />
          <span>Talk to Agent</span>
        </Link>
      </div>
    </header>
  );
}
