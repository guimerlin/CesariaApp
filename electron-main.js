/////////////////////////////////////////////////////////////////////////////////////////////////////////
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
} from 'electron';

import fs from 'node:fs';
import Firebird from 'node-firebird';
import path from 'path';
import { fileURLToPath } from 'url';

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

/////////////////////////////////////

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

  // CLIQUE DIREITO
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir',
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: 'Configurar Firebird',
      click: () => {
        if (mainWindow) {
          console.log('[TRAY] Abrindo modal de configuração do Firebird via tray.');
          mainWindow.webContents.send('onOpenFirebirdConfig');
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
    {
      label: 'Sair',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Cesaria App em Execução!');
  tray.setContextMenu(contextMenu);

  // CLIQUE ESQUERDO
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus(); // <--- Adicione isso!
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

ipcMain.handle('query-firebird', async (event, config, searchTerm) => {
  try {
    console.log('[ELECTRON] Consulta Firebird real:', { config, searchTerm });

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
          console.error('[ELECTRON] Erro ao conectar ao Firebird:', err);
          return reject({ success: false, error: err.message });
        }

        // Consulta SQL para buscar produtos por nome ou código
        const sql = `
          SELECT 
            CODIGO,
            PRODUTO,
            ESTOQUEATUAL,
            PRECOCUSTO,
            PRECOVENDA
          FROM PRODUTOS 
          WHERE (UPPER(PRODUTO) CONTAINING UPPER(?) OR UPPER(CODIGO) CONTAINING UPPER(?))
          AND ESTOQUEATUAL > 0
          ORDER BY PRODUTO
        `;

        db.query(sql, [searchTerm, searchTerm], function (err, result) {
          db.detach(); // SEMPRE DESCONECTA APÓS A QUERY
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

///////////////////////////////////////////////////////////////////////////////////////

// FAZ CONSULTAS DE TABELA AO BANCO DE DADOS FIREBIRD LOCAL

ipcMain.handle(
  'query-table-firebird',
  async (event, config, tableName, fieldName, searchValue, limitDate) => {
    try {
      console.log(
        '[ELECTRON] Executando consulta tabela Firebird real (Gerenciamento):',
      );
      console.log('  Config:', config);
      console.log('  Tabela:', tableName);
      console.log('  Campo:', fieldName);
      console.log('  Valor:', searchValue);
      console.log('  Data:', limitDate);

      // CALCULAR A DATA DO CONVENIO
      const calculateDate = (limitDate) => {
        const diaFormatado = String(limitDate).padStart(2, '0');
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth() + 1;
        const diaAtual = hoje.getDate();

        if (diaAtual >= limitDate) {
          const mesFormatado = String(mesAtual).padStart(2, '0');
          return `${anoAtual}-${mesFormatado}-${diaFormatado}`;
        } else {
          let anoInicio = anoAtual;
          let mesInicio = mesAtual - 1;
          if (mesInicio < 1) {
            mesInicio = 12;
            anoInicio -= 1;
          }
          const mesFormatado = String(mesInicio).padStart(2, '0');
          return `${anoInicio}-${mesFormatado}-${diaFormatado}`;
      }}



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
              sql = `
SELECT
	  D.NOMECLIENTE,
	  CL.MATRICULA,
	  CL.BLOQUEIACLIENTE AS BLOQUEIO,
    SUM(D.VALORTOTAL) AS TOTALGASTO,
    CL.LIMITEDECOMPRA - SUM(D.VALORTOTAL) AS DISPONIVEL,
    C.NOME,
    D.DOCUMENTOCLIENTE,
    CL.CIC,
    CL.LIMITEDECOMPRA AS LIMITE
FROM
    DADOSPREVENDA D
LEFT JOIN
    CONVENIOS C ON D.CONVENIO  = C.CODIGO
LEFT JOIN
	  CLIENTES CL ON D.NOMECLIENTE = CL.NOME
WHERE
    UPPER(D.NOMECLIENTE) CONTAINING UPPER(?)
    AND D.DATA > ?
    AND D.CANCELADA = 'N'
    AND D.TIPO = 'PRAZO'
GROUP BY
	  D.NOMECLIENTE,
	  C.NOME,
	  D.DOCUMENTOCLIENTE,
	  CL.CIC,
	  CL.LIMITEDECOMPRA,
	  CL.MATRICULA,
	  CL.BLOQUEIACLIENTE;
              `;
              params = [searchValue, calculateDate(limitDate)];
              break;
            case 'CLIENTES':
              sql = `SELECT
              C.NOME,
              C.CIC AS DOCUMENTO,
              CV.NOME AS CONVENIO,
              C.MATRICULA,
              C.BLOQUEIACLIENTE AS BLOQUEIO,
              C.LIMITEDECOMPRA AS LIMITE
              FROM
              CLIENTES C
              LEFT JOIN
              CONVENIOS CV ON C.CONVENIOS = CV.CODIGO
              WHERE
              UPPER(C.${fieldName}) CONTAINING UPPER(?)`;
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
              console.debug(sql);
              console.debug(params);
              return resolve({ success: false, error: err.message });
            }
            console.log(
              '[ELECTRON] Resultados da consulta de tabela Firebird (Gerenciamento):',
            );
            console.log(result);
            console.debug(sql);
            console.debug(params);


            // FORMATAR DATA DOS RESULTADOS

            try {
              const safeData = JSON.parse(JSON.stringify(result));
              resolve({ success: true, data: safeData });
            } catch (e) {
              console.error(
                '[ELECTRON] Falha ao serializar os dados do resultado:',
                e,
              );
              resolve({
                success: false,
                error: 'Falha ao processar os dados.',
              });
            }
            // =========================================================
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
