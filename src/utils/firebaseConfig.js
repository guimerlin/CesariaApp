// firebaseConfig.js - Configuração centralizada do Firebase para React

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

/**
 * Configuração do Firebase Realtime Database
 * Esta configuração é compartilhada entre todas as páginas do aplicativo
 */
const firebaseConfig = {
  apiKey: "AIzaSyDWeRJ13Q081DMgS_TmpIryjweJvOl18yY",
  authDomain: "cesaria-app.firebaseapp.com",
  projectId: "cesaria-app",
  storageBucket: "cesaria-app.firebasestorage.app",
  messagingSenderId: "394158532304",
  appId: "1:394158532304:web:d60381c46527d8e1cc60d5"
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
