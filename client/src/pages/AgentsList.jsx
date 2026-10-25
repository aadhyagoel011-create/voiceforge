import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, PlusCircle, Search, Filter, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import AgentCard from '../components/AgentCard';
import Modal from '../components/Modal';

export default function AgentsList() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('updated');

  // Delete modal state
  const [agentToDelete, setAgentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const res = await api.getAgents();
      if (res.success) {
        setAgents(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (agentId) => {
    try {
      const res = await api.duplicateAgent(agentId);
      if (res.success) {
        setToastMessage(`Agent duplicated as "${res.data.name}"`);
        setTimeout(() => setToastMessage(''), 4000);
        await loadAgents();
      }
    } catch (err) {
      alert(`Duplication failed: ${err.message}`);
    }
  };

  const confirmDelete = async () => {
    if (!agentToDelete) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteAgent(agentToDelete.id);
      if (res.success) {
        setToastMessage(`Agent "${agentToDelete.name}" deleted.`);
        setTimeout(() => setToastMessage(''), 4000);
        setAgentToDelete(null);
        await loadAgents();
      }
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Sort
  const filteredAgents = agents
    .filter(a => {
      const matchesSearch = 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.primaryLanguage && a.primaryLanguage.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'READY') return a.status === 'Ready to Test';
      if (statusFilter === 'DRAFT') return a.status === 'Draft';
      if (statusFilter === 'DEPLOYED') return a.status === 'Deployed' || a.isRemoteDeployed;
      if (statusFilter === 'SAMPLE') return !!a.isSample;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          background: 'var(--primary)',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          fontWeight: 600,
          fontSize: '0.88rem'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Header and Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>My Voice Agents</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Manage, configure, and inspect voice agents stored in your VoiceForge workspace.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/agents/new')}
          id="btn-new-agent"
        >
          <PlusCircle size={18} />
          <span>Create New Agent</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by agent name, language, or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses ({agents.length})</option>
              <option value="READY">Ready to Test</option>
              <option value="DRAFT">Draft</option>
              <option value="DEPLOYED">Deployed</option>
              <option value="SAMPLE">Sample Demo Data</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updated">Sort: Last Updated</option>
              <option value="name">Sort: Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          Loading your voice agents...
        </div>
      ) : filteredAgents.length > 0 ? (
        <div className="agent-grid">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onDuplicate={handleDuplicate}
              onDelete={(ag) => setAgentToDelete(ag)}
            />
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Bot size={48} style={{ color: 'var(--secondary)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No matching agents found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your search criteria or resetting the filters.'
              : 'Get started by creating your first voice assistant from a natural language prompt.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/agents/new')}>
            <PlusCircle size={17} />
            <span>Create Agent</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!agentToDelete}
        onClose={() => setAgentToDelete(null)}
        title="Confirm Delete Agent"
      >
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
          Are you sure you want to permanently delete <strong>{agentToDelete?.name}</strong>? This action will remove its local configuration and FAQs.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setAgentToDelete(null)}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={confirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete Agent'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
