import React from 'react';

export default function StatusBadge({ status, isSample, isLive, type }) {
  if (isSample) {
    return <span className="badge badge-sample">Sample Data</span>;
  }

  if (type?.toLowerCase().includes('live') || isLive) {
    return <span className="badge badge-live">Live Call</span>;
  }

  if (type?.toLowerCase().includes('demo')) {
    return <span className="badge badge-draft">Demo Session</span>;
  }

  switch (status?.toLowerCase()) {
    case 'deployed':
      return <span className="badge badge-deployed">● Deployed</span>;
    case 'ready to test':
      return <span className="badge badge-ready">● Ready to Test</span>;
    case 'draft':
    default:
      return <span className="badge badge-draft">○ Draft</span>;
  }
}
