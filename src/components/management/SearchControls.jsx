import React from 'react';

const SearchControls = ({
  searchTerm,
  setSearchTerm,
  onSearch,
  onClear,
  canSearch,
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && canSearch) {
      onSearch();
    }
  };

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="searchTerm"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Termo de Pesquisa:
          </label>
          <input
            type="text"
            id="searchTerm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite o termo da pesquisa..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4 flex space-x-4">
        <button
          onClick={onSearch}
          disabled={!canSearch}
          className="rounded-md bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 disabled:bg-gray-400"
        >
          Pesquisar
        </button>
        <button
          onClick={onClear}
          className="rounded-md bg-gray-500 px-6 py-2 text-white transition-colors hover:bg-gray-600"
        >
          Limpar
        </button>
      </div>
    </div>
  );
};

export default SearchControls;