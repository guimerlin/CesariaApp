import React, { useState } from 'react';
import { SearchContextProvider, useSearchContext } from '../contexts/SearchContext';
import SearchControls from '../components/management/SearchControls';
import ResultsDisplay from '../components/management/ResultsDisplay';
import StatusArea from '../components/management/StatusArea';
import ClientDetailsModal from '../components/management/ClientDetailsModal';

const ManagementContent = () => {
  const { searchResults, isLoading, statusMessage, search, clearSearch } = useSearchContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      search(searchTerm, 'convenio');
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    clearSearch();
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  return (
    <div className="container mx-auto min-h-screen p-4">
      <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Consulta de Convênios</h1>
        <p className="text-gray-600">
          Faça pesquisas por convênios em todas as lojas.
        </p>
      </div>

      <SearchControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearch={handleSearch}
        onClear={handleClear}
        canSearch={!isLoading}
      />

      <StatusArea
        message={statusMessage}
        type={
          statusMessage.includes('Erro')
            ? 'error'
            : statusMessage.includes('encontrado(s)')
              ? 'success'
              : 'info'
        }
        isVisible={!!statusMessage}
      />

      <ResultsDisplay
        searchResults={searchResults}
        isLoading={isLoading}
        selectedTable="CLIENTES" // Hardcoded for now
        onClientClick={handleClientClick}
      />

      {selectedClient && (
        <ClientDetailsModal
          isVisible={isModalOpen}
          onClose={handleCloseModal}
          clientData={selectedClient}
          clientDetails={searchResults}
          isLoadingDetails={isLoading}
        />
      )}
    </div>
  );
};

const Management = () => (
  <SearchContextProvider>
    <ManagementContent />
  </SearchContextProvider>
);

export default Management;