// hooks/useStockSearch.jsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { StockService } from '../services/stockService.jsx';

export const useStockSearch = (db, currentUser, basePath, dbService) => {
  const [onlineStores, setOnlineStores] = useState([]);
  const [searchResults, setSearchResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [searchAllStores, setSearchAllStores] = useState(true);

  const stockServiceRef = useRef(null);
  const activeListenerRef = useRef(null);

  // Inicializa o serviço de estoque
  useEffect(() => {
    if (db && currentUser && basePath) {
      stockServiceRef.current = new StockService(db, currentUser, basePath);
    }
  }, [db, currentUser, basePath]);

  /**
   * Carrega as lojas online
   */
  const loadOnlineStores = useCallback(async () => {
    console.log('[STOCK SEARCH] Carregando lojas online...');
    if (!stockServiceRef.current) return;

    try {
      const stores = await stockServiceRef.current.loadOnlineStores();
      setOnlineStores(stores);

      if (stores.length === 0) {
        setStatusMessage('Nenhuma loja online disponível');
        return false;
      }

      if (stores.length > 0 && !selectedStore) {
        setSelectedStore(stores[0]);
      }

      return true;
    } catch (error) {
      console.error('Erro ao carregar lojas online:', error);
      setStatusMessage('Erro ao carregar lojas online');
      return false;
    }
  }, [selectedStore]);

  /**
   * Inicia a escuta de respostas de estoque
   */
  const startListeningForAnswers = useCallback(() => {
    if (!stockServiceRef.current || activeListenerRef.current) return;

    activeListenerRef.current = stockServiceRef.current.listenForStockAnswers(
      (newResults) => {
        setSearchResults((prevResults) => {
          const updatedResults = { ...prevResults };

          Object.entries(newResults).forEach(([loja, produtos]) => {
            if (!updatedResults[loja]) {
              updatedResults[loja] = [];
            }
            updatedResults[loja].push(...produtos);
          });

          return updatedResults;
        });

        setIsLoading(false);
        setStatusMessage('');
      },
    );
  }, []);

  /**
   * Para a escuta de respostas
   */
  const stopListeningForAnswers = useCallback(() => {
    if (activeListenerRef.current) {
      activeListenerRef.current();
      activeListenerRef.current = null;
    }
  }, []);

  /**
   * Executa a busca de estoque
   */
  const executeSearch = useCallback(
    async (searchTerm) => {
      if (!stockServiceRef.current || !searchTerm.trim()) {
        setStatusMessage('Digite um termo para pesquisar');
        return;
      }

      setIsLoading(true);
      setSearchResults({});
      setStatusMessage('Buscando...');

      try {
        if (searchAllStores) {
          if (onlineStores.length === 0) {
            setStatusMessage('Nenhuma loja online para pesquisar');
            setIsLoading(false);
            return;
          }

          await stockServiceRef.current.sendMultipleStockRequests(
            onlineStores,
            searchTerm,
          );
          setStatusMessage(
            `Solicitação enviada para ${onlineStores.length} loja(s) online`,
          );
        } else {
          if (!selectedStore) {
            setStatusMessage('Selecione uma loja para pesquisar');
            setIsLoading(false);
            return;
          }

          await stockServiceRef.current.sendStockRequest(
            selectedStore,
            searchTerm,
          );
          setStatusMessage(`Solicitação enviada para ${selectedStore}`);
        }

        // Define timeout para a busca
        setTimeout(() => {
          if (isLoading) {
            setIsLoading(false);
            setStatusMessage('Tempo limite da busca excedido');
          }
        }, 30000);
      } catch (error) {
        console.error('Erro ao executar busca:', error);
        setStatusMessage('Erro ao executar busca');
        setIsLoading(false);
      }
    },
    [searchAllStores, selectedStore, onlineStores, isLoading],
  );

  /**
   * Solicita um item
   */
  const requestItem = useCallback(
    async (productInfo, quantidade) => {
      console.log('[STOCK SEARCH] requestItem chamado com:', {
        productInfo,
        quantidade,
        hasStockService: !!stockServiceRef.current,
        hasDbService: !!dbService
      });

      if (!stockServiceRef.current || !productInfo.storeId) {
        console.error('Informações insuficientes para solicitar item');
        return false;
      }

      try {
        console.log('[STOCK SEARCH] Enviando solicitação de item');
        // Envia solicitação de item
        await stockServiceRef.current.sendItemRequest(
          productInfo.storeId,
          productInfo,
          quantidade,
        );
        console.log('[STOCK SEARCH] Solicitação de item enviada com sucesso');

        // Envia mensagem no chat se dbService estiver disponível
        if (dbService) {
          console.log('[STOCK SEARCH] Enviando mensagem no chat');
          await stockServiceRef.current.sendChatMessage(
            productInfo.storeId,
            productInfo,
            quantidade,
            dbService,
          );
          console.log('[STOCK SEARCH] Mensagem no chat enviada com sucesso');
        } else {
          console.warn('[STOCK SEARCH] dbService não disponível, pulando envio de mensagem');
        }

        return true;
      } catch (error) {
        console.error('[STOCK SEARCH] Erro ao solicitar item:', error);
        return false;
      }
    },
    [dbService],
  );

  /**
   * Limpa os resultados da busca
   */
  const clearResults = useCallback(() => {
    setSearchResults({});
    setStatusMessage('');
    setIsLoading(false);
  }, []);

  /**
   * Filtra produtos com estoque disponível
   */
  const getAvailableProducts = useCallback((products) => {
    return products.filter((product) => {
      const estoque = Number(
        product.ESTOQUEATUAL ?? product.ESTOQUE ?? product.estoque,
      );
      return !isNaN(estoque) && estoque >= 1;
    });
  }, []);

  // Inicia a escuta quando o componente é montado
  useEffect(() => {
    startListeningForAnswers();
    return () => stopListeningForAnswers();
  }, [startListeningForAnswers, stopListeningForAnswers]);

  // Carrega lojas online quando o serviço está disponível
  useEffect(() => {
    if (stockServiceRef.current) {
      loadOnlineStores();
    }
  }, [loadOnlineStores]);

  return {
    // Estado
    onlineStores,
    searchResults,
    isLoading,
    statusMessage,
    selectedStore,
    searchAllStores,

    // Ações
    setSelectedStore,
    setSearchAllStores,
    executeSearch,
    requestItem,
    clearResults,
    loadOnlineStores,
    getAvailableProducts,

    // Utilitários
    hasResults: Object.keys(searchResults).length > 0,
    totalStores: onlineStores.length,
  };
};
