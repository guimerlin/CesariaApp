// components/management/StatusArea.jsx
import React from 'react';

const StatusArea = ({ message, type = 'info', isVisible = false }) => {
  if (!isVisible || !message) {
    return null;
  }

  const getStatusClasses = () => {
    const baseClasses = "px-4 py-3 rounded mb-4";
    
    switch (type) {
      case 'error':
        return `${baseClasses} bg-red-100 border border-red-400 text-red-700`;
      case 'success':
        return `${baseClasses} bg-green-100 border border-green-400 text-green-700`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 border border-yellow-400 text-yellow-700`;
      default:
        return `${baseClasses} bg-blue-100 border border-blue-400 text-blue-700`;
    }
  };

  return (
    <div className={getStatusClasses()}>
      <span>{message}</span>
    </div>
  );
};

export default StatusArea;

