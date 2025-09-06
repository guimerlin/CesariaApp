import React, { useState, useCallback } from 'react';
import {
  SearchContextProvider,
  useSearchContext,
} from '../contexts/SearchContext';
import { useChat } from '../contexts/ChatContext';
import SearchSection from '../components/stock/SearchSection';
import StatusArea from '../components/stock/StatusArea';
import ResultsTable from '../components/stock/ResultsTable';
import QuantityModal from '../components/stock/QuantityModal';

const SearchContent = () => {
  const { currentUser, dbService } = useChat();
  const {
    searchResults,
    isLoading,
    statusMessage,
    search,
    clearSearch,
    sendProductRequest,
  } = useSearchContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      search(searchTerm, 'produto');
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    clearSearch();
  };

  const handleRequestItem = useCallback((product) => {
    setSelectedProduct(product);
    setIsQuantityModalOpen(true);
  }, []);

  const handleQuantityConfirm = useCallback(async (product, quantity) => {
    sendProductRequest(product.storeId, product, quantity);
    alert(
      `Solicitação de "${product.PRODUTO}" enviada para ${product.storeId}. Aguarde uma resposta para saber se o produto foi transferido com sucesso.`,
    );
  }, []);

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
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold text-red-700">
              TRANSFERENCIA DE PRODUTOS
            </h1>
            <p className="text-sm text-gray-600">
              Logado como: <span className="font-medium">{currentUser}</span>
            </p>
          </div>

          <SearchSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearch}
            isLoading={isLoading}
          />

          <StatusArea
            message={statusMessage}
            isLoading={isLoading}
            isVisible={!!statusMessage}
          />

          <div className="mb-4 flex gap-2">
            {Object.keys(searchResults).length > 0 && (
              <button
                onClick={handleClear}
                className="rounded-lg bg-gray-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-gray-600"
              >
                Limpar Resultados
              </button>
            )}
          </div>

          {Object.keys(searchResults).length > 0 ? (
            <ResultsTable
              searchResults={searchResults}
              onRequestItem={handleRequestItem}
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

      <QuantityModal
        isOpen={isQuantityModalOpen}
        onClose={() => {
          setIsQuantityModalOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleQuantityConfirm}
        productInfo={selectedProduct}
      />
    </div>
  );
};

const Search = () => (
  <SearchContextProvider>
    <SearchContent />
  </SearchContextProvider>
);

export default Search;
