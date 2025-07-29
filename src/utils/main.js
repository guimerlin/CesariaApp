// main.js

const { app, BrowserWindow, ipcMain, Tray, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const Firebird = require("node-firebird"); // <-- Adicionado

// --- INÍCIO DA FUNÇÃO DE LOG PARA DEBUG ---
// ... (código de log existente)
const logDir = path.join(app.getPath("userData"), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFilePath = path.join(logDir, "app-log.txt");

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(logFilePath, logMessage);
    console.log(message);
  } catch (error) {
    console.error("Falha ao escrever no arquivo de log:", error);
  }
}
// --- FIM DA FUNÇÃO DE LOG PARA DEBUG ---

logToFile("========================================");
logToFile("Aplicação Iniciada");

let mainWindow;
let stockWindow; // <-- Adicionado para a nova janela
let managementWindow; // <-- Adicionado para a janela de gerenciamento
let tray = null;
// ... (resto das variáveis globais existentes)
let shakeIntervalId = null;
let originalWindowBounds = null;
app.isQuitting = false;

const getAssetPath = (fileName) => {
  const basePath = app.isPackaged ? process.resourcesPath : __dirname;
  return path.join(basePath, "assets", fileName);
};

// --- Função para criar a janela de consulta de estoque ---
function createStockWindow() {
  logToFile("Criando a janela de consulta de estoque...");
  if (stockWindow) {
    stockWindow.focus();
    return;
  }

  stockWindow = new BrowserWindow({
    width: 900,
    height: 700,
    parent: mainWindow,
    modal: false, // false para permitir interação com a janela principal
    icon: getAssetPath("cesaria.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"), // Reutiliza o mesmo preload
    },
  });

  stockWindow.loadFile("src/stock.html");

  stockWindow.on("closed", () => {
    logToFile("Janela de consulta de estoque fechada.");
    stockWindow = null;
  });
}

// --- Função para criar a janela de gerenciamento ---
function createManagementWindow() {
  logToFile("Criando a janela de gerenciamento...");
  if (managementWindow) {
    managementWindow.focus();
    return;
  }

  managementWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    parent: mainWindow,
    modal: false, // false para permitir interação com a janela principal
    icon: getAssetPath("cesaria.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"), // Reutiliza o mesmo preload
    },
  });

  managementWindow.loadFile("src/management.html");

  managementWindow.on("closed", () => {
    logToFile("Janela de gerenciamento fechada.");
    managementWindow = null;
  });
}

function createTray() {
  // ... (código createTray existente, sem alterações)
  logToFile("Tentando criar o ícone da bandeja (Tray)...");
  const iconName = process.platform === "win32" ? "cesaria.ico" : "cesaria.png";
  const iconPath = path.join(__dirname, "assets", iconName);
  logToFile(`Caminho do ícone da bandeja sendo usado: ${iconPath}`);

  if (!fs.existsSync(iconPath)) {
    logToFile(
      `ERRO CRÍTICO: O arquivo do ícone não foi encontrado em ${iconPath}`
    );
    return;
  }

  try {
    tray = new Tray(iconPath);
    logToFile("Ícone da bandeja (Tray) criado com sucesso.");

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Mostrar App",
        click: () => {
          logToFile("Menu da bandeja: 'Mostrar App' clicado.");
          if (mainWindow) mainWindow.show();
        },
      },
      {
        label: "Sair",
        click: () => {
          logToFile("Menu da bandeja: 'Sair' clicado. Encerrando aplicação.");
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip("AppAvisos - Comunicação Urgente");
    logToFile("Tooltip da bandeja definido.");
    tray.setContextMenu(contextMenu);
    logToFile("Menu de contexto da bandeja definido.");

    tray.on("click", () => {
      logToFile("Ícone da bandeja clicado.");
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          logToFile("Janela está visível. Escondendo janela.");
          mainWindow.hide();
        } else {
          logToFile("Janela não está visível. Mostrando janela.");
          mainWindow.show();
        }
      }
    });
  } catch (error) {
    logToFile(`ERRO CRÍTICO ao criar a bandeja: ${error.message}`);
    console.error(error);
  }
}

