// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Funções existentes
    triggerUrgentAlert: (chatName) => ipcRenderer.send('trigger-urgent-alert', chatName),
    stopShaking: () => ipcRenderer.send('stop-shaking'),
    getAudioData: (fileName) => ipcRenderer.invoke('get-audio-data', fileName),

    // --- Novas Funções ---
    openStockWindow: () => ipcRenderer.send('open-stock-window'),
    openManagementWindow: () => ipcRenderer.send('open-management-window'),
    queryFirebird: (options, searchTerm) => ipcRenderer.invoke('query-firebird', options, searchTerm),
    queryTableFirebird: (options, tableName, fieldName, searchValue) => ipcRenderer.invoke('query-table-firebird', options, tableName, fieldName, searchValue),
    // Novo evento para abrir o modal de configuração
    onOpenFirebirdConfig: (callback) => ipcRenderer.on('open-firebird-config', callback)
});
