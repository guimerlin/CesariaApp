import React from 'react';

const ResultsDisplay = ({
  searchResults,
  selectedTable,
  isLoading,
  onClientClick,
}) => {
  /**
   * Exibe os resultados da consulta customizada (DADOSPREVENDA)
   */
  const renderGenericResults = (results, storeId) => {
    // Mostra qualquer resultado que tenha pelo menos um dos campos principais
    const fields = [
      'NOMECLIENTE',
      'MATRICULA',
      'BLOQUEIO',
      'TOTALGASTO',
      'LIMITE',
      'DISPONIVEL',
    ];
    const filteredResults = results.filter((result) =>
      fields.some((field) => result[field] !== undefined && result[field] !== null)
    );

    if (!filteredResults || filteredResults.length === 0) {
      return (
        <div key={storeId} className="mb-6">
          <div className="mt-4 mb-3 text-lg font-bold text-blue-700 first:mt-0">
            Loja: {storeId}
          </div>
          <p className="text-center text-gray-500">
            Nenhum resultado encontrado nesta loja.
          </p>
        </div>
      );
    }

    return (
      <div key={storeId} className="mb-6">
        <div className="mt-4 mb-3 text-lg font-bold text-blue-700 first:mt-0">
          Loja: {storeId}
        </div>
        <div
          className="grid min-w-full items-center gap-4 border-b bg-gray-100 p-3 font-bold"
          style={{
            gridTemplateColumns: `repeat(${fields.length}, minmax(150px, 1fr))`,
          }}
        >
          {fields.map((field) => (
            <div key={field} className="text-sm font-bold" title={field}>
              {field}
            </div>
          ))}
        </div>
        {filteredResults.map((result, index) => (
          <div
            key={index}
            className="grid min-w-full items-center gap-4 border-b p-3 hover:bg-blue-50"
            style={{
              gridTemplateColumns: `repeat(${fields.length}, minmax(150px, 1fr))`,
            }}
            title={'Clique para ver detalhes do cliente'}
            onClick={() => onClientClick(result, storeId)}
          >
            {fields.map((field) => (
              <div
                key={field}
                className="text-sm"
                title={String(result[field] ?? 'N/A')}
              >
                {result[field] ?? 'N/A'}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white shadow-md">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Resultados da Pesquisa
          </h2>
        </div>
        <div className="max-h-[calc(100vh-300px)] overflow-x-auto overflow-y-auto p-6">
          <p className="text-center text-gray-500">Buscando...</p>
        </div>
      </div>
    );
  }

  if (!searchResults || Object.keys(searchResults).length === 0) {
    return (
      <div className="rounded-lg bg-white shadow-md">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Resultados da Pesquisa
          </h2>
        </div>
        <div className="max-h-[calc(100vh-300px)] overflow-x-auto overflow-y-auto p-6">
          <p className="text-center text-gray-500">
            Nenhuma pesquisa realizada ainda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white shadow-md">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Resultados da Pesquisa
        </h2>
      </div>
      <div className="scrollbar-thin max-h-[calc(100vh-300px)] overflow-x-auto overflow-y-auto p-6">
        {Object.entries(searchResults).map(([storeId, results]) => {
          // Apenas renderiza resultados se a tabela selecionada for 'CLIENTES'
          if (selectedTable === 'CLIENTES') {
            return renderGenericResults(results, storeId);
          } else {
            // Se não for 'CLIENTES', não renderiza nada ou exibe uma mensagem apropriada
            return (
              <div key={storeId} className="mb-6">
                <div className="mt-4 mb-3 text-lg font-bold text-blue-700 first:mt-0">
                  Loja: {storeId}
                </div>
                <p className="text-center text-gray-500">
                  Este componente exibe apenas dados de CLIENTES.
                </p>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

export default ResultsDisplay;
