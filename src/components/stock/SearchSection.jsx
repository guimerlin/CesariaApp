// components/stock/SearchSection.jsx
import React from 'react';

const SearchSection = ({
  onlineStores,
  selectedStore,
  setSelectedStore,
  searchTerm,
  setSearchTerm,
  searchAllStores,
  setSearchAllStores,
  onSearch,
  isLoading
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading && searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e);
    }
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
          {/* Seletor de Loja */}
          <div>
            <label 
              htmlFor="storeSelect" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Consultar na Loja:
            </label>
            <select
              id="storeSelect"
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              disabled={searchAllStores || onlineStores.length === 0}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {onlineStores.length === 0 ? (
                <option>Nenhuma loja online</option>
              ) : (
                onlineStores.map((store) => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Campo de Busca */}
          <div>
            <label 
              htmlFor="productSearchInput" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome do Produto:
            </label>
            <input
              type="text"
              id="productSearchInput"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: Sabonete"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
              disabled={isLoading}
            />
          </div>

          {/* Botão de Busca */}
          <button
            type="submit"
            disabled={isLoading || !searchTerm.trim() || (onlineStores.length === 0 && !searchAllStores)}
            className="bg-red-600 text-white p-2 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 h-10 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Buscando...
              </span>
            ) : (
              'Buscar'
            )}
          </button>
        </div>

        {/* Checkbox para buscar em todas as lojas */}
        <label className="flex items-center gap-2 mb-2 cursor-pointer">
          <input
            type="checkbox"
            id="searchAllStores"
            checked={searchAllStores}
            onChange={(e) => setSearchAllStores(e.target.checked)}
            disabled={isLoading}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500 disabled:cursor-not-allowed"
          />
          <span className="text-sm text-gray-700">
            Buscar em todas as lojas ({onlineStores.length} online)
          </span>
        </label>
      </form>
    </div>
  );
};

export default SearchSection;

