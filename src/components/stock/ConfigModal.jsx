// components/stock/ConfigModal.jsx
import React, { useState, useEffect } from 'react';
import { validateFirebirdConfig } from '../../utils/firebirdConfig.jsx';

const ConfigModal = ({
  isOpen,
  onClose,
  onSave,
  config,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    host: '192.168.18.28',
    port: '3050',
    database: '/var/lib/firebird/3.0/data/Pharmagno_RESTAURADO.fdb',
    user: 'SYSDBA',
    password: 'gui',
    charset: 'UTF8',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualiza o formulário quando a configuração muda
  useEffect(() => {
    if (config && isOpen) {
      setFormData(config);
      setErrors({});
    }
  }, [config, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Remove erro do campo quando o usuário começa a digitar
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valida a configuração
    const validation = validateFirebirdConfig(formData);
    if (!validation.isValid) {
      const newErrors = {};
      validation.missingFields.forEach((field) => {
        newErrors[field] = 'Este campo é obrigatório';
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      setErrors({});
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

  const inputFields = [
    {
      key: 'host',
      label: 'Endereço do servidor',
      type: 'text',
      placeholder: 'localhost',
    },
    { key: 'port', label: 'Porta', type: 'number', placeholder: '3050' },
    {
      key: 'database',
      label: 'Database (caminho)',
      type: 'text',
      placeholder: 'C:\\caminho\\para\\banco.fdb',
    },
    { key: 'user', label: 'Usuário', type: 'text', placeholder: 'SYSDBA' },
    {
      key: 'password',
      label: 'Senha',
      type: 'password',
      placeholder: 'masterkey',
    },
    { key: 'charset', label: 'Charset', type: 'text', placeholder: 'UTF8' },
  ];

  return (
    <div
      className="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black"
      onClick={handleBackdropClick}
    >
      <div className="mx-4 max-h-[90vh] w-96 max-w-sm overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <form onSubmit={handleSubmit}>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Configuração do Firebird
          </h2>

          <div className="mb-6 space-y-4">
            {inputFields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label
                  htmlFor={key}
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  {label}:
                </label>
                <input
                  id={key}
                  type={type}
                  value={formData[key] || ''}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  placeholder={placeholder}
                  className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                    errors[key] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting || isLoading}
                />
                {errors[key] && (
                  <p className="mt-1 text-xs text-red-500">{errors[key]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting || isLoading}
              className="rounded-lg bg-gray-300 px-4 py-2 text-gray-700 transition-colors duration-200 hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {(isSubmitting || isLoading) && (
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigModal;
