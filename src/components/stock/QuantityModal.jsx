// components/stock/QuantityModal.jsx
import React, { useState, useEffect } from 'react';

const QuantityModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productInfo 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset quantity when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (quantity <= 0 || isNaN(quantity)) {
      alert('Quantidade inválida.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onConfirm(productInfo, quantity);
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar solicitação:', error);
      alert('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isSubmitting) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isSubmitting]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-80 max-w-sm mx-4">
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-bold mb-4 text-gray-900">
            Solicitar produto
          </h2>
          
          {productInfo && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Produto:</p>
              <p className="font-medium text-gray-900 text-sm">
                {productInfo.PRODUTO || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Código: {productInfo.CODIGO || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                Estoque disponível: {productInfo.ESTOQUEATUAL || 'N/A'}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label 
              htmlFor="quantityInput" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Quantidade:
            </label>
            <input
              id="quantityInput"
              type="number"
              min="1"
              max={productInfo?.ESTOQUEATUAL || 999}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || quantity <= 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Enviando...' : 'Solicitar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuantityModal;

