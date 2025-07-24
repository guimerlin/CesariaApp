// pages/Search.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useStockSearch } from '../hooks/useStockSearch.jsx';
import { useFirebird } from '../hooks/useFirebird.jsx';
import SearchSection from '../components/stock/SearchSection.jsx';
import StatusArea from '../components/stock/StatusArea.jsx';
import ResultsTable from '../components/stock/ResultsTable.jsx';
import QuantityModal from '../components/stock/QuantityModal.jsx';
import ConfigModal from '../components/stock/ConfigModal.jsx';

const Search = () => {
  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Hooks do contexto
  const { currentUser, db, dbService } = useChat();

  // Configuração do Firebase
  const appId = 'default-app-id';
  const basePath = `artifacts/${appId}/public/data`;

  // Hook de busca de estoque
  const {
    onlineStores,
    searchResults,
    isLoading,
    statusMessage,
    selectedStore,
    searchAllStores,
    setSelectedStore,
    setSearchAllStores,
    executeSearch,
    requestItem,
    clearResults,
    getAvailableProducts,
    hasResults,
  } = useStockSearch(db, currentUser, basePath, dbService);

  // Hook do Firebird
  const {
    config: firebirdConfig,
    updateConfig: updateFirebirdConfig,
    testConnection,
    queryTable,
    isConnected,
    isLoading: firebirdLoading,
    error: firebirdError,
  } = useFirebird();

  // Handlers para os modais
  const handleRequestItem = useCallback((product) => {
    setSelectedProduct(product);
    setIsQuantityModalOpen(true);
  }, []);

  const handleQuantityConfirm = useCallback(
    async (product, quantity) => {
      const success = await requestItem(product, quantity);

      if (success) {
        alert(
          `Solicitação de ${quantity} unidade(s) do produto "${product.PRODUTO}" enviada para ${product.storeId}.`,
        );
      } else {
        alert('Erro ao enviar solicitação. Tente novamente.');
      }
    },
    [requestItem],
  );

  const handleConfigSave = useCallback(
    async (newConfig) => {
      updateFirebirdConfig(newConfig);

      // Testa a conexão com a nova configuração
      const result = await testConnection();

      if (result.success) {
        alert('Configuração do Firebird salva e testada com sucesso!');
      } else {
        alert(
          `Configuração salva, mas houve erro na conexão: ${result.message}`,
        );
      }
    },
    [updateFirebirdConfig, testConnection],
  );

  // Listener para requisições de tabela do Firebird
  useEffect(() => {
    if (!db || !currentUser) return;

    const handleTableRequest = async (requestId, request) => {
      console.log('[DEBUG] Processando requisição de tabela:', request);

      try {
        const result = await queryTable(
          request.tableName,
          request.fieldName,
          request.searchValue,
        );

        // Aqui você pode implementar o envio da resposta de volta ao Firebase
        // usando o stockService ou dbService
        console.log('[DEBUG] Resultado da consulta:', result);
      } catch (error) {
        console.error('[DEBUG] Erro ao processar requisição de tabela:', error);
      }
    };

    // Implementar listener para requisições de tabela
    // Este código seria similar ao que está no stock.js original
  }, [db, currentUser, queryTable]);

  // Listener para configuração do Firebird via Electron
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onOpenFirebirdConfig) {
      const unsubscribe = window.electronAPI.onOpenFirebirdConfig(() => {
        setIsConfigModalOpen(true);
      });

      return unsubscribe;
    }
  }, []);

  // Verifica se o usuário está logado
  if (!currentUser) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-700">
            Erro: Usuário não identificado
          </h2>
          <p className="text-gray-600">Por favor, faça login novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="container mx-auto max-w-7xl rounded-xl bg-white p-8 shadow-lg">
          {/* Cabeçalho */}
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold text-red-700">
              TRANSFERENCIA DE PRODUTOS
            </h1>
            <p className="text-sm text-gray-600">
              Logado como: <span className="font-medium">{currentUser}</span>
              {isConnected && (
                <span className="ml-4 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Estoque Local Online.
                </span>
              )}
              {firebirdError && (
                <span className="ml-4 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  Estoque Local Offline.
                </span>
              )}
            </p>
          </div>

          {/* Seção de Busca */}
          <SearchSection
            onlineStores={onlineStores}
            selectedStore={selectedStore}
            setSelectedStore={setSelectedStore}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchAllStores={searchAllStores}
            setSearchAllStores={setSearchAllStores}
            onSearch={executeSearch}
            isLoading={isLoading}
          />

          {/* Área de Status */}
          <StatusArea
            message={statusMessage}
            isLoading={isLoading}
            isVisible={!!statusMessage}
          />

          {/* Botões de Ação */}
          <div className="mb-4 flex gap-2">
            {hasResults && (
              <button
                onClick={clearResults}
                className="rounded-lg bg-gray-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-gray-600"
              >
                Limpar Resultados
              </button>
            )}
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-600"
            >
              Configurações
            </button>
          </div>

          {/* Tabela de Resultados */}
          {hasResults ? (
            <ResultsTable
              searchResults={searchResults}
              onRequestItem={handleRequestItem}
              getAvailableProducts={getAvailableProducts}
            />
          ) : (
            !isLoading &&
            !statusMessage && (
              <div className="p-8 text-center text-gray-500">
                <p>
                  Digite um termo de busca para consultar o estoque das lojas
                  online.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Modais */}
      <QuantityModal
        isOpen={isQuantityModalOpen}
        onClose={() => {
          setIsQuantityModalOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleQuantityConfirm}
        productInfo={selectedProduct}
      />

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleConfigSave}
        config={firebirdConfig}
        isLoading={firebirdLoading}
      />
    </div>
  );
};

export default Search;
