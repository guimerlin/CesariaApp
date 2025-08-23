import React, { createContext, useContext, useState, useCallback } from 'react';
import config from '../../config.json';

const SearchContext = createContext(null);

export const SearchContextProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  async function sendChatMessage(
    targetStore,
    productInfo,
    quantidade,
    dbService,
    currentUser,
  ) {
    console.log('[STOCK SERVICE] Enviando mensagem no chat:', {
      targetStore,
      productInfo,
      quantidade,
      dbService: !!dbService,
    });

    if (!dbService) {
      console.error('[STOCK SERVICE] dbService não fornecido');
      return;
    }

    const lojas = [currentUser, targetStore].sort();
    const chatId = `${lojas[0]}_${lojas[1]}`;

    const message = {
      sender: currentUser,
      senderName: currentUser,
      timestamp: Date.now(),
      text: `Solicitação URGENTE de ${quantidade} unidade(s) do produto "${productInfo.PRODUTO}" (Código: ${productInfo.CODIGO}).`,
      urgent: true,
      product: productInfo,
      quantidade: quantidade,
    };

    try {
      console.log('[STOCK SERVICE] Enviando mensagem para chatId:', chatId);
      await dbService.sendMessage(chatId, message);
      console.log('[STOCK SERVICE] Mensagem enviada com sucesso');

      console.log('[STOCK SERVICE] Criando notificação urgente');
      await dbService.createUrgentNotification(chatId, currentUser, [
        targetStore,
      ]);
      console.log('[STOCK SERVICE] Notificação urgente criada com sucesso');
    } catch (error) {
      console.error(
        '[STOCK SERVICE] Erro ao enviar mensagem/notificação:',
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
        const fetchUrl = `http://${url}/cliente/convenio`;
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
        const fetchUrl = `http://${url}/${searchType}/${searchTerm}`;
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
    sendChatMessage,
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
