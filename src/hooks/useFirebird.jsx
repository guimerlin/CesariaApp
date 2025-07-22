// hooks/useFirebird.js
import { useState, useCallback, useRef } from 'react';
import { FirebirdService } from '../services/firebirdService.jsx';
import {
  getFirebirdConfig,
  saveFirebirdConfig,
} from '../utils/firebirdConfig.js';

export const useFirebird = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(getFirebirdConfig());

  const firebirdServiceRef = useRef(new FirebirdService());

  /**
   * Testa a conexão com o Firebird
   */
  const testConnection = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await firebirdServiceRef.current.testConnection();
      setIsConnected(result.success);

      if (!result.success) {
        setError(result.message);
      }

      return result;
    } catch (err) {
      const errorMessage = err.message || 'Erro desconhecido na conexão';
      setError(errorMessage);
      setIsConnected(false);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Atualiza a configuração do Firebird
   */
  const updateConfig = useCallback(
    (newConfig) => {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);
      firebirdServiceRef.current.updateConfig(updatedConfig);
      saveFirebirdConfig(updatedConfig);
    },
    [config],
  );

  /**
   * Executa uma consulta genérica
   */
  const executeQuery = useCallback(async (sql, params = []) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await firebirdServiceRef.current.executeQuery(sql, params);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao executar consulta';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Busca produtos por nome
   */
  const searchProducts = useCallback(async (searchTerm) => {
    setIsLoading(true);
    setError(null);

    try {
      const result =
        await firebirdServiceRef.current.searchProducts(searchTerm);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao buscar produtos';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Consulta produto por código
   */
  const getProductByCode = useCallback(async (codigo) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await firebirdServiceRef.current.getProductByCode(codigo);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao buscar produto';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Consulta genérica em tabela
   */
  const queryTable = useCallback(async (tableName, fieldName, searchValue) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await firebirdServiceRef.current.queryTable(
        tableName,
        fieldName,
        searchValue,
      );
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao consultar tabela';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Atualiza estoque
   */
  const updateStock = useCallback(async (codigo, novoEstoque) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await firebirdServiceRef.current.updateStock(
        codigo,
        novoEstoque,
      );
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao atualizar estoque';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obtém informações do banco
   */
  const getDatabaseInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await firebirdServiceRef.current.getDatabaseInfo();
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.message || 'Erro ao obter informações do banco';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Estado
    isConnected,
    isLoading,
    error,
    config,

    // Ações
    testConnection,
    updateConfig,
    executeQuery,
    searchProducts,
    getProductByCode,
    queryTable,
    updateStock,
    getDatabaseInfo,

    // Referência do serviço para uso avançado
    firebirdService: firebirdServiceRef.current,
  };
};
