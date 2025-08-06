// components/management/SearchControls.jsx
import { set } from 'firebase/database';
import React from 'react';
import { useState, useEffect } from 'react';

const SearchControls = ({
  onlineStores,
  selectedStore,
  setSelectedStore,
  selectedField,
  setSelectedField,
  searchTerm,
  setSearchTerm,
  searchAllStores,
  setSearchAllStores,
  canSearch,
  onSearch,
  onClear,
  onRefreshStores,
  setSelectedConvenio,
  selectedConvenio
}) => {
  // Tabela CLIENTES está fixada, não precisa mais do handleTableChange

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && canSearch) {
      onSearch();
    }
  };

  const [convenios, setConvenios] = useState()
  const [selectedCName, setSelectedCName] = useState()

  useEffect(() => {
    if (convenios) return;
    window.electronAPI.getConfig().then((config) => {
      console.log('Config:', config.convenios);
    setConvenios(config.convenios);
    console.log('Convenios:', convenios);
  })});



  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Seleção de Loja */}
        <div>
          <label
            htmlFor="storeSelect"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Loja:
          </label>
          <select
            id="storeSelect"
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={searchAllStores}
          >
            <option value="">
              {onlineStores.length === 0
                ? 'Nenhuma loja online'
                : 'Selecione uma loja'}
            </option>
            {onlineStores.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
        </div>

        {/* Campo de Pesquisa */}
        <div>
          <label
            htmlFor="searchField"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Convênio:
          </label>
          <select
            id="searchField"
            value={selectedCName}
            onChange={(e) => {
              setSelectedConvenio(e.target.value);
            setSelectedCName(e.target.key);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Selecione um convênio</option>
            {convenios && Object.entries(convenios).map(([nome, codigo]) => (
              <option key={nome} value={codigo}>
                {nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Informação sobre tabela fixa */}
      <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3">
        <p className="text-sm text-blue-700">
          <strong>Tabela selecionada:</strong> CLIENTES (fixo)
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Termo de Pesquisa */}
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
            placeholder="Digite o termo para pesquisar..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              <span className="text-sm text-gray-700">
                Pesquisar em todas as lojas
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex space-x-4">
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
        <button
          onClick={onRefreshStores}
          className="rounded-md bg-green-500 px-6 py-2 text-white transition-colors hover:bg-green-600"
        >
          Atualizar Lojas
        </button>
      </div>
    </div>
  );
};

export default SearchControls;
