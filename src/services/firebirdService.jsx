// services/firebirdService.js
import { getFirebirdConfig } from '../utils/firebirdConfig.js';

export class FirebirdService {
  constructor() {
    this.config = getFirebirdConfig();
    console.log('[FIREBIRD] Configuração inicial:', this.config);
  }

  /**
   * Atualiza a configuração do Firebird
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }



  /**
   * Consulta produtos por nome ou código
   */
  async searchProducts(searchTerm) {
    if (!window.electronAPI || !window.electronAPI.queryFirebird) {
      throw new Error('API do Electron não disponível');
    }

    console.log('[FIREBIRD] Buscando produtos com termo:', searchTerm);
    console.log('[FIREBIRD] Configuração:', this.config);

    try {
      const result = await window.electronAPI.queryFirebird(this.config, searchTerm);
      console.log('[FIREBIRD] Resultado da busca:', result);
      return result;
    } catch (error) {
      console.error('[FIREBIRD] Erro ao buscar produtos no Firebird:', error);
      console.error('[FIREBIRD] Tipo do erro:', typeof error);
      console.error('[FIREBIRD] Mensagem do erro:', error.message);
      throw error;
    }
  }

  /**
   * Consulta produto por código
   */
  async getProductByCode(codigo) {
    if (!window.electronAPI || !window.electronAPI.queryFirebird) {
      throw new Error('API do Electron não disponível');
    }

    try {
      const result = await window.electronAPI.queryFirebird(this.config, codigo);
      return result;
    } catch (error) {
      console.error('Erro ao buscar produto por código no Firebird:', error);
      throw error;
    }
  }

  /**
   * Consulta genérica em uma tabela
   */
  async queryTable(tableName, fieldName, searchValue) {
    if (!window.electronAPI || !window.electronAPI.queryTableFirebird) {
      throw new Error('API do Electron não disponível');
    }

    try {
      const result = await window.electronAPI.queryTableFirebird(
        this.config,
        tableName,
        fieldName,
        searchValue
      );
      return result;
    } catch (error) {
      console.error('Erro ao consultar tabela no Firebird:', error);
      throw error;
    }
  }

  /**
   * Atualiza estoque de um produto
   */
  async updateStock(_codigo, _novoEstoque) {
    if (!window.electronAPI || !window.electronAPI.queryFirebird) {
      throw new Error('API do Electron não disponível');
    }

    try {
      // Por enquanto, não implementamos UPDATE via Electron
      // Esta função seria implementada quando necessário
      throw new Error('Função updateStock não implementada via Electron');
    } catch (error) {
      console.error('Erro ao atualizar estoque no Firebird:', error);
      throw error;
    }
  }

  /**
   * Insere um novo produto
   */
  async insertProduct(_productData) {
    if (!window.electronAPI || !window.electronAPI.queryFirebird) {
      throw new Error('API do Electron não disponível');
    }

    try {
      // Por enquanto, não implementamos INSERT via Electron
      // Esta função seria implementada quando necessário
      throw new Error('Função insertProduct não implementada via Electron');
    } catch (error) {
      console.error('Erro ao inserir produto no Firebird:', error);
      throw error;
    }
  }

  /**
   * Registra uma movimentação de estoque
   */
  async registerStockMovement(_codigo, _quantidade, _tipo, _observacao = '') {
    if (!window.electronAPI || !window.electronAPI.queryFirebird) {
      throw new Error('API do Electron não disponível');
    }

    try {
      // Por enquanto, não implementamos INSERT via Electron
      // Esta função seria implementada quando necessário
      throw new Error('Função registerStockMovement não implementada via Electron');
    } catch (error) {
      console.error('Erro ao registrar movimentação no Firebird:', error);
      throw error;
    }
  }

  /**
   * Consulta histórico de movimentações
   */
  async getStockHistory(_codigo, _limit = 50) {
    if (!window.electronAPI || !window.electronAPI.queryFirebird) {
      throw new Error('API do Electron não disponível');
    }

    try {
      // Por enquanto, não implementamos consultas complexas via Electron
      // Esta função seria implementada quando necessário
      throw new Error('Função getStockHistory não implementada via Electron');
    } catch (error) {
      console.error('Erro ao consultar histórico no Firebird:', error);
      throw error;
    }
  }

  /**
   * Verifica conexão com o banco
   */
  async testConnection() {
    try {
      // Testa a conexão fazendo uma busca simples
      await this.searchProducts('test');
      return { success: true, message: 'Conexão estabelecida com sucesso' };
    } catch (error) {
      return { 
        success: false, 
        message: `Erro na conexão: ${error.message}` 
      };
    }
  }

  /**
   * Obtém informações do banco
   */
  async getDatabaseInfo() {
    if (!window.electronAPI || !window.electronAPI.queryFirebird) {
      throw new Error('API do Electron não disponível');
    }

    try {
      // Por enquanto, não implementamos consultas complexas via Electron
      // Esta função seria implementada quando necessário
      throw new Error('Função getDatabaseInfo não implementada via Electron');
    } catch (error) {
      console.error('Erro ao obter informações do banco:', error);
      throw error;
    }
  }

  /**
   * Backup de dados (exporta produtos para JSON)
   */
  async exportProducts() {
    if (!window.electronAPI || !window.electronAPI.queryFirebird) {
      throw new Error('API do Electron não disponível');
    }

    try {
      // Por enquanto, não implementamos consultas complexas via Electron
      // Esta função seria implementada quando necessário
      throw new Error('Função exportProducts não implementada via Electron');
    } catch (error) {
      console.error('Erro ao exportar produtos:', error);
      throw error;
    }
  }
}