function createWindow() {
  // ... (código createWindow existente, sem alterações)
  logToFile("Criando a janela principal (BrowserWindow)...");
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 700,
    minHeight: 500,
    icon: getAssetPath("cesaria.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  logToFile("Janela principal criada.");

  mainWindow.loadFile("src/index.html");
  logToFile("index.html carregado na janela principal.");

  mainWindow.on("close", (event) => {
    logToFile(
      `Evento 'close' da janela disparado. app.isQuitting = ${app.isQuitting}`
    );
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      logToFile("Janela escondida em vez de fechada.");
    }
  });

  mainWindow.on("closed", () => {
    logToFile("Janela principal fechada permanentemente.");
    mainWindow = null;
  });
}

// ... (código setAutoStartup e requestSingleInstanceLock existentes)
function setAutoStartup() {
  logToFile("Configurando início automático...");
  if (process.env.NODE_ENV === "development") {
    logToFile(
      "Modo de desenvolvimento detectado. Pulando configuração de auto-start."
    );
    return;
  }
  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
    args: ["--process-start-args", `"--hidden"`],
  });
  logToFile("Início automático configurado para produção.");
}

const LIMIT_INSTANCES = false; // true = limita a 1 instância, false = permite várias

const gotTheLock = app.requestSingleInstanceLock();

