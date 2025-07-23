// hooks/useManagementSearch.jsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { ManagementService } from '../services/managementService.jsx';

export const useManagementSearch = (db, currentUser, basePath) => {
  const [onlineStores, setOnlineStores] = useState([]);
  const [searchResults, setSearchResults] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedTable] = useState('CLIENTES'); // Fixado em CLIENTES
  const [selectedField, setSelectedField] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAllStores, setSearchAllStores] = useState(false);

  const managementServiceRef = useRef(null);
  const activeListenerRef = useRef(null);

  // Inicializa o serviço de gerenciamento
  useEffect(() => {
    if (db && currentUser && basePath) {
      managementServiceRef.current = new ManagementService(
        db,
        currentUser,
        basePath,
      );
    }
  }, [db, currentUser, basePath]);

  /**
   * Carrega as lojas online
   */
  const loadOnlineStores = useCallback(async () => {
    if (!managementServiceRef.current) return;

    try {
      const stores = await managementServiceRef.current.loadOnlineStores();
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
   * Inicia a escuta de respostas de tabela
   */
  const startListeningForAnswers = useCallback(() => {
    if (!managementServiceRef.current || activeListenerRef.current) return;

    activeListenerRef.current =
      managementServiceRef.current.listenForTableAnswers((newResults) => {
        setSearchResults((prevResults) => {
          const updatedResults = { ...prevResults };

          Object.entries(newResults).forEach(([storeId, items]) => {
            if (!updatedResults[storeId]) {
              updatedResults[storeId] = [];
            }
            updatedResults[storeId].push(...items);
          });

          return updatedResults;
        });

        setIsLoading(false);
        setStatusMessage('');
      });
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
   * Executa a pesquisa de tabela
   */
  const executeSearch = useCallback(async () => {
    if (
      !managementServiceRef.current ||
      !selectedTable ||
      !selectedField ||
      !searchTerm.trim()
    ) {
      setStatusMessage('Preencha todos os campos obrigatórios');
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

        await managementServiceRef.current.sendMultipleTableRequests(
          onlineStores,
          selectedTable,
          selectedField,
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

        await managementServiceRef.current.sendTableRequest(
          selectedStore,
          selectedTable,
          selectedField,
          searchTerm,
        );
        setStatusMessage(`Solicitação enviada para ${selectedStore}`);
      }

      // Define timeout para a busca
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          if (Object.keys(searchResults).length === 0) {
            setStatusMessage('Nenhuma resposta recebida no tempo esperado');
          } else {
            setStatusMessage('');
          }
        }
      }, 30000);
    } catch (error) {
      console.error('Erro ao executar pesquisa:', error);
      setStatusMessage('Erro ao executar pesquisa');
      setIsLoading(false);
    }
  }, [
    searchAllStores,
    selectedStore,
    selectedTable,
    selectedField,
    searchTerm,
    onlineStores,
    isLoading,
    searchResults,
  ]);

  /**
   * Limpa os resultados da busca
   */
  const clearResults = useCallback(() => {
    setSearchResults({});
    setStatusMessage('');
    setIsLoading(false);
    setSearchTerm('');
    setSelectedField('');
    setSearchAllStores(false);
  }, []);

  /**
   * Verifica se a pesquisa pode ser executada
   */
  const canSearch = useCallback(() => {
    const hasStore = selectedStore || searchAllStores;
    const hasTable = selectedTable;
    const hasField = selectedField;
    const hasTerm = searchTerm.trim();

    return hasStore && hasTable && hasField && hasTerm;
  }, [
    selectedStore,
    searchAllStores,
    selectedTable,
    selectedField,
    searchTerm,
  ]);

  // Inicia a escuta quando o componente é montado
  useEffect(() => {
    startListeningForAnswers();
    return () => stopListeningForAnswers();
  }, [startListeningForAnswers, stopListeningForAnswers]);

  // Carrega lojas online quando o serviço está disponível
  useEffect(() => {
    if (managementServiceRef.current) {
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
    selectedTable,
    selectedField,
    searchTerm,
    searchAllStores,

    // Ações
    setSelectedStore,
    setSelectedField,
    setSearchTerm,
    setSearchAllStores,
    executeSearch,
    clearResults,
    loadOnlineStores,

    // Utilitários
    canSearch: canSearch(),
    hasResults: Object.keys(searchResults).length > 0,
    totalStores: onlineStores.length,
  };
};
