import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url'; // Importa a função necessária
import tailwindcss from '@tailwindcss/vite';

// Define __dirname corretamente para Módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // INÍCIO DA CORREÇÃO: Configuração de alias definitiva
  resolve: {
    alias: {
      // Define o alias '@' para apontar para o diretório 'src'
      '@': path.resolve(__dirname, './src'),
    },
  },
  // FIM DA CORREÇÃO
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  base: './', // Garante que os caminhos funcionem corretamente no Electron
});
