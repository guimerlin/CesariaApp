// electron-preload.js - Script preload para expor APIs do Electron de forma segura

const { contextBridge, ipcRenderer } = require('electron');

const notifyAudio = new Audio('notify.wav'); // Carrega o áudio

// Ouve os comandos de áudio do processo principal (main)
ipcRenderer.on('play-audio-loop', () => {
  notifyAudio.loop = true;
  notifyAudio.play().catch((e) => console.error('Audio play failed:', e));
});

ipcRenderer.on('stop-audio-loop', () => {
  notifyAudio.pause();
  notifyAudio.currentTime = 0;
});

// Expõe APIs do Electron para o renderer process de forma segura
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) =>
      ipcRenderer.on(channel, (event, ...args) => func(...args)),
    removeListener: (channel, func) =>
      ipcRenderer.removeListener(channel, func),
  },
});

contextBridge.exposeInMainWorld('electronAPI', {
  // Carrega as configurações globais
  getConfig: () => ipcRenderer.invoke('get-config'),

  fetchUrl: (url, options) => ipcRenderer.invoke('fetch-url', url, options),

  // Alertas urgentes
  triggerUrgentAlert: (alertText) =>
    ipcRenderer.invoke('trigger-urgent-alert', alertText),
  stopShaking: () => ipcRenderer.invoke('stop-shaking'),
  systemBeep: () => ipcRenderer.invoke('system-beep'),
  startSoundAlert: () => ipcRenderer.invoke('start-sound-alert'),
  stopSoundAlert: () => ipcRenderer.invoke('stop-sound-alert'),

  // Áudio
  getAudioData: (fileName) => ipcRenderer.invoke('get-audio-data', fileName),

  // Funções de controle de áudio direto (se necessário)
  playAudioLoop: () => {
    notifyAudio.loop = true;
    notifyAudio.play();
  },

  stopAudioLoop: () => {
    notifyAudio.pause();
    notifyAudio.currentTime = 0;
  },

  // // Consultas Firebird
  // queryFirebird: (config, searchTerm) =>
  //   ipcRenderer.invoke('query-firebird', config, searchTerm),
  // queryTableFirebird: (config, tableName, fieldName, searchValue, limitDate) =>
  //   ipcRenderer.invoke(
  //     'query-table-firebird',
  //     config,
  //     tableName,
  //     fieldName,
  //     searchValue,
  //     limitDate,
  //   ),

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
console.log('[PRELOAD] OK');