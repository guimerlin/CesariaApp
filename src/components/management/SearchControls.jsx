// components/management/SearchControls.jsx
import React from 'react';

const SearchControls = ({
  onlineStores,
  selectedStore,
  setSelectedStore,
  selectedTable,
  setSelectedTable,
  selectedField,
  setSelectedField,
  searchTerm,
  setSearchTerm,
  searchAllStores,
  setSearchAllStores,
  availableTables,
  tableFields,
  canSearch,
  onSearch,
  onClear,
  onRefreshStores
}) => {
  const handleTableChange = (e) => {
    const newTable = e.target.value;
    setSelectedTable(newTable);
    // Limpa o campo selecionado quando muda a tabela
    setSelectedField('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && canSearch) {
      onSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Seleção de Loja */}
        <div>
          <label htmlFor="storeSelect" className="block text-sm font-medium text-gray-700 mb-2">
            Loja:
          </label>
          <select
            id="storeSelect"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={searchAllStores}
          >
            <option value="">
              {onlineStores.length === 0 ? 'Nenhuma loja online' : 'Selecione uma loja'}
            </option>
            {onlineStores.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
        </div>

        {/* Seleção de Tabela */}
        <div>
          <label htmlFor="tableSelect" className="block text-sm font-medium text-gray-700 mb-2">
            Tabela:
          </label>
          <select
            id="tableSelect"
            value={selectedTable}
            onChange={handleTableChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione uma tabela</option>
            {availableTables.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>
        </div>

        {/* Campo de Pesquisa */}
        <div>
          <label htmlFor="searchField" className="block text-sm font-medium text-gray-700 mb-2">
            Campo de Pesquisa:
          </label>
          <select
            id="searchField"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedTable}
          >
            <option value="">Selecione um campo</option>
            {tableFields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Termo de Pesquisa */}
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-2">
            Termo de Pesquisa:
          </label>
          <input
            type="text"
            id="searchTerm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite o termo para pesquisar..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Opções de Pesquisa */}
        <div className="flex items-end">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                id="searchAllStores"
                checked={searchAllStores}
                onChange={(e) => setSearchAllStores(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Pesquisar em todas as lojas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex space-x-4">
        <button
          onClick={onSearch}
          disabled={!canSearch}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors disabled:bg-gray-400"
        >
          Pesquisar
        </button>
        <button
          onClick={onClear}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors"
        >
          Limpar
        </button>
        <button
          onClick={onRefreshStores}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors"
        >
          Atualizar Lojas
        </button>
      </div>
    </div>
  );
};

export default SearchControls;

