// hooks/useTableStructures.jsx
import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar estruturas de tabelas e campos conhecidos
 */
export const useTableStructures = () => {
  // Lista de tabelas disponíveis (baseada na análise do banco)
  const availableTables = ["DADOSPREVENDA", "CLIENTES"];

  // Estruturas de campos conhecidas para as principais tabelas
  const knownTableStructures = {
    DADOSPREVENDA: [
      "VALORTOTAL",
      "DATA", 
      "HORA",
      "NOMECLIENTE",
      "CONSOLIDADA",
      "CANCELADA",
      "TIPO",
      "CONVENIO",
      "DOCUMENTOCLIENTE",
      "NUMEROCLIENTE",
      "VALORENTRADA"
    ],
    CLIENTES: [
      "CODIGO",
      "NOME", 
      "CPF"
    ]
  };

  /**
   * Obtém os campos disponíveis para uma tabela específica
   */
  const getTableFields = useCallback((tableName) => {
    return knownTableStructures[tableName] || [];
  }, []);

  /**
   * Verifica se uma tabela é conhecida
   */
  const isKnownTable = useCallback((tableName) => {
    return availableTables.includes(tableName);
  }, []);

  /**
   * Obtém todas as tabelas disponíveis
   */
  const getAllTables = useCallback(() => {
    return [...availableTables];
  }, []);

  /**
   * Verifica se um campo existe em uma tabela específica
   */
  const hasField = useCallback((tableName, fieldName) => {
    const fields = knownTableStructures[tableName] || [];
    return fields.includes(fieldName);
  }, []);

  return {
    availableTables,
    knownTableStructures,
    getTableFields,
    isKnownTable,
    getAllTables,
    hasField
  };
};

