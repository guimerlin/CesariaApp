// services/firebirdService.js
import { getFirebirdConfig } from '../utils/firebirdConfig.js';

export class FirebirdService {
  constructor() {
    this.config = getFirebirdConfig();
  }

  /**
   * Atualiza a configuração do Firebird
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Executa uma consulta no Firebird via Electron API
   */
  async executeQuery(sql, params = []) {
    if (!window.electronAPI || !window.electronAPI.queryFirebird) {
      throw new Error('API do Electron não disponível');
    }

    try {
      const result = await window.electronAPI.queryFirebird(this.config, sql, params);
      return result;
    } catch (error) {
      console.error('Erro ao executar consulta no Firebird:', error);
      throw error;
    }
  }

  /**
   * Consulta produtos por nome
   */
  async searchProducts(searchTerm) {
    const sql = `
      SELECT 
        CODIGO,
        PRODUTO,
        ESTOQUEATUAL,
        PRECOCUSTO,
        PRECOVENDA
      FROM PRODUTOS 
      WHERE UPPER(PRODUTO) CONTAINING UPPER(?)
      AND ESTOQUEATUAL > 0
      ORDER BY PRODUTO
    `;
    
    return this.executeQuery(sql, [searchTerm]);
  }

  /**
   * Consulta produto por código
   */
  async getProductByCode(codigo) {
    const sql = `
      SELECT 
        CODIGO,
        PRODUTO,
        ESTOQUEATUAL,
        PRECOCUSTO,
        PRECOVENDA
      FROM PRODUTOS 
      WHERE CODIGO = ?
    `;
    
    return this.executeQuery(sql, [codigo]);
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
  async updateStock(codigo, novoEstoque) {
    const sql = `
      UPDATE PRODUTOS 
      SET ESTOQUEATUAL = ? 
      WHERE CODIGO = ?
    `;
    
    return this.executeQuery(sql, [novoEstoque, codigo]);
  }

  /**
   * Insere um novo produto
   */
  async insertProduct(productData) {
    const sql = `
      INSERT INTO PRODUTOS (
        CODIGO, 
        PRODUTO, 
        ESTOQUEATUAL, 
        PRECOCUSTO, 
        PRECOVENDA
      ) VALUES (?, ?, ?, ?, ?)
    `;
    
    const params = [
      productData.codigo,
      productData.produto,
      productData.estoque || 0,
      productData.precoCusto || 0,
      productData.precoVenda || 0
    ];
    
    return this.executeQuery(sql, params);
  }

  /**
   * Registra uma movimentação de estoque
   */
  async registerStockMovement(codigo, quantidade, tipo, observacao = '') {
    const sql = `
      INSERT INTO MOVIMENTACAO_ESTOQUE (
        CODIGO_PRODUTO,
        QUANTIDADE,
        TIPO_MOVIMENTO,
        DATA_MOVIMENTO,
        OBSERVACAO
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
    `;
    
    return this.executeQuery(sql, [codigo, quantidade, tipo, observacao]);
  }

  /**
   * Consulta histórico de movimentações
   */
  async getStockHistory(codigo, limit = 50) {
    const sql = `
      SELECT 
        m.CODIGO_PRODUTO,
        m.QUANTIDADE,
        m.TIPO_MOVIMENTO,
        m.DATA_MOVIMENTO,
        m.OBSERVACAO,
        p.PRODUTO
      FROM MOVIMENTACAO_ESTOQUE m
      LEFT JOIN PRODUTOS p ON p.CODIGO = m.CODIGO_PRODUTO
      WHERE m.CODIGO_PRODUTO = ?
      ORDER BY m.DATA_MOVIMENTO DESC
      ROWS ?
    `;
    
    return this.executeQuery(sql, [codigo, limit]);
  }

  /**
   * Verifica conexão com o banco
   */
  async testConnection() {
    try {
      const result = await this.executeQuery('SELECT 1 FROM RDB$DATABASE');
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
    const sql = `
      SELECT 
        COUNT(*) as TOTAL_PRODUTOS
      FROM PRODUTOS
    `;
    
    return this.executeQuery(sql);
  }

  /**
   * Backup de dados (exporta produtos para JSON)
   */
  async exportProducts() {
    const sql = `
      SELECT 
        CODIGO,
        PRODUTO,
        ESTOQUEATUAL,
        PRECOCUSTO,
        PRECOVENDA
      FROM PRODUTOS
      ORDER BY CODIGO
    `;
    
    return this.executeQuery(sql);
  }
}

