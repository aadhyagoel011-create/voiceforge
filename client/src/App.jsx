import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Overview from './pages/Overview';
import AgentsList from './pages/AgentsList';
import CreateAgent from './pages/CreateAgent';
import AgentDetail from './pages/AgentDetail';
import Playground from './pages/Playground';
import Conversations from './pages/Conversations';
import Deploy from './pages/Deploy';
import Settings from './pages/Settings';
import { api } from './services/api';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await api.getElevenLabsStatus();
        if (res.success) {
          setIntegrationStatus(res.data);
        }
      } catch (err) {
        console.warn("Could not check integration status:", err.message);
      }
    }
    checkStatus();
  }, []);

  return (
    <div className="app-container">
      {/* Persistent Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        integrationStatus={integrationStatus}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Navbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          integrationStatus={integrationStatus}
        />

        <main className="page-content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/agents" element={<AgentsList />} />
            <Route path="/agents/new" element={<CreateAgent />} />
            <Route path="/agents/:id" element={<AgentDetail />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/deploy" element={<Deploy />} />
            <Route path="/deploy/:id" element={<Deploy />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
