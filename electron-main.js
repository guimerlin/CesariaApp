////////////////////// COMPORTAMENTO DA JANELA DO APP E FUNÇÕES EXPOSTAS DE USO EXTERNO /////////////////

////////// IMPORTAÇÕES

import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Tray,
  Menu,
  net,
} from 'electron';

import fs from 'node:fs';
// import Firebird from 'node-firebird';
import path from 'path';
import { fileURLToPath } from 'url';
import APIStart from './server.js';

// --- CÓDIGO NOVO PARA ATUALIZAÇÃO AUTOMÁTICA ---
// A importação foi corrigida para o formato padrão do 'electron-updater'
// em um contexto de ES Module, para evitar o 'TypeError'.
import log from 'electron-log';
import electronUpdaterPkg from 'electron-updater';
const autoUpdater = electronUpdaterPkg.autoUpdater;
// --- FIM DO CÓDIGO NOVO ---

///////////////////////

/////////// DEIFIÇÕES DE VARIAVEIS

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

const defaultConfigFile = {
  useAppShake: true,
  usetray: true,
  showAppName: true,
  instanceLock: true,
  awaysClose: false,
  shakeIntervalTime: 50,
  shakeTimeout: null,
  shakeIntensity: 4,
  openWithSystem: true,
  showDevMenu: false,
};

let mainWindow;
let tray = null;
let isShaking = false;
let shakeInterval;
let configFile = {};
let configPath;
let originalBounds;

////////////////////////////////////

// --- CÓDIGO NOVO PARA ATUALIZAÇÃO AUTOMÁTICA ---
// Configura o logger para autoUpdater
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = true; // Baixa a atualização automaticamente
autoUpdater.autoInstallOnAppQuit = true; // Instala quando o app é fechado

if (isDev) {
  autoUpdater.forceDevUpdateConfig = true;
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'guimerlin',
    repo: 'cesariaapp',
    private: false,
  });
}
// --- FIM DO CÓDIGO PARA ATUALIZAÇÃO AUTOMÁTICA ---

////////// CARREGA O ARQUIVO DE CONFIGURAÇÕES GLOBAIS

function loadConfig() {
  if (isDev) {
    configPath = path.join(__dirname, 'config.json');
  } else {
    configPath = path.join(process.resourcesPath, 'config.json');
  }

  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, 'utf8');
      if (data) {
        configFile = JSON.parse(data);
      } else {
        console.warn('[CONFIG] Arquivo de configuração vazio. Usando padrão.');
        configFile = defaultConfigFile;
      }
      console.log('[CONFIG] Configurações carregadas:', configFile);
    } catch (error) {
      configFile = defaultConfigFile;
      console.error('[CONFIG] Erro ao carregar configurações:', error);
    }
  } else {
    configFile = defaultConfigFile;
    console.warn('[CONFIG] Arquivo de configuração não encontrado.');
  }
}

loadConfig();

function STARTAPI() {
  if (!configFile.useAPI) return;
  APIStart(3000, mainWindow, { startSoundAlert, stopSoundAlert });
}

////////////////////////////////////

////////// BLOQUEIO DE INSTANCIA UNICA

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock && configFile.instanceLock) {
  app.quit();
} else if (configFile.instanceLock) {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore(); // RESTAURA DA MINIMIZAÇÃO
      if (!mainWindow.isVisible()) mainWindow.show(); // MOSTRA A JANELA SE ESTIVER NA BANDEJA
      mainWindow.focus(); // FOCA A JANELA
    }
  });
}

