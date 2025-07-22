// electron-preload.js - Script preload para expor APIs do Electron de forma segura

const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs do Electron para o renderer process de forma segura
contextBridge.exposeInMainWorld('electronAPI', {
  // Alertas urgentes
  triggerUrgentAlert: (alertText) =>
    ipcRenderer.invoke('trigger-urgent-alert', alertText),
  stopShaking: () => ipcRenderer.invoke('stop-shaking'),
  systemBeep: () => ipcRenderer.invoke('system-beep'),

  // Áudio
  getAudioData: (fileName) => ipcRenderer.invoke('get-audio-data', fileName),

  // Consultas Firebird
  queryFirebird: (config, searchTerm) =>
    ipcRenderer.invoke('query-firebird', config, searchTerm),
  queryTableFirebird: (config, tableName, fieldName, searchValue) =>
    ipcRenderer.invoke(
      'query-table-firebird',
      config,
      tableName,
      fieldName,
      searchValue,
    ),

  // Janelas
  openStockWindow: () => ipcRenderer.invoke('open-stock-window'),
  openManagementWindow: () => ipcRenderer.invoke('open-management-window'),

  // Dialogs
  showErrorDialog: (title, content) =>
    ipcRenderer.invoke('show-error-dialog', title, content),
  showConfirmDialog: (title, content) =>
    ipcRenderer.invoke('show-confirm-dialog', title, content),

  // Navegação (para receber comandos do processo principal)
  onNavigateTo: (callback) => {
    ipcRenderer.on('navigate-to', (event, route) => callback(route));
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Log para debug
console.log('[PRELOAD] APIs do Electron expostas com sucesso');
