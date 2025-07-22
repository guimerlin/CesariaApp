// electron-main.js - Processo principal do Electron para Cesaria Chat

import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Tray,
  Menu,
} from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'node:fs';
import Firebird from 'node-firebird';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

let mainWindow;
let tray = null; // Variável para guardar a instância da bandeja
let isShaking = false;
let shakeInterval;
let originalPosition; // Guarda a posição original da janela
let shakeTimeout; // Guarda o timeout para parar o tremor

// --- INÍCIO: BLOQUEIO DE INSTÂNCIA ÚNICA ---
// Garante que apenas uma instância do aplicativo seja executada.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Se não conseguir o bloqueio, significa que outra instância já está em execução, então encerramos esta.
  app.quit();
} else {
  // Se for a primeira instância, configuramos um listener para tentativas de abrir uma segunda.
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Alguém tentou executar uma segunda instância. Devemos focar nossa janela.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore(); // Se estiver minimizada, restaura.
      if (!mainWindow.isVisible()) mainWindow.show(); // Se estiver invisível (na bandeja), mostra.
      mainWindow.focus(); // Foca a janela.
    }
  });
}
// --- FIM: BLOQUEIO DE INSTÂNCIA ÚNICA ---

// Função para criar a janela principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'electron-preload.js'),
    },
    icon: path.join(__dirname, 'src', 'assets', 'cesaria.ico'),
    show: false,
    titleBarStyle: 'default',
  });

  // mainWindow.setMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (mainWindow) {
      mainWindow.focus();
    }
  });

  // --- INÍCIO: MODIFICAÇÃO DO EVENTO DE FECHAMENTO ---
  // Intercepta o evento de fechar a janela.
  mainWindow.on('close', (event) => {
    // Se a flag 'isQuitting' não for verdadeira, previne o fechamento padrão.
    if (!app.isQuitting) {
      event.preventDefault();
      // Em vez de fechar, apenas esconde a janela. O app continuará rodando na bandeja.
      mainWindow.hide();
    }
    // Se 'isQuitting' for true, o evento de fechamento prossegue normalmente.
  });
  // --- FIM: MODIFICAÇÃO DO EVENTO DE FECHAMENTO ---

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (
      parsedUrl.origin !== 'http://localhost:5173' &&
      parsedUrl.origin !== 'file://'
    ) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
}

// --- INÍCIO: FUNÇÃO PARA CRIAR A BANDEJA (TRAY) ---
function createTray() {
  const iconPath = path.join(__dirname, 'src', 'assets', 'cesaria.ico');
  tray = new Tray(iconPath);

  // Cria o menu de contexto (clique direito) para o ícone da bandeja.
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Cesaria Chat',
      click: () => {
        // Mostra a janela principal quando esta opção é clicada.
        mainWindow.show();
      },
    },
    {
      label: 'Sair',
      click: () => {
        // Define uma flag para indicar que estamos realmente saindo.
        app.isQuitting = true;
        // Chama o método para sair do aplicativo.
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Cesaria Chat está em execução.');
  tray.setContextMenu(contextMenu);

  // Define o que acontece ao clicar com o botão esquerdo no ícone da bandeja.
  tray.on('click', () => {
    // Alterna a visibilidade da janela.
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}
// --- FIM: FUNÇÃO PARA CRIAR A BANDEJA (TRAY) ---

// Função para fazer a janela tremer (alerta urgente)
function shakeWindow() {
  if (!mainWindow || isShaking) return;

  isShaking = true;
  originalPosition = mainWindow.getPosition();

  shakeInterval = setInterval(() => {
    if (mainWindow) {
      const offsetX = Math.round(Math.random() * 20 - 10);
      const offsetY = Math.round(Math.random() * 20 - 10);
      mainWindow.setPosition(
        originalPosition[0] + offsetX,
        originalPosition[1] + offsetY,
      );
    }
  }, 50);

  clearTimeout(shakeTimeout);
}

// Função para parar o tremor e restaurar o estado da janela
function stopShaking() {
  if (!isShaking || !mainWindow) return;

  isShaking = false;
  clearInterval(shakeInterval);
  clearTimeout(shakeTimeout);
  shakeInterval = null;
  shakeTimeout = null;

  if (originalPosition) {
    mainWindow.setPosition(originalPosition[0], originalPosition[1], true);
    originalPosition = null;
  }
  mainWindow.setAlwaysOnTop(false);
}

// Função para trazer janela para frente e focar
function bringToFront() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  }
}

// Event listeners do Electron
app.whenReady().then(() => {
  createWindow();
  createTray(); // Cria a bandeja assim que o app estiver pronto.
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    // No macOS, se o app estiver na bandeja e for clicado no dock, reabra a janela.
    mainWindow.show();
  }
});

