import React, { createContext, useContext, useState, useCallback } from 'react';
import config from '../../config.json';

const SearchContext = createContext(null);

export const SearchContextProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  async function sendProductRequest(
    targetStore,
    productInfo,
    quantidade,
    currentUser,
  ) {
    console.log('[PRODUCT REQUEST] Enviando solicitação de produto:', {
      targetStore,
      productInfo,
      quantidade,
      currentUser,
    });

    const endpoints = config.endpoints || {};
    const url = endpoints[targetStore];

    if (!url) {
      console.error(`[PRODUCT REQUEST] URL para a loja ${targetStore} não encontrada.`);
      throw new Error(`Endpoint para a loja ${targetStore} não configurado.`);
    }

    const requestBody = {
      code: productInfo.CODIGO,
      name: productInfo.PRODUTO,
      amount: quantidade,
      storeId: currentUser,
      password: config.APIPassword,
    };

    const fetchUrl = `https://${url}/request`;
    const options = {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      console.log(`[PRODUCT REQUEST] Enviando requisição para: ${fetchUrl}`);
      const result = await window.electronAPI.fetchUrl(fetchUrl, options);
      console.log('[PRODUCT REQUEST] Resultado da requisição:', result);

      if (!result.success) {
        throw new Error(
          `Erro na solicitação para ${targetStore}: ${result.error || result.message}`,
        );
      }

      return result;
    } catch (error) {
      console.error(
        `[PRODUCT REQUEST] Falha ao enviar solicitação para ${targetStore}:`,
        error,
      );
      throw error;
    }
  }

  const search = useCallback(async (searchTerm, searchType) => {
    setIsLoading(true);
    setStatusMessage('Buscando...');
    setSearchResults({});
    console.log(`Iniciando busca por "${searchTerm}" do tipo "${searchType}"`);

    const endpoints = config.endpoints || {};
    const promises = [];

    for (const [storeName, url] of Object.entries(endpoints)) {
      let promise;
      if (searchType === 'convenio') {
        const fetchUrl = `https://${url}/cliente/convenio`;
        console.log(`Buscando em: ${fetchUrl} (POST)`);
        const options = {
          method: 'POST',
          body: JSON.stringify({
            searchTerm: searchTerm,
            password: config.APIPassword,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        };
        promise = window.electronAPI
          .fetchUrl(fetchUrl, options)
          .then((result) => {
            if (!result.success) {
              throw new Error(`Erro na loja ${storeName}: ${result.error}`);
            }
            return { storeName, data: result.data.data };
          })
          .catch((error) => {
            console.error(`Falha ao buscar dados da loja ${storeName}:`, error);
            return { storeName, error: error.message };
          });
      } else {
        const fetchUrl = `https://${url}/${searchType}/${searchTerm}`;
        console.log(`Buscando em: ${fetchUrl} (GET)`);
        promise = window.electronAPI
          .fetchUrl(fetchUrl)
          .then((result) => {
            if (!result.success) {
              throw new Error(`Erro na loja ${storeName}: ${result.error}`);
            }
            return { storeName, data: result.data.data };
          })
          .catch((error) => {
            console.error(`Falha ao buscar dados da loja ${storeName}:`, error);
            return { storeName, error: error.message };
          });
      }
      promises.push(promise);
    }

    const results = await Promise.all(promises);

    const newResults = {};
    let totalResults = 0;
    results.forEach((result) => {
      if (result.data && Array.isArray(result.data)) {
        newResults[result.storeName] = result.data;
        totalResults += result.data.length;
      }
    });

    setSearchResults(newResults);
    setStatusMessage(`${totalResults} resultado(s) encontrado(s).`);
    setIsLoading(false);
    console.log('Busca finalizada.', { newResults, totalResults });
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