/////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////// CRIAR JANELA PRINCIPAL //////////////////////////////////////////////

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
    icon: path.join(__dirname, 'assets', 'cesaria.ico'),
    show: false,
    titleBarStyle: 'default',
  });

  if (!configFile.showDevMenu) {
    mainWindow.setMenu(null);
  }

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

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////// FECHAMENTO DE JANELA ///////////////////////////////////////////

  mainWindow.on('close', (event) => {
    if (!app.isQuitting && !configFile.awaysClose) {
      event.preventDefault();
      mainWindow.hide();
    } else if (configFile.awaysClose || !configFile.usetray) {
      app.isQuitting = true;
      app.quit();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////// NAVEGAÇÃO DE PAGINAS ////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// CONFIGURAÇÕES DA TRAY /////////////////////////////////////////////////

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'cesaria.ico');
  tray = new Tray(iconPath);

  // Define o template base do menu
  let menuTemplate = [
    {
      label: 'Abrir',
      click: () => {
        mainWindow.show();
      },
    },
    { type: 'separator' },
    {
      label: 'Forçar Atualização da Página',
      click: () => {
        if (mainWindow) {
          mainWindow.reload();
        }
      },
    },
    {
      label: 'Opções de Desenvolvedor',
      click: () => {
        if (mainWindow) {
          console.log('[TRAY] Abrindo DevTools via tray.');
          mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ];

  // Adiciona os itens da API no início do menu se a opção estiver ativa
  if (configFile.useAPI) {
    menuTemplate.unshift(
      { label: 'API Rodando', enabled: false },
      { type: 'separator' },
    );
  }

  // CLIQUE DIREITO
  const contextMenu = Menu.buildFromTemplate(menuTemplate);

  tray.setToolTip('Cesaria App em Execução!');
  tray.setContextMenu(contextMenu);

  // CLIQUE ESQUERDO
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// TREMOR DA TELA ////////////////////////////////////////////////////

function shakeWindow() {
  if (!mainWindow || isShaking || !configFile.useAppShake) return;

  isShaking = true;

  originalBounds = mainWindow.getBounds(); // LIMITES DE TAMANHO DA JANELA

  shakeInterval = setInterval(() => {
    if (mainWindow && originalBounds) {
      const offsetX = Math.round(
        Math.random() * configFile.shakeIntensity * 2 -
          configFile.shakeIntensity,
      );
      const offsetY = Math.round(
        Math.random() * configFile.shakeIntensity * 2 -
          configFile.shakeIntensity,
      );

      // Define os novos limites, mantendo a largura e altura originais.
      // Isso previne qualquer efeito de zoom ou redimensionamento.
      mainWindow.setBounds({
        x: originalBounds.x + offsetX,
        y: originalBounds.y + offsetY,
        width: originalBounds.width,
        height: originalBounds.height,
      });
    }
  }, configFile.shakeIntervalTime);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////// PARAR TREMOR ////////////////////////////////////////////////////

function stopShaking() {
  if (!isShaking || !mainWindow) return;

  isShaking = false;
  clearInterval(shakeInterval);
  shakeInterval = null;

  if (originalBounds) {
    // Restaura os limites originais da janela de forma instantânea.
    mainWindow.setBounds(originalBounds);
    originalBounds = null;
  }
  mainWindow.setAlwaysOnTop(false);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// TRAZER PARA FRENTE /////////////////////////////////////////////

function bringToFront() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    setTimeout(() => {
      mainWindow.setAlwaysOnTop(false);
    }, 500); // Remove o alwaysOnTop depois de meio segundo
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// FUNÇÕES DE ALERTA SONORO /////////////////////////////////////////

function startSoundAlert() {
  console.log('[ELECTRON] Alerta sonoro iniciado.');
  bringToFront();
  if (mainWindow) {
    mainWindow.webContents.send('play-audio-loop');
  }
}

function stopSoundAlert() {
  console.log('[ELECTRON] Alerta sonoro parado.');
  if (mainWindow) {
    mainWindow.webContents.send('stop-audio-loop');
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////// LISTENERS DE EVENTOS DO ELECTRON //////////////////////////////////////////////

//////////////////////////////////////////////////////// QUANDO O APP CARREGAR

app.whenReady().then(() => {
  createWindow();
  if (configFile.usetray) {
    createTray(); // Cria a bandeja assim que o app estiver pronto.
  }
  loadConfig(); // Carrega as configurações globais

  if (!isDev && configFile.openWithSystem) {
    // FAZ O APP INICIAR COM O SISTEMA
    app.setLoginItemSettings({
      openAtLogin: true, // Habilita a inicialização automática
      path: app.getPath('exe'),
      args: ['--hidden'],
    });
  }

  // --- CÓDIGO NOVO PARA ATUALIZAÇÃO AUTOMÁTICA ---
  const updatePendingFlagPath = path.join(
    app.getPath('userData'),
    'update-pending.flag',
  );

  // Verifica se há atualizações disponíveis
  autoUpdater.checkForUpdatesAndNotify();

  // Eventos para notificar o usuário
  autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update-available');
  });

  autoUpdater.on('update-downloaded', () => {
    fs.writeFileSync(updatePendingFlagPath, 'true');
    mainWindow.webContents.send('update-downloaded');
  });

  ipcMain.on('restart-app', () => {
    if (fs.existsSync(updatePendingFlagPath)) {
      fs.unlinkSync(updatePendingFlagPath);
    }
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (err) => {
    log.error('Erro na atualização:', err);
    dialog.showMessageBox({
      title: 'Erro na atualização',
      message: `Ocorreu um erro ao tentar atualizar o aplicativo: ${err.message}`,
    });
  });
  // --- FIM DO CÓDIGO NOVO ---

  // Ouve pelo evento 'app-ready' da interface para verificar se há uma atualização pendente
  ipcMain.on('app-ready', () => {
    const updatePendingFlagPath = path.join(
      app.getPath('userData'),
      'update-pending.flag',
    );
    STARTAPI();
    if (fs.existsSync(updatePendingFlagPath)) {
      mainWindow.webContents.send('update-pending');
    }
  });
});

/////////////////////////////////////////////////////// QUANDO FECHA O APP

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/////////////////////////////////////////////////////// COMPATIBILIDADE COM O MAC
////////////////// VERIFICA SE A JANELA ESTÁ ATIVA, E CRIA UMA NOVA SE NÃO HOUVER

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

/////////////////////////////////////////////////////// FUNÇÕES EXPOSTAS / IPC
//////////////////////////////////////////////////////////////////////////////

// Expõe Configurações globais.

ipcMain.handle('get-config', () => {
  return configFile;
});

ipcMain.handle('fetch-url', async (event, url, options) => {
  return new Promise((resolve, reject) => {
    const request = net.request({ ...options, url });
    let body = '';

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        body += chunk.toString();
      });

      response.on('end', () => {
        try {
          // Tenta fazer o parse do JSON, mas se não for um JSON válido, retorna o corpo como texto
          const json = JSON.parse(body);
          resolve({ success: true, data: json });
        } catch (error) {
          // Se o corpo não for um JSON válido, resolve com o corpo de texto simples
          resolve({ success: true, data: body });
        }
      });

      response.on('error', (error) => {
        console.error('[ELECTRON] Erro na resposta da requisição:', error);
        reject({ success: false, error: error.message });
      });
    });

    request.on('error', (error) => {
      console.error('[ELECTRON] Erro na requisição:', error);
      reject({ success: false, error: error.message });
    });

    // Escreve o corpo da requisição se ele existir
    if (options && options.body) {
      request.write(options.body);
    }

    request.end();
  });
});

///////////////////////////////////////////////////////////////////////////////

// DISPARA O ALERTA  URGENTE

ipcMain.handle('trigger-urgent-alert', async (event, alertText) => {
  console.log('[ELECTRON] Alerta urgente recebido:', alertText);
  bringToFront();
  shakeWindow();
  return { success: true };
});

///////////////////////////////////////////////////////////////////////////////

// PARA O TREMOR DA TELA

ipcMain.handle('stop-shaking', async () => {
  console.log('[ELECTRON] Parando tremor da janela e restaurando estado.');
  stopShaking();
  return { success: true };
});

///////////////////////////////////////////////////////////////////////////////

// TOCA O BEEP DO SISTEMA /// USADO SE O AUDIO NÃO FOR ENCONTRADO

ipcMain.handle('system-beep', async () => {
  shell.beep();
  return { success: true };
});

// DISPARA O ALERTA SONORO
ipcMain.handle('start-sound-alert', async () => {
  startSoundAlert();
  return { success: true };
});

// PARA O ALERTA SONORO
ipcMain.handle('stop-sound-alert', async () => {
  stopSoundAlert();
  return { success: true };
});

////////////////////////////////////////////////////////////////////////////////

// CARREGA O AUDIO DE NOTIFICAÇÃO

ipcMain.handle('get-audio-data', async (event, fileName) => {
  try {
    const audioPath = path.join(__dirname, 'assets', fileName);
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

///////////////////////////////////////////////////////////////////////////////////

// FAZ UMA CONSULTA AO BANCO DE DADOS FIREBIRD

// ipcMain.handle('query-firebird', async (event, config, searchTerm) => {
//   try {
//     console.log('[ELECTRON] Consulta Firebird real:', { config, searchTerm });

//     const options = {
//       host: config.host,
//       port: parseInt(config.port),
//       database: config.database,
//       user: config.user,
//       password: config.password,
//       lowercase_keys: false,
//     };

//     return new Promise((resolve, reject) => {
//       Firebird.attach(options, function (err, db) {
//         if (err) {
//           console.error('[ELECTRON] Erro ao conectar ao Firebird:', err);
//           return reject({ success: false, error: err.message });
//         }

//         // Consulta SQL para buscar produtos por nome ou código
//         const sql = `
//           SELECT
//             CODIGO,
//             PRODUTO,
//             APRESENTACAO,
//             ESTOQUEATUAL,
//             PRECOCUSTO,
//             PRECOVENDA
//           FROM PRODUTOS
//           WHERE (UPPER(PRODUTO) CONTAINING UPPER(?) OR UPPER(CODIGO) CONTAINING UPPER(?))
//           AND ESTOQUEATUAL > 0
//           ORDER BY PRODUTO
//         `;

//         db.query(sql, [searchTerm, searchTerm], function (err, result) {
//           db.detach(); // SEMPRE DESCONECTA APÓS A QUERY
//           if (err) {
//             console.error('[ELECTRON] Erro ao executar query Firebird:', err);
//             return reject({ success: false, error: err.message });
//           }
//           console.log('[ELECTRON] Resultados da consulta Firebird:', result);
//           resolve({ success: true, data: result });
//         });
//       });
//     });
//   } catch (error) {
//     console.error('[ELECTRON] Erro geral na consulta Firebird:', error);
//     return { success: false, error: error.message };
//   }
// });

///////////////////////////////////////////////////////////////////////////////////////

// FAZ CONSULTAS DE TABELA AO BANCO DE DADOS FIREBIRD LOCAL

// ipcMain.handle(
//   'query-table-firebird',
//   async (event, config, tableName, fieldName, searchValue, limitDate) => {
//     try {
//       console.log(
//         '[ELECTRON] Executando consulta tabela Firebird real (Gerenciamento):',
//       );
//       console.log('  Config:', config);
//       console.log('  Tabela:', tableName);
//       console.log('  Campo:', fieldName);
//       console.log('  Valor:', searchValue);
//       console.log('  Data:', limitDate);

//       const options = {
//         host: config.host,
//         port: parseInt(config.port),
//         database: config.database,
//         user: config.user,
//         password: config.password,
//         lowercase_keys: false,
//       };

//       return new Promise((resolve, reject) => {
//         Firebird.attach(options, function (err, db) {
//           if (err) {
//             console.error(
//               '[ELECTRON] Erro ao conectar à tabela Firebird (Gerenciamento):',
//             );
//             console.error(err);
//             return resolve({ success: false, error: err.message });
//           }

//           let sql = '';
//           let params = [];

//           switch (tableName.toUpperCase()) {
//             case 'DADOSPREVENDA':
//               sql = `SELECT
//   c.NOME,
//   c.CIC AS DOCUMENTO,
//   c.MATRICULA,
//   conv.NOME AS CONVENIO,
//   c.BLOQUEIACLIENTE AS BLOQUEIO,
//   c.LIMITEDECOMPRA AS LIMITE,
//   CAST(
//     '{' || LIST(
//       '"' || pc.CODIGOVENDA || '": {' ||
//         '"vencimento": "' || pc.VENCIMENTO || '", ' ||
//         '"descricao": "' || pc.DESCRICAO || '", ' ||
//         '"valor": ' || pc.VALOR || ', ' ||
//         '"multa": ' || pc.MULTA || ', ' ||
//         '"valor_pago": ' || pc.VALORPAGO || ', ' ||
//         '"valor_restante": ' || pc.VALORRESTANTE || ', ' ||
//         '"itens": ' || COALESCE((
//             SELECT '[' || LIST(
//               CASE WHEN vcf2.CANCELAMENTO IS NULL THEN
//                 '{"produto": "' || vcf2.PRODUTO || '", "valor_total": ' || vcf2.PRECOTOTAL || ', "codigo": "' || vcf2.CODIGOPRODUTO || '"}'
//               END, ', '
//             ) || ']'
//             FROM VENDAS_CONVERTIDA_FP vcf2
//             WHERE vcf2.VENDA = pc.CODIGOVENDA
//             GROUP BY vcf2.VENDA
//         ), '[]') ||
//       '}'
//     , ', ') || '}'
//   AS VARCHAR(8191)) AS VENDAS,
//   CASE WHEN sc.SOMAVALOR < 0 THEN sc.SOMAMULTA + sc.SOMAVALOR ELSE sc.SOMAVALOR END AS TOTALGASTO,
//   CASE WHEN sc.SOMAVALOR < 0 THEN 0 ELSE sc.SOMAMULTA END AS MULTA,
//   CASE WHEN sc.SOMAVALOR <= 0 THEN c.LIMITEDECOMPRA - (sc.SOMAMULTA + sc.SOMAVALOR) ELSE c.LIMITEDECOMPRA - sc.SOMAVALOR END AS DISPONIVEL
// FROM PARCELADECOMPRA pc
// LEFT JOIN CLIENTES c ON pc.CODIGOCLiente = c.CODIGO
// LEFT JOIN (
//     SELECT
//         pc2.CODIGOCLIENTE,
//         SUM(pc2.VALOR - pc2.VALORPAGO) AS SOMAVALOR,
//         SUM(pc2.MULTA) AS SOMAMULTA
//     FROM PARCELADECOMPRA pc2
//     WHERE pc2.VALORRESTANTE <> 0.00
//     GROUP BY pc2.CODIGOCLIENTE
// ) sc ON pc.CODIGOCLIENTE = sc.CODIGOCLIENTE
// LEFT JOIN CONVENIOS conv ON c.CONVENIOS = conv.CODIGO
// WHERE UPPER(c.NOME) CONTAINING UPPER(?)
//   AND pc.VALORRESTANTE <> 0.00
// GROUP BY
//   pc.CODIGOCLIENTE,
//   c.NOME,
//   c.MATRICULA,
//   conv.NOME,
//   c.BLOQUEIACLIENTE,
//   c.LIMITEDECOMPRA,
//   c.NOME,
//   c.CIC,
//   sc.SOMAVALOR,
//   sc.SOMAMULTA
// ORDER BY c.NOME;`;
//               params = [searchValue];
//               break;
//             case 'CLIENTES':
//               sql = `SELECT
//               C.NOME,
//               C.CIC AS DOCUMENTO,
//               CV.NOME AS CONVENIO,
//               C.MATRICULA,
//               C.BLOQUEIACLIENTE AS BLOQUEIO,
//               C.LIMITEDECOMPRA AS LIMITE
//               FROM
//               CLIENTES C
//               LEFT JOIN
//               CONVENIOS CV ON C.CONVENIOS = CV.CODIGO
//               WHERE
//               UPPER(C.${fieldName}) CONTAINING UPPER(?)`;
//               params = [searchValue];
//               break;
//             case 'PARCELADECOMPRA':
//               sql = `SELECT CODIGOCLIENTE
//                    , CODIGOVENDA
//                    , VENCIMENTO
//                    , DESCRICAO
//                    , VALOR
//                    , MULTA
//                    , VALORPAGO
//                    , VALORRESTANTE
//               FROM PARCELADECOMPRA
//               WHERE CODIGOCLIENTE = ?
//               AND VALORRESTANTE <> 0.00`;
//               params = [searchValue];
//               break;
//             case 'VENDAS_CONVERTIDA_FP':
//               sql = `SELECT VENDA
//               , DATA
//               , HORA
//               , CODIGOCLIENTE
//               , CODIGOPRODUTO
//               , PRODUTO
//               , QUANTIDADE
//               , UNIDADE
//               , PRECOUNITARIO
//               , SUBTOTAL
//               , DESCONTO
//               , PRECOTOTAL
//               , ATENDENTE
//               FROM VENDAS_CONVERTIDA_FP
//               WHERE VENDA = ?
//               AND CANCELAMENTO IS NULL`;
//               params = [searchValue];
//               break;

//             default:
//               sql = `SELECT * FROM ${tableName} WHERE UPPER(${fieldName}) CONTAINING UPPER(?)`;
//               params = [searchValue];
//               break;
//           }

//           if (!sql) {
//             db.detach();
//             return resolve({
//               success: false,
//               error: 'Tabela ou campo não suportado.',
//             });
//           }

//           db.query(sql, params, function (err, result) {
//             db.detach();
//             if (err) { // TRATAR ERROS DE CONSULTA
//               console.error(
//                 '[ELECTRON] Erro ao executar query de tabela Firebird (Gerenciamento):',
//               );
//               console.error(err);
//               console.debug(sql);
//               console.debug(params);
//               return resolve({ success: false, error: err.message });
//             }

//             console.log(
//               '[ELECTRON] Resultados da consulta de tabela Firebird (Gerenciamento):',
//             );
//             console.log(result);
//             console.debug(params);

//             // FORMATAR DATA DOS RESULTADOS

//             try {
//               const safeData = JSON.parse(JSON.stringify(result));
//               resolve({ success: true, data: safeData });
//             } catch (e) {
//               console.error(
//                 '[ELECTRON] Falha ao serializar os dados do resultado:',
//                 e,
//               );
//               resolve({
//                 success: false,
//                 error: 'Falha ao processar os dados.',
//               });
//             }
//             // =========================================================
//           });
//         });
//       });
//     } catch (error) {
//       console.error(
//         '[ELECTRON] Erro geral na consulta de tabela Firebird (Gerenciamento):',
//       );
//       console.error(error);
//       return { success: false, error: error.message };
//     }
//   },
// );

////////////////////////////////////////////////////////////////////////////////////////

// ABRIR JANELA DE ESTOQUE

ipcMain.handle('open-stock-window', async () => {
  console.log('[ELECTRON] Abrindo janela de estoque');
  if (mainWindow) {
    mainWindow.webContents.send('navigate-to', '/stock');
  }
  return { success: true };
});

// ABRIR JANELA DE BUSCA DE CONVENIO
ipcMain.handle('open-management-window', async () => {
  console.log('[ELECTRON] Abrindo janela de gerenciamento');
  if (mainWindow) {
    mainWindow.webContents.send('navigate-to', '/management');
  }
  return { success: true };
});

// MOSTRAR DIALOGOS DE ERRO NOS LOGS DE CONSOLE

ipcMain.handle('show-error-dialog', async (event, title, content) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'error',
    title: title,
    message: content,
    buttons: ['OK'],
  });
  return result;
});

// MOSTRAR DIALOGOS DE CONFIRMAÇÃO NOS LOGS DE CONSOLE

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

// TRATAR ERROS NÃO CAPTURADOS

process.on('uncaughtException', (error) => {
  console.error('[ELECTRON] Erro não capturado:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[ELECTRON] Promise rejeitada não tratada:', reason);
});

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////
('');
