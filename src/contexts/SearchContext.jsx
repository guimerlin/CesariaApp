import React, { createContext, useContext, useState, useCallback } from 'react';
import { useUser } from './UserContext';
import { useChat } from './ChatContext'; // Import useChat to get all users

const SearchContext = createContext(null);

export const SearchContextProvider = ({ children }) => {
  const { currentUser } = useUser();
  const { allUsers } = useChat(); // Get all users from ChatContext
  const [searchResults, setSearchResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // This function remains the same, it sends a request to a specific target
  async function sendProductRequest(
    targetApiLink,
    productInfo,
    quantidade
  ) {
    if (!currentUser) throw new Error("Usuário não logado.");

    const requestBody = {
      code: productInfo.CODIGO,
      name: productInfo.PRODUTO,
      amount: quantidade,
      storeId: currentUser.name,
      password: currentUser.config?.APIPassword,
    };

    const fetchUrl = `https://${targetApiLink}/request`;
    const options = {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    };

    try {
      const result = await window.electronAPI.fetchUrl(fetchUrl, options);
      if (!result.success) {
        throw new Error(`Erro na solicitação: ${result.error || result.message}`);
      }
      return result;
    } catch (error) {
      console.error(`[PRODUCT REQUEST] Falha ao enviar solicitação:`, error);
      throw error;
    }
  }

  // This function is now corrected to search across all users with an apiLink
  const search = useCallback(async (searchTerm, searchType) => {
    if (!currentUser) {
      setStatusMessage('Usuário não logado.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Buscando em todas as lojas...');
    setSearchResults({});
    console.log(`Iniciando busca global por "${searchTerm}"`);

    const promises = allUsers
      .filter(user => user.apiLink) // Ensure the user has an API link
      .map(user => {
        const { apiLink, name: storeName, config } = user;
        let promise;

        if (searchType === 'convenio') {
          const fetchUrl = `https://${apiLink}/cliente/convenio`;
          const options = {
            method: 'POST',
            body: JSON.stringify({ searchTerm, password: config?.APIPassword }),
            headers: { 'Content-Type': 'application/json' },
          };
          promise = window.electronAPI.fetchUrl(fetchUrl, options);
        } else {
          const fetchUrl = `https://${apiLink}/${searchType}/${searchTerm}`;
          promise = window.electronAPI.fetchUrl(fetchUrl);
        }

        return promise
          .then(result => {
            if (!result.success) throw new Error(result.error || `Erro na loja ${storeName}`);
            return { storeName, data: result.data.data };
          })
          .catch(error => {
            console.error(`Falha ao buscar dados da loja ${storeName}:`, error);
            return { storeName, error: error.message, data: [] }; // Return empty data on error
          });
      });

    const results = await Promise.all(promises);

    const newResults = {};
    let totalResults = 0;
    results.forEach(result => {
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        newResults[result.storeName] = result.data;
        totalResults += result.data.length;
      }
    });

    setSearchResults(newResults);
    setStatusMessage(`${totalResults} resultado(s) encontrado(s) em ${results.length} loja(s).`);
    setIsLoading(false);
    console.log('Busca finalizada.', { newResults, totalResults });
  }, [currentUser, allUsers]);

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
    sendProductRequest,
  };

  return (
    <SearchContext.Provider value={values}>{children}</SearchContext.Provider>
  );
};

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error(
      'useSearchContext deve ser usado dentro de um SearchContextProvider',
    );
  }
  return context;
};
