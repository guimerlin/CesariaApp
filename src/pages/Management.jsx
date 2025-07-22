// pages/Management.jsx
import React, { useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useFirebird } from '../hooks/useFirebird.jsx';
import { useManagementSearch } from '../hooks/useManagementSearch.jsx';
import { useTableStructures } from '../hooks/useTableStructures.jsx';
import SearchControls from '../components/management/SearchControls.jsx';
import StatusArea from '../components/management/StatusArea.jsx';
import ResultsDisplay from '../components/management/ResultsDisplay.jsx';
import ConfigModal from '../components/stock/ConfigModal.jsx';

const Management = () => {
  const { currentUser, db } = useChat();
  // dbService retirado
  const basePath = 'artifacts/default-app-id/public/data';

  // Hooks customizados
  const {
    config: firebirdConfig,
    showConfigModal,
    setShowConfigModal,
    handleConfigSave,
    handleConfigCancel,
  } = useFirebird();

  const { availableTables, getTableFields } = useTableStructures();

  const {
    onlineStores,
    searchResults,
    isLoading,
    statusMessage,
    selectedStore,
    selectedTable,
    selectedField,
    searchTerm,
    searchAllStores,
    setSelectedStore,
    setSelectedTable,
    setSelectedField,
    setSearchTerm,
    setSearchAllStores,
    executeSearch,
    clearResults,
    loadOnlineStores,
    canSearch,
    // hasResults,
  } = useManagementSearch(db, currentUser, basePath);

  // Obtém os campos da tabela selecionada
  const tableFields = selectedTable ? getTableFields(selectedTable) : [];

  // Listener para abrir modal de configuração do Firebird
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onOpenFirebirdConfig) {
      const unsubscribe = window.electronAPI.onOpenFirebirdConfig(() => {
        setShowConfigModal(true);
      });

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [setShowConfigModal]);

  // Verifica se o usuário está logado
  if (!currentUser) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl text-red-700">
          Erro: Usuário não identificado. Por favor, feche esta janela e faça
          login novamente.
        </h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-h-screen p-4">
      {/* Cabeçalho */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">
          Gerenciamento de Tabelas
        </h1>
        <p className="text-gray-600">
          Consulte tabelas do Firebird remotamente em diferentes lojas
        </p>
      </div>

      {/* Controles de Pesquisa */}
      <SearchControls
        onlineStores={onlineStores}
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
        selectedField={selectedField}
        setSelectedField={setSelectedField}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchAllStores={searchAllStores}
        setSearchAllStores={setSearchAllStores}
        availableTables={availableTables}
        tableFields={tableFields}
        canSearch={canSearch}
        onSearch={executeSearch}
        onClear={clearResults}
        onRefreshStores={loadOnlineStores}
      />

      {/* Área de Status */}
      <StatusArea
        message={statusMessage}
        type={
          statusMessage.includes('Erro')
            ? 'error'
            : statusMessage.includes('encontrados')
              ? 'success'
              : statusMessage.includes('Nenhuma')
                ? 'warning'
                : 'info'
        }
        isVisible={!!statusMessage}
      />

      {/* Área de Resultados */}
      <ResultsDisplay
        searchResults={searchResults}
        selectedTable={selectedTable}
        isLoading={isLoading}
      />

      {/* Modal de Configuração do Firebird */}
      <ConfigModal
        isVisible={showConfigModal}
        config={firebirdConfig}
        onSave={handleConfigSave}
        onCancel={handleConfigCancel}
      />
    </div>
  );
};

export default Management;
