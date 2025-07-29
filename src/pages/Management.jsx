// pages/Management.jsx
import React, { useEffect, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useFirebird } from '../hooks/useFirebird.jsx';
import { useManagementSearch } from '../hooks/useManagementSearch.jsx';
import { useTableStructures } from '../hooks/useTableStructures.jsx';
import SearchControls from '../components/management/SearchControls.jsx';
import StatusArea from '../components/management/StatusArea.jsx';
import ResultsDisplay from '../components/management/ResultsDisplay.jsx';
import ClientDetailsModal from '../components/management/ClientDetailsModal.jsx';
import ConfigModal from '../components/stock/ConfigModal.jsx';
import { ManagementService } from '../services/managementService.jsx';

const Management = () => {
  const { currentUser, db } = useChat();
  // dbService retirado
  const basePath = 'artifacts/default-app-id/public/data';

  // Estados para modal de detalhes do cliente
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedClientData, setSelectedClientData] = useState(null);

  // Hooks customizados
  const {
    config: firebirdConfig,
    showConfigModal,
    setShowConfigModal,
    handleConfigSave,
    handleConfigCancel,
  } = useFirebird();

  const { getTableFields } = useTableStructures();

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

  /**
   * Função para lidar com clique no cliente (mostrar detalhes em todas as lojas)
   */
  const handleClientClick = (clientData) => {
    // Identificador do cliente (pode ser NOMECLIENTE ou MATRICULA)
    const idValue = clientData.MATRICULA || clientData.NOMECLIENTE;
    if (!idValue) return;
    // Agrupar todos os registros desse cliente em todas as lojas
    const grouped = {};
    Object.entries(searchResults).forEach(([loja, results]) => {
      grouped[loja] = results.filter(
        (item) =>
          (item.MATRICULA && item.MATRICULA === clientData.MATRICULA) ||
          (item.NOMECLIENTE && item.NOMECLIENTE === clientData.NOMECLIENTE)
      );
    });
    setSelectedClient(grouped);
    setSelectedClientData(clientData);
    setShowClientModal(true);
  };

  /**
   * Função para fechar modal de detalhes
   */
  const handleCloseClientModal = () => {
    setShowClientModal(false);
    setSelectedClient(null);
  };

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

  // Listener para respostas de detalhes do cliente (apenas DADOSPREVENDA)
  useEffect(() => {
    if (!db || !currentUser || !showClientModal) return;
    const managementService = new ManagementService(db, currentUser, basePath);
    const unsubscribe = managementService.listenForTableAnswers(() => {
      // Não faz nada, pois não usamos mais esse listener
    });
    return () => unsubscribe && unsubscribe();
  }, [db, currentUser, basePath, showClientModal]);

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
        <h1 className="mb-2 text-2xl font-bold text-gray-800">CONVENIOS</h1>
        <p className="text-gray-600">
          Faça pesquisas por Convenios em todas as lojas.
        </p>
      </div>

      {/* Controles de Pesquisa */}
      <SearchControls
        onlineStores={onlineStores}
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
        selectedField={selectedField}
        setSelectedField={setSelectedField}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchAllStores={searchAllStores}
        setSearchAllStores={setSearchAllStores}
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
        onClientClick={handleClientClick}
      />

      {/* Modal de Detalhes do Cliente */}
      <ClientDetailsModal
        isVisible={showClientModal}
        onClose={handleCloseClientModal}
        clientDetails={selectedClient}
        clientData={selectedClientData}
        isLoadingDetails={false}
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
