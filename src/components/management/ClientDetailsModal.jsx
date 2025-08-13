// components/management/ClientDetailsModal.jsx
import React, { useState } from 'react';

const ClientDetailsModal = ({
  isVisible,
  onClose,
  clientData,
  clientDetails,
  isLoadingDetails,
}) => {
  const [showPurchaseTable, setShowPurchaseTable] = useState(false);

  // Proteção: sempre garantir que clientDetails é um objeto
  const safeClientDetails = clientDetails || {};
  console.log('ClientDetailsModal - clientDetails:', safeClientDetails);

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

  /**
   * Renderiza a tabela de compras do cliente no formato planilha
   */
  const renderPurchaseTable = () => {
    if (!safeClientDetails || Object.keys(safeClientDetails).length === 0) {
      return (
        <div className="py-4 text-center">
          <p className="text-gray-500">
            Nenhuma compra encontrada para este cliente.
          </p>
        </div>
      );
    }

    const fields = ['Vencimento', 'Descrição', 'Valor', 'Multa', 'Valor Restante'];

    return (
      <div className="mt-6">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">
          Extrato de Compras
        </h3>

        {Object.entries(safeClientDetails).map(([storeId, results]) => {
          if (results.length === 0) {
            return (
              <div key={storeId} className="mb-6">
                <div className="mb-3 text-lg font-bold text-blue-700">
                  Loja: {storeId}
                </div>
                <p className="text-center text-gray-500">
                  Nenhum resultado de PRAZO encontrado nesta loja.
                </p>
              </div>
            );
          }

          const salesData = results[0]?.VENDAS ? JSON.parse(results[0].VENDAS) : {};
          const sales = Object.entries(salesData);

          return (
            <div
              key={storeId}
              className="mb-8 overflow-hidden rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h4 className="text-lg font-bold text-gray-700">
                  Loja: {storeId}
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      {fields.map((field) => (
                        <th
                          key={field}
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {sales.map(([saleId, saleDetails]) => (
                      <React.Fragment key={saleId}>
                        <tr className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {formatDate(saleDetails.vencimento)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {saleDetails.descricao}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {formatCurrency(saleDetails.valor)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-red-600">
                            {formatCurrency(saleDetails.multa)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                            {formatCurrency(saleDetails.valor_restante)}
                          </td>
                        </tr>
                        {saleDetails.itens && saleDetails.itens.length > 0 && (
                          <tr>
                            <td colSpan={fields.length} className="p-0">
                              <div className="bg-gray-50 px-6 py-4">
                                <h4 className="mb-2 text-sm font-semibold text-gray-700">
                                  Itens da Compra
                                </h4>
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-200">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                                        Produto
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                                        Código
                                      </th>
                                      <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                                        Valor
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 bg-white">
                                    {saleDetails.itens.map((item, index) => (
                                      <tr key={index}>
                                        <td className="px-4 py-2 text-sm text-gray-800">
                                          {item.produto}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-800">
                                          {item.codigo}
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm text-gray-800">
                                          {formatCurrency(item.valor_total)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                  {results.length > 0 && (
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td
                          colSpan={fields.length - 1}
                          className="px-6 py-3 text-right text-sm font-bold text-gray-700"
                        >
                          Total Gasto na Loja:
                        </td>
                        <td className="px-6 py-3 text-left text-sm font-bold text-green-700">
                          {formatCurrency(results[0].TOTALGASTO)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
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
              {safeClientDetails && Object.keys(safeClientDetails).length > 0 ? (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-800">
                      Detalhes por Loja
                    </h3>
                    <button
                      onClick={() => setShowPurchaseTable(!showPurchaseTable)}
                      className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
                    >
                      {showPurchaseTable
                        ? 'Ocultar Tabela de Compras'
                        : 'Mostrar Tabela de Compras'}
                    </button>
                  </div>

                  {!showPurchaseTable ? (
                    <div className="space-y-4">
                      {Object.entries(safeClientDetails).map(
                        ([storeId, details]) => {
                          const primeiroRegistro = details[0] || {};

                          return (
                            <div
                              key={storeId}
                              className="rounded-lg border p-4"
                            >
                              <h4 className="mb-3 font-medium text-blue-700">
                                Loja: {storeId}
                              </h4>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-600">
                                    Nome do Cliente:
                                  </label>
                                  <p className="text-gray-800">
                                    {primeiroRegistro.NOME || 'N/A'}
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
                                    {primeiroRegistro.DOCUMENTO || primeiroRegistro.CIC || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-600">
                                    Utilizado:
                                  </label>
                                  <p className="font-medium text-gray-800">
                                    {formatCurrency(primeiroRegistro.TOTALGASTO)}
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-600">
                                    Disponivel:
                                  </label>
                                  <p className="text-gray-800">
                                    {formatCurrency(primeiroRegistro.DISPONIVEL)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    renderPurchaseTable()
                  )}
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
