import React from 'react';

const SearchSection = ({
  searchTerm,
  setSearchTerm,
  onSearch,
  isLoading,
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

          <button
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
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
      </form>
    </div>
  );
};

export default SearchSection;