// firebaseConfig.js - Configuração centralizada do Firebase para React

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

/**
 * Configuração do Firebase Realtime Database
 * Esta configuração é compartilhada entre todas as páginas do aplicativo
 */
const firebaseConfig = {
  apiKey: 'AIzaSyAySaQdxVmkLmC8NRpMafm_tjg3GI9F1VQ',
  authDomain: 'appavisos-6f71c.firebaseapp.com',
  databaseURL: 'https://appavisos-6f71c-default-rtdb.firebaseio.com',
  projectId: 'appavisos-6f71c',
  storageBucket: 'appavisos-6f71c.firebasestorage.app',
  messagingSenderId: '302453354750',
  appId: '1:302453354750:web:bc1f12a30691ded37f75af',
};

/**
 * Inicializa o Firebase e retorna a instância do banco de dados
 * @returns {Object} Objeto contendo app e db do Firebase
 */
export function initializeFirebase() {
  console.log('[DEBUG] Inicializando Firebase...');
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  console.log('[DEBUG] Firebase inicializado.');

  return { app, db };
}

/**
 * Configurações do aplicativo
 */
export const APP_CONFIG = {
  appId: 'default-app-id',
  basePath: 'artifacts/default-app-id/public/data',
};

// Instância global do Firebase para uso em toda a aplicação
export const { app: firebaseApp, db: firebaseDb } = initializeFirebase();
