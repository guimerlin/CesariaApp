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
  const [selectedField, setSelectedField] = useState('NOMECLIENTE');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchAllStores, setSearchAllStores] = useState(true);
  const [selectedConvenio, setSelectedConvenio] = useState('');

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
        console.log('[MANAGEMENT SEARCH] Novos resultados recebidos:', newResults);
        console.log('[MANAGEMENT SEARCH] Número de lojas com resultados:', Object.keys(newResults).length);
        
        setSearchResults((prevResults) => {
          const updatedResults = { ...prevResults };

          Object.entries(newResults).forEach(([storeId, items]) => {
            console.log(`[MANAGEMENT SEARCH] Processando loja ${storeId} com ${items.length} itens`);
            if (!updatedResults[storeId]) {
              updatedResults[storeId] = [];
            }
            updatedResults[storeId].push(...items);
          });

          console.log('[MANAGEMENT SEARCH] Resultados atualizados:', updatedResults);
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
   * Executa a pesquisa de tabela (agora sempre usando DADOSPREVENDA)
   */
  const executeSearch = useCallback(async () => {
    if (!managementServiceRef.current || !searchTerm.trim()) {
      setStatusMessage('Preencha o termo de busca');
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
          'DADOSPREVENDA',
          'NOMECLIENTE', // campo padrão para busca
          searchTerm,
          selectedConvenio,
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
          'DADOSPREVENDA',
          'NOMECLIENTE',
          searchTerm,
          selectedConvenio,
        );
        setStatusMessage(`Solicitação enviada para ${selectedStore}`);
      }
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
    searchTerm,
    onlineStores,
    isLoading,
    searchResults,
    selectedConvenio
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
    selectedConvenio,

    // Ações
    setSelectedStore,
    setSelectedField,
    setSearchTerm,
    setSearchAllStores,
    executeSearch,
    clearResults,
    loadOnlineStores,
    setSelectedConvenio,

    // Utilitários
    canSearch: canSearch(),
    hasResults: Object.keys(searchResults).length > 0,
    totalStores: onlineStores.length,
  };
};