// IPC Handlers - Comunicação com o renderer process (sem alterações aqui)
// ... (todo o seu código de ipcMain.handle permanece o mesmo)
// Handler para alerta urgente
ipcMain.handle('trigger-urgent-alert', async (event, alertText) => {
  console.log('[ELECTRON] Alerta urgente recebido:', alertText);
  bringToFront();
  shakeWindow();
  return { success: true };
});

// Handler para parar tremor
ipcMain.handle('stop-shaking', async () => {
  console.log('[ELECTRON] Parando tremor da janela e restaurando estado.');
  stopShaking();
  return { success: true };
});

// Handler para beep do sistema
ipcMain.handle('system-beep', async () => {
  shell.beep();
  return { success: true };
});

// Handler para carregar dados de áudio
ipcMain.handle('get-audio-data', async (event, fileName) => {
  try {
    const audioPath = path.join(__dirname, 'src', 'assets', fileName);
    if (fs.existsSync(audioPath)) {
      const audioBuffer = fs.readFileSync(audioPath);
      return audioBuffer;
    } else {
      console.warn(`[ELECTRON] Arquivo de áudio não encontrado: ${audioPath}`);
      return null;
    }
  } catch (error) {
    console.error('[ELECTRON] Erro ao carregar áudio:', error);
    return null;
  }
});

// Handler para consulta Firebird
ipcMain.handle('query-firebird', async (event, config, searchTerm) => {
  try {
    console.log('[ELECTRON] Consulta Firebird real:', { config, searchTerm });

    // Configuração de conexão com o Firebird
    const options = {
      host: config.host,
      port: parseInt(config.port),
      database: config.database,
      user: config.user,
      password: config.password,
      lowercase_keys: false, // Mantém as chaves em maiúsculas, como no Firebird
      // ... outras opções que você possa precisar
    };

    return new Promise((resolve, reject) => {
      Firebird.attach(options, function (err, db) {
        if (err) {
          console.error('[ELECTRON] Erro ao conectar ao Firebird:', err);
          return reject({ success: false, error: err.message });
        }

        // Exemplo de consulta SQL para buscar produtos por nome
        // Adapte esta query ao seu esquema de banco de dados!
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

        db.query(sql, [searchTerm], function (err, result) {
          db.detach(); // Sempre desconecte após a query
          if (err) {
            console.error('[ELECTRON] Erro ao executar query Firebird:', err);
            return reject({ success: false, error: err.message });
          }
          console.log('[ELECTRON] Resultados da consulta Firebird:', result);
          resolve({ success: true, data: result });
        });
      });
    });
  } catch (error) {
    console.error('[ELECTRON] Erro geral na consulta Firebird:', error);
    return { success: false, error: error.message };
  }
});

