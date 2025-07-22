import React from 'react';

const ResultsDisplay = ({ searchResults, selectedTable, isLoading }) => {
  /**
   * Função auxiliar para formatar datas.
   */
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
   * Exibe os resultados personalizados para a tabela DADOSPREVENDA com a lógica de soma corrigida.
   */
  const renderDadosPrevendaResults = (results, storeId) => {
    const filteredResults = results.filter((result) => result.TIPO === 'PRAZO');

    const fields = [
      'NOMECLIENTE',
      'VALORTOTAL',
      'DATA',
      'TIPO',
      'CANCELADA',
      'CONVENIO',
      'DOCUMENTOCLIENTE',
      'NUMEROCLIENTE',
    ];

    let totalPrazoCliente = 0;

    // =================================================================
    // INÍCIO DA LÓGICA DE PERÍODO CORRIGIDA
    // =================================================================
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth(); // 0 para Janeiro, 11 para Dezembro
    const diaAtual = hoje.getDate();

    let dataInicio;

    // Se hoje for dia 20 ou superior, o período começa no dia 20 deste mês.
    if (diaAtual >= 20) {
      dataInicio = new Date(anoAtual, mesAtual, 20, 0, 0, 0);
    }
    // Se hoje for antes do dia 20, o período começa no dia 20 do mês anterior.
    else {
      let anoInicio = anoAtual;
      let mesInicio = mesAtual - 1;

      // Se o mês atual é Janeiro (0), o anterior é Dezembro (11) do ano passado.
      if (mesInicio < 0) {
        mesInicio = 11; // Mês 11 é Dezembro em JavaScript
        anoInicio -= 1;
      }
      dataInicio = new Date(anoInicio, mesInicio, 20, 0, 0, 0);
    }
    // =================================================================
    // FIM DA LÓGICA DE PERÍODO CORRIGIDA
    // =================================================================

    // Calcular o total com base nas regras
    filteredResults.forEach((result) => {
      const cancelada = String(result.CANCELADA || '').trim();
      const dataVenda = result.DATA ? new Date(result.DATA) : null;

      if (
        cancelada !== 'Y' &&
        dataVenda &&
        !isNaN(dataVenda.getTime()) &&
        dataVenda >= dataInicio // A soma é feita para todas as vendas a partir da data de início
      ) {
        const valorTotal = Number(result.VALORTOTAL) || 0;
        totalPrazoCliente += valorTotal;
      }
    });

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

        {filteredResults.length > 0 ? (
          filteredResults.map((result, index) => {
            return (
              <div
                key={index}
                className="grid min-w-full items-center gap-4 border-b p-3 hover:bg-gray-50"
                style={{
                  gridTemplateColumns: `repeat(${fields.length}, minmax(150px, 1fr))`,
                }}
              >
                {fields.map((field) => {
                  let displayValue = result[field] ?? 'N/A';

                  if (field === 'DATA') {
                    displayValue = formatDate(result[field]);
                  } else if (
                    field === 'NUMEROCLIENTE' &&
                    result[field] != null
                  ) {
                    displayValue = Number(result[field]).toLocaleString(
                      'pt-BR',
                    );
                  } else if (field === 'VALORTOTAL' && result[field] != null) {
                    displayValue = Number(result[field]).toLocaleString(
                      'pt-BR',
                      {
                        style: 'currency',
                        currency: 'BRL',
                      },
                    );
                  } else if (field === 'CANCELADA' && result[field]) {
                    displayValue = String(result[field]).trim();
                  }

                  return (
                    <div
                      key={field}
                      className="text-sm"
                      title={String(result[field] || '')}
                    >
                      {displayValue}
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : (
          <p className="p-4 text-center text-gray-500">
            Nenhum resultado de PRAZO encontrado nesta loja.
          </p>
        )}

        {filteredResults.length > 0 && (
          <div
            className="mt-2 grid min-w-full items-center gap-4 border-t-2 border-gray-300 bg-gray-100 p-3 font-bold"
            style={{
              gridTemplateColumns: `repeat(${fields.length}, minmax(150px, 1fr))`,
            }}
          >
            <div
              className="text-right text-sm font-bold"
              style={{ gridColumn: `1 / span ${fields.length - 1}` }}
            >
              Total a Prazo (a partir de {formatDate(dataInicio)}):
            </div>
            <div className="text-sm font-bold text-green-700">
              {totalPrazoCliente.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  /**
   * Exibe os resultados genéricos para outras tabelas
   */
  const renderGenericResults = (results, storeId) => {
    if (!results || results.length === 0) {
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

    const firstResult = results[0];
    let fields = Object.keys(firstResult).filter((key) => key !== 'storeId');

    const nameIndex = fields.indexOf('NOME');
    if (nameIndex > 0) {
      const nameField = fields.splice(nameIndex, 1)[0];
      fields.unshift(nameField);
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

        {results.map((result, index) => (
          <div
            key={index}
            className="grid min-w-full items-center gap-4 border-b p-3 hover:bg-gray-50"
            style={{
              gridTemplateColumns: `repeat(${fields.length}, minmax(150px, 1fr))`,
            }}
          >
            {fields.map((field) => (
              <div
                key={field}
                className="text-sm"
                title={String(result[field] || '')}
              >
                {result[field] || 'N/A'}
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
          if (selectedTable === 'DADOSPREVENDA') {
            return renderDadosPrevendaResults(results, storeId);
          } else {
            return renderGenericResults(results, storeId);
          }
        })}
      </div>
    </div>
  );
};

export default ResultsDisplay;