if (LIMIT_INSTANCES && !gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (LIMIT_INSTANCES && mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    logToFile('Evento app "ready" recebido.');
    createWindow();
    createTray();
    setAutoStartup();

    app.on("activate", () => {
      logToFile('Evento app "activate" recebido.');
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    // --- HANDLERS IPC ---

    // Handler para abrir a janela de consulta
    ipcMain.on("open-stock-window", () => {
      logToFile(
        "[IPC][DEBUG] Recebido pedido para abrir a janela de consulta de estoque."
      );
      createStockWindow();
    });

    // Handler para abrir a janela de gerenciamento
    ipcMain.on("open-management-window", () => {
      logToFile(
        "[IPC][DEBUG] Recebido pedido para abrir a janela de gerenciamento."
      );
      createManagementWindow();
    });

    // Handler para consultar o banco de dados Firebird (estoque)
    ipcMain.handle(
      "query-firebird",
      async (event, firebirdOptions, searchTerm) => {
        if (!firebirdOptions || !searchTerm) {
          const errorMsg =
            "Opções do Firebird ou termo de busca não fornecidos.";
          logToFile(`[IPC][ERROR] ${errorMsg}`);
          return { success: false, error: errorMsg };
        }
        logToFile(
          `[IPC][DEBUG] Recebida consulta ao Firebird para: "${searchTerm}"`
        );
        return new Promise((resolve) => {
          Firebird.attach(firebirdOptions, (err, db) => {
            if (err) {
              logToFile(
                `[Firebird ERROR][DEBUG] Falha ao conectar: ${err.message}`
              );
              return resolve({ success: false, error: err.message });
            }
            const sqlQuery = `
              SELECT 
                  CODIGO,
                  PRODUTO,
                  ESTOQUEATUAL,
                  PRECOCUSTO,
                  PRECOVENDA,
                  FORNECEDOR,
                  LABORATORIO
              FROM PRODUTOS
              WHERE 
                  UPPER(PRODUTO) CONTAINING UPPER(?) OR
                  UPPER(CAST(CODIGO AS VARCHAR(20))) CONTAINING UPPER(?)
            `;
            logToFile(
              `[DEBUG] Executando query: ${sqlQuery.replace(
                /\s+/g,
                " "
              )} | Parâmetro: ${searchTerm}`
            );
            db.query(sqlQuery, [searchTerm, searchTerm], (err, result) => {
              db.detach();
              if (err) {
                logToFile(
                  `[Firebird ERROR][DEBUG] Falha na query: ${err.message}`
                );
                return resolve({ success: false, error: err.message });
              }
              const data = result && result.length > 0 ? result : null;
              logToFile(
                `[Firebird SUCCESS][DEBUG] Consulta retornou ${
                  result ? result.length : 0
                } resultados.`
              );
              resolve({ success: true, data: data });
            });
          });
        });
      }
    );

    // ===================================================================
    // CORREÇÃO APLICADA AQUI
    // Handler para consultar tabela genérica no banco de dados Firebird
    // ===================================================================
    ipcMain.handle(
      "query-table-firebird",
      async (event, firebirdOptions, tableName, fieldName, searchValue) => {
        if (!firebirdOptions || !tableName || !fieldName || !searchValue) {
          const errorMsg = "Parâmetros insuficientes para consulta de tabela.";
          logToFile(`[IPC][ERROR] ${errorMsg}`);
          return { success: false, error: errorMsg };
        }

        logToFile(
          `[IPC][DEBUG] Recebida consulta de tabela: ${tableName}.${fieldName} = "${searchValue}"`
        );

        return new Promise((resolve) => {
          Firebird.attach(firebirdOptions, (err, db) => {
            if (err) {
              logToFile(
                `[Firebird ERROR][DEBUG] Falha ao conectar: ${err.message}`
              );
              return resolve({ success: false, error: err.message });
            }

            let sqlQuery;

            // VERIFICA SE A TABELA É DADOSPREVENDA PARA USAR UMA QUERY ESPECIAL
            if (tableName.toUpperCase() === "DADOSPREVENDA") {
              logToFile(
                "[DEBUG] Tabela DADOSPREVENDA detectada. Usando query específica."
              );
              // Esta query seleciona todas as colunas necessárias e converte a DATA para texto
              sqlQuery = `
                SELECT 
                  CAST("DATA" AS VARCHAR(10)) AS "DATA", 
                  HORA,
                  TIPO,
                  NOMECLIENTE,
                  DOCUMENTOCLIENTE,
                  NUMEROCLIENTE,
                  CONVENIO,
                  VALORENTRADA,
                  VALORTOTAL,
                  CANCELADA
                FROM DADOSPREVENDA 
                WHERE UPPER(CAST(${fieldName} AS VARCHAR(255))) CONTAINING UPPER(?)`;
            } else {
              logToFile(
                `[DEBUG] Usando query genérica para a tabela: ${tableName}`
              );
              // Query genérica para as outras tabelas
              sqlQuery = `SELECT * FROM ${tableName} WHERE UPPER(CAST(${fieldName} AS VARCHAR(255))) CONTAINING UPPER(?)`;
            }

            logToFile(
              `[DEBUG] Executando query: ${sqlQuery.replace(
                /\s+/g,
                " "
              )} | Parâmetro: ${searchValue}`
            );

            db.query(sqlQuery, [searchValue], (err, result) => {
              db.detach();
              if (err) {
                logToFile(
                  `[Firebird ERROR][DEBUG] Falha na query: ${err.message}`
                );
                return resolve({ success: false, error: err.message });
              }

              const data = result && result.length > 0 ? result : [];
              logToFile(
                `[Firebird SUCCESS][DEBUG] Consulta de tabela retornou ${data.length} resultados.`
              );
              resolve({ success: true, data: data });
            });
          });
        });
      }
    );

    // Handlers IPC existentes
    ipcMain.handle("get-audio-data", (event, fileName) => {
      const assetPath = getAssetPath(fileName);
      try {
        logToFile(`[IPC] get-audio-data: Lendo arquivo de ${assetPath}`);
        return fs.readFileSync(assetPath);
      } catch (error) {
        logToFile(
          `[IPC] get-audio-data: Falha ao ler o arquivo ${assetPath}: ${error}`
        );
        return null;
      }
    });

    ipcMain.handle("get-app-path-request", () => {
      logToFile("[IPC] Pedido de appPath recebido do preload (fallback).");
      return app.getAppPath();
    });
  });
}

app.on("window-all-closed", () => {
  // ... (código existente)
  logToFile('Evento "window-all-closed" recebido.');
  if (process.platform !== "darwin") {
    logToFile("Plataforma não é macOS. Aplicação será encerrada.");
    app.quit();
  } else {
    logToFile("Plataforma é macOS. Aplicação continuará rodando.");
  }
});

// ... (código de alerta urgente e stop-shaking existentes)
ipcMain.on("trigger-urgent-alert", (event, chatName) => {
  logToFile(`[IPC] trigger-urgent-alert recebido para: ${chatName}`);
  if (mainWindow) {
    logToFile("[ALERTA] mainWindow existe. Iniciando alerta visual.");
    mainWindow.show();
    logToFile("[ALERTA] mainWindow.show() chamado.");
    mainWindow.focus();
    logToFile("[ALERTA] mainWindow.focus() chamado.");
    mainWindow.setAlwaysOnTop(true);
    logToFile("[ALERTA] mainWindow.setAlwaysOnTop(true) chamado.");
    mainWindow.flashFrame(true);
    logToFile("[ALERTA] mainWindow.flashFrame(true) chamado.");
    if (shakeIntervalId) {
      clearInterval(shakeIntervalId);
      logToFile("[ALERTA] shakeIntervalId já existia, limpo.");
    }
    originalWindowBounds = mainWindow.getBounds();
    logToFile(
      `[ALERTA] originalWindowBounds: ${JSON.stringify(originalWindowBounds)}`
    );
    const shakeMagnitude = 10;
    let isOffset = false;
    shakeIntervalId = setInterval(() => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        clearInterval(shakeIntervalId);
        logToFile("[ALERTA] mainWindow destruída durante shake.");
        return;
      }
      mainWindow.setBounds(
        isOffset
          ? originalWindowBounds
          : {
              x: originalWindowBounds.x + shakeMagnitude,
              y: originalWindowBounds.y,
              width: originalWindowBounds.width,
              height: originalWindowBounds.height,
            }
      );
      logToFile(`[ALERTA] shake: isOffset=${isOffset}`);
      isOffset = !isOffset;
    }, 80);
  } else {
    logToFile("[IPC] trigger-urgent-alert: mainWindow não existe.");
  }
});