// Handler para consulta de tabela Firebird
ipcMain.handle(
  'query-table-firebird',
  async (event, config, tableName, fieldName, searchValue) => {
    try {
      console.log(
        '[ELECTRON] Executando consulta tabela Firebird real (Gerenciamento):',
      );
      console.log('  Config:', config);
      console.log('  Tabela:', tableName);
      console.log('  Campo:', fieldName);
      console.log('  Valor:', searchValue);

      const options = {
        host: config.host,
        port: parseInt(config.port),
        database: config.database,
        user: config.user,
        password: config.password,
        lowercase_keys: false,
      };

      return new Promise((resolve, reject) => {
        Firebird.attach(options, function (err, db) {
          if (err) {
            console.error(
              '[ELECTRON] Erro ao conectar à tabela Firebird (Gerenciamento):',
            );
            console.error(err);
            return resolve({ success: false, error: err.message });
          }

          // CUIDADO: Construir queries dinamicamente pode ser perigoso (SQL Injection).
          // Sempre use parâmetros (?) nas suas queries e deixe o driver tratar a sanitização.
          // Para tableName e fieldName, que não podem ser parametrizados, você DEVE
          // validar contra uma lista de nomes permitidos para evitar injeção.

          let sql = '';
          let params = [];

          // Exemplo de lógica para construir a query baseada na tabela e campo
          // Adapte esta lógica ao seu esquema de banco de dados!
          switch (tableName.toUpperCase()) {
            case 'DADOSPREVENDA':
              sql = `SELECT * FROM DADOSPREVENDA WHERE UPPER(${fieldName}) CONTAINING UPPER(?)`;
              params = [searchValue];
              break;
            case 'CLIENTES':
              sql = `SELECT * FROM CLIENTES WHERE UPPER(${fieldName}) CONTAINING UPPER(?)`;
              params = [searchValue];
              break;
            // Adicione outros casos para suas tabelas
            default:
              // Fallback genérico, mas com validação de campo para segurança
              const allowedFields = [
                'NOME',
                'CODIGO',
                'CPF',
                'PRODUTO',
                'VALORTOTAL',
                'DATA',
              ]; // Exemplo
              if (!allowedFields.includes(fieldName.toUpperCase())) {
                db.detach();
                return resolve({
                  success: false,
                  error: 'Campo de pesquisa não permitido.',
                });
              }
              sql = `SELECT * FROM ${tableName} WHERE UPPER(${fieldName}) CONTAINING UPPER(?)`;
              params = [searchValue];
              break;
          }

          if (!sql) {
            db.detach();
            return resolve({
              success: false,
              error: 'Tabela ou campo não suportado.',
            });
          }

          db.query(sql, params, function (err, result) {
            db.detach();
            if (err) {
              console.error(
                '[ELECTRON] Erro ao executar query de tabela Firebird (Gerenciamento):',
              );
              console.error(err);
              return resolve({ success: false, error: err.message });
            }
            console.log(
              '[ELECTRON] Resultados da consulta de tabela Firebird (Gerenciamento):',
            );
            console.log(result);
            resolve({ success: true, data: result });
          });
        });
      });
    } catch (error) {
      console.error(
        '[ELECTRON] Erro geral na consulta de tabela Firebird (Gerenciamento):',
      );
      console.error(error);
      return { success: false, error: error.message };
    }
  },
);

// Handler para abrir janela de estoque
ipcMain.handle('open-stock-window', async () => {
  console.log('[ELECTRON] Abrindo janela de estoque');
  if (mainWindow) {
    mainWindow.webContents.send('navigate-to', '/stock');
  }
  return { success: true };
});

// Handler para abrir janela de gerenciamento
ipcMain.handle('open-management-window', async () => {
  console.log('[ELECTRON] Abrindo janela de gerenciamento');
  if (mainWindow) {
    mainWindow.webContents.send('navigate-to', '/management');
  }
  return { success: true };
});

// Handler para mostrar dialog de erro
ipcMain.handle('show-error-dialog', async (event, title, content) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'error',
    title: title,
    message: content,
    buttons: ['OK'],
  });
  return result;
});

// Handler para mostrar dialog de confirmação
ipcMain.handle('show-confirm-dialog', async (event, title, content) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    title: title,
    message: content,
    buttons: ['Sim', 'Não'],
    defaultId: 0,
    cancelId: 1,
  });
  return result.response === 0;
});

// Tratamento de erros não capturadas
process.on('uncaughtException', (error) => {
  console.error('[ELECTRON] Erro não capturado:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[ELECTRON] Promise rejeitada não tratada:', reason);
});
