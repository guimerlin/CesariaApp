// utils/firebirdConfig.js

/**
 * Configuração padrão do Firebird
 */
export const getDefaultFirebirdConfig = () => ({
  host: '192.168.18.28',
  port: '3050',
  database: '/var/lib/firebird/3.0/data/Pharmagno_RESTAURADO.fdb',
  user: 'SYSDBA',
  password: 'gui',
  charset: 'UTF8',
});

/**
 * Obtém a configuração do Firebird do localStorage
 */
export const getFirebirdConfig = () => {
  try {
    const saved = localStorage.getItem('firebirdConfig');
    if (saved) {
      return { ...getDefaultFirebirdConfig(), ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Erro ao carregar configuração do Firebird:', error);
  }
  return getDefaultFirebirdConfig();
};

/**
 * Salva a configuração do Firebird no localStorage
 */
export const saveFirebirdConfig = (config) => {
  try {
    localStorage.setItem('firebirdConfig', JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Erro ao salvar configuração do Firebird:', error);
    return false;
  }
};

/**
 * Valida a configuração do Firebird
 */
export const validateFirebirdConfig = (config) => {
  const required = ['host', 'port', 'database', 'user', 'password'];
  const missing = required.filter(
    (field) => !config[field] || String(config[field]).trim() === '',
  );

  return {
    isValid: missing.length === 0,
    missingFields: missing,
  };
};
