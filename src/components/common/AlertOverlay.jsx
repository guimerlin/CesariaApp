import React from 'react';
import { Button } from '../ui/button';

const AlertOverlay = ({ isVisible, alertMessage, onStopAlert }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-red-700 bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center animate-pulse border-4 border-red-600">
        <span className="text-4xl font-bold text-red-700 mb-4">🚨 ALERTA URGENTE!</span>
        <span className="text-lg text-red-700 font-semibold mb-4">{alertMessage}</span>
        <Button
          onClick={onStopAlert}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-bold transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          OK
        </Button>
      </div>
    </div>
  );
};

export default AlertOverlay;

