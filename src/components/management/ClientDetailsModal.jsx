// components/management/ClientDetailsModal.jsx
import React from 'react';

const ClientDetailsModal = ({
  isVisible,
  onClose,
  clientData,
  clientDetails,
  isLoadingDetails,
}) => {
  if (!isVisible) return null;

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';

    if (dateValue instanceof Date && !isNaN(dateValue)) {
      return dateValue.toLocaleDateString('pt-BR');
    }

    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    }

    return 'Data Inválida';
  };

  const calculateUtilizado = (results) => {
    if (!results || results.length === 0) return 0;

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();

    let dataInicio;
    if (diaAtual >= 20) {
      dataInicio = new Date(anoAtual, mesAtual, 20, 0, 0, 0);
    } else {
      let anoInicio = anoAtual;
      let mesInicio = mesAtual - 1;
      if (mesInicio < 0) {
        mesInicio = 11;
        anoInicio -= 1;
      }
      dataInicio = new Date(anoInicio, mesInicio, 20, 0, 0, 0);
    }

    let total = 0;
    results.forEach((result) => {
      const cancelada = String(result.CANCELADA || '').trim();
      const dataVenda = result.DATA ? new Date(result.DATA) : null;
      const tipo = String(result.TIPO || '').trim();

      if (
        cancelada !== 'Y' &&
        tipo === 'PRAZO' &&
        dataVenda &&
        !isNaN(dataVenda.getTime()) &&
        dataVenda >= dataInicio
      ) {
        const valorTotal = Number(result.VALORTOTAL) || 0;
        total += valorTotal;
      }
    });

    return total;
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Detalhes do Cliente
            </h2>
            <button
              onClick={onClose}
              className="text-2xl font-bold text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoadingDetails ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">Carregando detalhes do cliente...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informações básicas do cliente */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-3 text-lg font-medium text-gray-800">
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Nome do Cliente:
                    </label>
                    <p className="font-medium text-gray-800">
                      {clientData?.NOME || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Matrícula:
                    </label>
                    <p className="font-medium text-gray-800">
                      {clientData?.MATRICULA || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Bloqueado:
                    </label>
                    <p
                      className={`font-medium ${
                        clientData?.BLOQUEADO === 'Y'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {clientData?.BLOQUEADO === 'Y' ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Limite:
                    </label>
                    <p className="font-medium text-gray-800">
                      {formatCurrency(clientData?.LIMITE)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Loja:
                    </label>
                    <p className="font-medium text-gray-800">
                      {clientData?.storeId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalhes por loja */}
              {clientDetails && Object.keys(clientDetails).length > 0 ? (
                <div>
                  <h3 className="mb-3 text-lg font-medium text-gray-800">
                    Detalhes por Loja
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(clientDetails).map(([storeId, details]) => {
                      const utilizadoTotal = calculateUtilizado(details);
                      const primeiroRegistro = details[0] || {};

                      return (
                        <div key={storeId} className="rounded-lg border p-4">
                          <h4 className="mb-3 font-medium text-blue-700">
                            Loja: {storeId}
                          </h4>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-600">
                                Nome do Cliente:
                              </label>
                              <p className="text-gray-800">
                                {primeiroRegistro.NOMECLIENTE || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600">
                                Convênio:
                              </label>
                              <p className="text-gray-800">
                                {primeiroRegistro.CONVENIO || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600">
                                Documento do Cliente:
                              </label>
                              <p className="text-gray-800">
                                {primeiroRegistro.DOCUMENTOCLIENTE || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600">
                                Utilizado:
                              </label>
                              <p className="font-medium text-gray-800">
                                {formatCurrency(utilizadoTotal)}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600">
                                Total de Registros:
                              </label>
                              <p className="text-gray-800">{details.length}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-gray-500">
                    Nenhum detalhe adicional encontrado para este cliente.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-md bg-gray-500 px-6 py-2 text-white transition-colors hover:bg-gray-600"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsModal;
