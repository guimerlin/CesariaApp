// firebirdConfig.js - Configuração centralizada do Firebird para React

/**
 * Configuração padrão do Firebird
 * Estas configurações são usadas como fallback quando não há configuração salva
 */
const defaultFirebirdConfig = {
    host: "localhost",
    port: 3050,
    database: "C:\\Cesaria\\CESARIA.FDB",
    user: "SYSDBA",
    password: "masterkey",
    charset: "UTF8",
    lowercase_keys: false,
    role: null,
    pageSize: 4096,
};

/**
 * Obtém a configuração do Firebird do localStorage ou retorna a configuração padrão
 * @returns {Object} Configuração do Firebird
 */
export function getFirebirdConfig() {
    const config = {
        host: localStorage.getItem('fbHost') || defaultFirebirdConfig.host,
        port: parseInt(localStorage.getItem('fbPort') || defaultFirebirdConfig.port, 10),
        database: localStorage.getItem('fbDatabase') || defaultFirebirdConfig.database,
        user: localStorage.getItem('fbUser') || defaultFirebirdConfig.user,
        password: localStorage.getItem('fbPass') || defaultFirebirdConfig.password,
        charset: localStorage.getItem('fbCharset') || defaultFirebirdConfig.charset,
        lowercase_keys: defaultFirebirdConfig.lowercase_keys,
        role: defaultFirebirdConfig.role,
        pageSize: defaultFirebirdConfig.pageSize,
    };
    
    // Validação da porta
    if (isNaN(config.port)) {
        config.port = defaultFirebirdConfig.port;
    }
    
    return config;
}

/**
 * Salva a configuração do Firebird no localStorage
 * @param {Object} config - Configuração do Firebird a ser salva
 */
export function saveFirebirdConfig(config) {
    localStorage.setItem('fbHost', config.host);
    localStorage.setItem('fbPort', config.port);
    localStorage.setItem('fbDatabase', config.database);
    localStorage.setItem('fbUser', config.user);
    localStorage.setItem('fbPass', config.password);
    localStorage.setItem('fbCharset', config.charset);
}

/**
 * Obtém a configuração padrão do Firebird
 * @returns {Object} Configuração padrão do Firebird
 */
export function getDefaultFirebirdConfig() {
    return { ...defaultFirebirdConfig };
}

/**
 * Obtém a configuração do Firebird para uma loja específica
 * No futuro, isso pode ser expandido para suportar configurações diferentes por loja
 * @param {string} storeId - ID da loja
 * @returns {Object} Configuração do Firebird para a loja
 */
export function getFirebirdConfigForStore(_storeId) {
    // Por enquanto, retorna a configuração padrão
    // Pode ser expandido para suportar configurações específicas por loja
    return getFirebirdConfig();
}