ipcMain.on("stop-shaking", () => {
  logToFile("[IPC] stop-shaking recebido.");
  if (shakeIntervalId) {
    clearInterval(shakeIntervalId);
    logToFile("[ALERTA] shakeIntervalId limpo.");
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (originalWindowBounds) {
      mainWindow.setBounds(originalWindowBounds);
      logToFile("[ALERTA] mainWindow.setBounds(originalWindowBounds) chamado.");
    }
    mainWindow.setAlwaysOnTop(false);
    logToFile("[ALERTA] mainWindow.setAlwaysOnTop(false) chamado.");
    mainWindow.flashFrame(false);
    logToFile("[ALERTA] mainWindow.flashFrame(false) chamado.");
  }
});

const template = [
  // ...outros menus...
  {
    label: "Desenvolvedor",
    submenu: [
      {
        label: "Páginas Disponíveis",
        submenu: [
          {
            label: "Chat Principal",
            click: () => {
              if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
              }
            },
          },
          {
            label: "Consulta de Estoque",
            click: () => {
              createStockWindow();
            },
          },
          {
            label: "Gerenciamento de Tabelas",
            click: () => {
              createManagementWindow();
            },
          },
        ],
      },
      { type: "separator" },
      {
        label: "Configurar Firebird",
        click: () => {
          const win = BrowserWindow.getFocusedWindow();
          if (win) win.webContents.send("open-firebird-config");
        },
      },
      { type: "separator" },
      { role: "reload", label: "Recarregar" },
      { role: "toggledevtools", label: "DevTools" },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
