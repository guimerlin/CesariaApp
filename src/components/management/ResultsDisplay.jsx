// components/management/ResultsDisplay.jsx
import React from 'react';

const ResultsDisplay = ({ searchResults, selectedTable, isLoading }) => {
  /**
   * Função auxiliar para formatar datas baseada nos dados reais do Firebird
   */
  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';

    // Se já for um objeto Date (como vem do Firebird), formata diretamente
    if (dateValue instanceof Date && !isNaN(dateValue)) {
      return dateValue.toLocaleDateString('pt-BR');
    }

    // Se for uma string, tenta fazer o parse
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    }

    return 'Data Inválida';
  };

  /**
   * Exibe os resultados personalizados para a tabela DADOSPREVENDA
   */
  const renderDadosPrevendaResults = (results, storeId) => {
    // Filtrar resultados para mostrar apenas TIPO === 'PRAZO'
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
      'VALORENTRADA',
    ];

    let totalPrazoCliente = 0;

    // Lógica de data para o cálculo do total
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth(); // 0-11 (Janeiro é 0)

    // Data de Fim: dia 20 do mês atual, às 00:00:00
    const dataFim = new Date(anoAtual, mesAtual, 20, 0, 0, 0);

    // Data de Início: dia 20 do mês ANTERIOR, às 00:00:00
    let anoInicio = anoAtual;
    let mesInicio = mesAtual - 1;

    if (mesInicio < 0) {
      mesInicio = 11;
      anoInicio -= 1;
    }
    const dataInicio = new Date(anoInicio, mesInicio, 20, 0, 0, 0);

    // Calcular o total antes de renderizar
    filteredResults.forEach((result) => {
      // CANCELADA vem com espaços extras do Firebird, então fazemos trim()
      const cancelada = String(result.CANCELADA || '').trim();

      if (
        cancelada !== 'Y' &&
        result.DATA &&
        result.DATA instanceof Date &&
        !isNaN(result.DATA.getTime())
      ) {
        const dataVenda = result.DATA;

        // Comparar se a data da venda está no intervalo desejado
        if (dataVenda >= dataInicio && dataVenda < dataFim) {
          // VALORTOTAL já vem como número do Firebird
          const valorTotal = Number(result.VALORTOTAL) || 0;
          totalPrazoCliente += valorTotal;
        }
      }
    });

    return (
      <div key={storeId} className="mb-6">
        {/* Cabeçalho da loja */}
        <div className="mt-4 mb-3 text-lg font-bold text-blue-700 first:mt-0">
          Loja: {storeId}
        </div>

        {/* Cabeçalho da tabela */}
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

        {/* Linhas de dados */}
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
                  let displayValue = result[field] || 'N/A';

                  if (field === 'DATA') {
                    displayValue = formatDate(result[field]);
                  } else if (
                    field === 'NUMEROCLIENTE' &&
                    result[field] !== undefined &&
                    result[field] !== null
                  ) {
                    displayValue = Number(result[field]).toLocaleString(
                      'pt-BR',
                    );
                  } else if (
                    field === 'VALORTOTAL' &&
                    result[field] !== undefined &&
                    result[field] !== null
                  ) {
                    displayValue = Number(result[field]).toLocaleString(
                      'pt-BR',
                      {
                        style: 'currency',
                        currency: 'BRL',
                      },
                    );
                  } else if (field === 'CANCELADA' && result[field]) {
                    // Remove espaços extras do CANCELADA
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

        {/* Rodapé com total */}
        {filteredResults.length > 0 && (
          <div
            className="mt-2 grid min-w-full items-center gap-4 border-t-2 border-gray-300 bg-gray-100 p-3 font-bold"
            style={{
              gridTemplateColumns: `repeat(${fields.length}, minmax(150px, 1fr))`,
            }}
          >
            <div
              className="text-right text-sm font-bold"
              style={{ gridColumn: `1 / ${fields.length - 1}` }}
            >
              Total a Prazo (período selecionado):
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

    // Move o campo NOME para o início se existir
    const nameIndex = fields.indexOf('NOME');
    if (nameIndex > 0) {
      const nameField = fields.splice(nameIndex, 1)[0];
      fields.unshift(nameField);
    }

    return (
      <div key={storeId} className="mb-6">
        {/* Cabeçalho da loja */}
        <div className="mt-4 mb-3 text-lg font-bold text-blue-700 first:mt-0">
          Loja: {storeId}
        </div>

        {/* Cabeçalho da tabela */}
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

        {/* Linhas de dados */}
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
