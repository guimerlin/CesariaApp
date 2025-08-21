import React, { createContext, useContext, useState, useCallback } from 'react';
import config from '../../config.json';

const SearchContext = createContext(null);

export const SearchContextProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const search = useCallback(async (searchTerm, searchType) => {
    setIsLoading(true);
    setStatusMessage('Buscando...');
    setSearchResults({});
    console.log(`Iniciando busca por "${searchTerm}" do tipo "${searchType}"`);

    const endpoints = config.endpoints || {};
    const promises = [];

    for (const [storeName, url] of Object.entries(endpoints)) {
      const fetchUrl = `https://${url}/${searchType}/${searchTerm}`;
      console.log(`Buscando em: ${fetchUrl}`);
      const promise = window.electronAPI.fetchUrl(fetchUrl)
        .then(result => {
          if (!result.success) {
            throw new Error(`Erro na loja ${storeName}: ${result.error}`);
          }
          return { storeName, data: result.data };
        })
        .catch(error => {
          console.error(`Falha ao buscar dados da loja ${storeName}:`, error);
          return { storeName, error: error.message };
        });
      promises.push(promise);
    }

    const results = await Promise.all(promises);

    const newResults = {};
    let totalResults = 0;
    results.forEach(result => {
      if (result.data) {
        newResults[result.storeName] = result.data;
        totalResults += result.data.length;
      }
    });

    setSearchResults(newResults);
    setStatusMessage(`${totalResults} resultado(s) encontrado(s).`);
    setIsLoading(false);
    console.log("Busca finalizada.", { newResults, totalResults });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults({});
    setStatusMessage('');
  }, []);


  const values = {
    searchResults,
    isLoading,
    statusMessage,
    search,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={values}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext deve ser usado dentro de um SearchContextProvider');
  }
  return context;
};