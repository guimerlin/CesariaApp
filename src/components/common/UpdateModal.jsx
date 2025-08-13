import React from 'react';

const UpdateModal = ({ show, status, onRestart, onLater }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Atualização de Software</h2>
        {status === 'downloading' && <p className="text-gray-600">Baixando atualização...</p>}
        {(status === 'downloaded' || status === 'pending') && (
          <>
            <p className="text-gray-600 mb-4">Atualização pronta para instalar.</p>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={onLater}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Depois
              </button>
              <button 
                onClick={onRestart}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reiniciar e Instalar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UpdateModal;
