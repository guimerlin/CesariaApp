import express from 'express';
import Firebird from 'node-firebird';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';
import fs from 'fs/promises';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PASSW = "Jk$8@zL!v9qY7#pW"
const app = express();
let resultado;

app.use(express.json());

/*
 * CREDENCIAIS DO BANCO DE DADOS FIREBIRD
 */

const pool = Firebird.pool(5, {
  host: 'localhost',
  port: 3050,
  database: 'C:\\MAGNO SYSTEM\\PHARMAGNO\\SISGEMP.FDB',
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: false, // Opcional
  role: null, // Opcional
  pageSize: 4096, // Opcional
  blobAsText: true,
});
// -------------------------------------------------

/*
 * FUNÇÃO GLOBAL PARA REALIZAR A QUERY SQL NO BANCO DE DADOS, A
 * FUNÇÃO FILTRA RESULTADOS QUE RETORNAM STREAMS PARA QUE A QUERY
 * FUNCIONE CORRETAMENTE
 */

/**
 * Executa uma query no banco de dados Firebird utilizando um pool de conexões.
 * Com a opção 'blobAsText', a função fica muito mais simples, pois não é mais
 * necessário tratar streams manualmente.
 *
 * @param {string} sql - A instrução SQL a ser executada.
 * @param {Array<any>} [params=[]] - Os parâmetros para a query.
 * @returns {Promise<any>} - Retorna o resultado da query.
 * @throws {Error} - Lança um erro detalhado se a conexão ou a query falharem.
 */
async function FQuery(sql, params = []) {
  let connection;

  try {
    // --- PASSO 2: Obter uma conexão do pool ---
    connection = await new Promise((resolve, reject) => {
      pool.get((err, db) => {
        if (err) return reject(err);
        resolve(db);
      });
    });

    // --- PASSO 3: Executar a query ---
    // A query agora retorna o resultado diretamente com as colunas de texto já convertidas.
    const result = await new Promise((resolve, reject) => {
      connection.query(sql, params, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    return result;
  } catch (error) {
    // --- Tratamento de Erros Centralizado ---
    console.error(
      `[FQuery DATABASE ERROR] SQL: "${sql}" | Params: ${JSON.stringify(params)} | Error: ${error.message}`,
    );
    throw new Error('Falha ao executar a operação no banco de dados.');
  } finally {
    // --- PASSO 4: Liberar a conexão de volta para o pool ---
    if (connection) {
      connection.detach();
    }
  }
}

/*
VERIFICA SE O PRODUTO EXISTE NO ESTOQUE LOCAL E RETORNA O RESULTADO DA PESQUIA
COM TODOS OS PRODUTOS ENCONTRADOS E TODOS OS CAMPOS DOS PRODUTOS.
*/

async function verifyProduct(Produto) {
  const queryVerificacao = 'SELECT * FROM PRODUTOS WHERE CODIGO = ?';
  const resultadoVerificacao = await FQuery(queryVerificacao, [Produto.CODIGO]);

  if (resultadoVerificacao.length > 0) {
    return {
      status: 200,
      success: true,
      message: `O produto com o código ${Produto.CODIGO} já existe.`,
      data: resultadoVerificacao,
    };
  }
  return {
    status: 404,
    success: false,
    message: 'Produto não encontrado.',
    data: resultadoVerificacao,
  };
}

/*
CADASTRA UM PRODUTO NA LOJA, SEMPRE DEVE SER CHAMADO COM UM OBJETO COMPLETO
DO PRODUTO, CONTENDO TODOS OS CAMPOS DE CADASTRO DO PRODUTO. 
*/

async function cadastro(Produto) {
  try {
    /*
    VERIFICAR SE O PRODUTO JÁ TEM CADASTRO
    */

    const Verification = await verifyProduct(Produto);
    if (Verification.success) return Verification;

    /*
    SE NÃO EXISTIR, PROSSEGUIR COM O CADASTRO
    */

    Produto.ESTOQUEATUAL = 0;

    const colunas = Object.keys(Produto);
    const valores = Object.values(Produto);

    const placeholders = colunas.map(() => '?').join(', ');

    const queryCadastro = `INSERT INTO PRODUTOS (${colunas.join(
      ', ',
    )}) VALUES (${placeholders})`;

    const RespQuery = await FQuery(queryCadastro, valores);

    return {
      status: 201,
      success: true,
      message: `Produto ${Produto.CODIGO} cadastrado com sucesso.`,
      data: RespQuery,
    };
  } catch (error) {
    return {
      status: error.status || 500,
      success: false,
      message: error.message || 'Erro interno do servidor.',
    };
  }
}

/*
ATUALIZA O ESTOQUE LOCAL DE UM PRODUTO PARA A QUANTIDADE INFORMADA,
NÃO REALIZA O CADASTRO AUTOMATICAMENTE, SE O PRODUTO NÃO EXISTIR
NO ESTOQUE, RETORNA UM ERRO 404 DE PRODUTO NÃO ENCONTRADO.
*/

async function atualizarEstoque(Produto, quantity) {
  const codigoProduto = Produto.CODIGO;
  try {
    /*
    VERIFICAR SE O PRODUTO JÁ EXISTE NO ESTOQUE DA LOJA
    */

    const Verification = await verifyProduct(Produto);
    if (!Verification.success) return Verification;

    /*
    VERIFICAR SE A QUANTIDADE INFORMADA JÁ ESTÁ NO ESTOQUE ANTES DE INSERIR AS MODIFICAÇÕES NO SISTEMA DA LOJA.
    */

    if (Verification.data[0].ESTOQUEATUAL === quantity)
      return {
        status: 409,
        success: false,
        message: 'A quantidade informada já está no estoque.',
      };

    /*
    REALIZAR A ATUALIZAÇÃO DO ESTOQUE
    */

    const query = `EXECUTE PROCEDURE PROC_ALTERAESTOQUE (?, ?, ?, ?, NULL)`;
    const params = [codigoProduto, quantity, 1, `CesariaApp`];
    resultado = await FQuery(query, params);
    return {
      status: 200,
      success: true,
      message: 'Estoque atualizado com sucesso.',
      data: resultado,
    };
  } catch (error) {
    return {
      status: error.status || 500,
      success: false,
      message: error.message || 'Erro interno do servidor.',
    };
  }
}

/*
 * INICIAR O SERVIDOR UTILIZANDO A FUNÇÃO STARTSERVER
 */

function startServer(PORT, mainWindow, alertFunctions) {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'endpoint.html'));
  });

  app.get('/icon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'icon.ico'));
  });

  app.get('/alert/start', async (req, res) => {
    alertFunctions.startSoundAlert();
    res.status(200).json({ success: true, message: 'Alerta enviado com sucesso.'})
  });

  app.get('/alert/stop', async (req, res) => {
    alertFunctions.stopSoundAlert();
    res.status(200).json({ success: true, message: 'Alerta parado com sucesso.'})
  });

  /*
  BUSCA DETALHADA POR PRODUTOS POR CODIGO OU NOME
  */

  app.get('/produto/info/:searchTerm', async (req, res) => {
    try {
      const { searchTerm } = req.params;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'O termo de busca não foi fornecido.',
        });
      }

      const query = `
        SELECT 
          *
        FROM PRODUTOS 
        WHERE (UPPER(PRODUTO) CONTAINING ? OR UPPER(CODIGO) CONTAINING ?)
        ORDER BY PRODUTO
      `;
      const params = [searchTerm.toUpperCase(), searchTerm.toUpperCase()];

      const resultado = await FQuery(query, params);

      if (!resultado || resultado.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: 'Nenhum produto encontrado.' });
      }

      res.json({ success: true, data: resultado });
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Erro interno do servidor.',
      });
    }
  });

  //--------------------------------------------------------------------

  /*
  BUSCA SIMPLES POR PRODUTOS COM ESTOQUE MAIOR QUE 0
  */

  app.get('/produto/:searchTerm', async (req, res) => {
    try {
      const { searchTerm } = req.params;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'O termo de busca não foi fornecido.',
        });
      }

      const query = `
        SELECT 
          CODIGO,
          PRODUTO,
          APRESENTACAO,
          ESTOQUEATUAL,
          PRECOCUSTO,
          PRECOVENDA
        FROM PRODUTOS 
        WHERE (UPPER(PRODUTO) CONTAINING ? OR UPPER(CODIGO) CONTAINING ?)
        AND ESTOQUEATUAL > 0
        ORDER BY PRODUTO
      `;
      const params = [searchTerm.toUpperCase(), searchTerm.toUpperCase()];
      const resultado = await FQuery(query, params);

      if (!resultado || resultado.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum produto encontrado com o termo informado.',
        });
      }

      res.json({ success: true, data: resultado });
    } catch (error) {
      console.error('Erro ao buscar produto com estoque:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Erro interno do servidor.',
      });
    }
  });

  //----------------------------------------------------------------------

  /*
  BUSCA POR SALDO E DIVIDA DE CLIENTES QUE TEM DEBITOS PENDENTES
  NO BANCO DE DADOS DA LOJA.
  */

  app.post('/cliente/convenio', async (req, res) => {
    try {
      const { searchTerm, password } = req.body;

      if (password !== PASSW) {
        return res.status(401).json({
          success: false,
          message: 'Senha de acesso inválida.',
        });
      }

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'O termo de busca não foi fornecido.',
        });
      }

      const query = `SELECT
  c.NOME,
  c.CIC AS DOCUMENTO,
  c.MATRICULA,
  conv.NOME AS CONVENIO,
  c.BLOQUEIACLIENTE AS BLOQUEIO,
  c.LIMITEDECOMPRA AS LIMITE,
  CAST(
    '{' || LIST(
      '"' || pc.CODIGOVENDA || '": {' ||
        '"vencimento": "' || pc.VENCIMENTO || '", ' ||
        '"descricao": "' || pc.DESCRICAO || '", ' ||
        '"valor": ' || pc.VALOR || ', ' ||
        '"multa": ' || pc.MULTA || ', ' ||
        '"valor_pago": ' || pc.VALORPAGO || ', ' ||
        '"valor_restante": ' || pc.VALORRESTANTE || ', ' ||
        '"itens": ' || COALESCE((
            SELECT '[' || LIST(
              CASE WHEN vcf2.CANCELAMENTO IS NULL THEN
                '{"produto": "' || vcf2.PRODUTO || '", "valor_total": ' || vcf2.PRECOTOTAL || ', "codigo": "' || vcf2.CODIGOPRODUTO || '"}'
              END, ', '
            ) || ']'
            FROM VENDAS_CONVERTIDA_FP vcf2
            WHERE vcf2.VENDA = pc.CODIGOVENDA
            GROUP BY vcf2.VENDA
        ), '[]') ||
      '}'
    , ', ') || '}'
  AS VARCHAR(8191)) AS VENDAS,
  CASE WHEN sc.SOMAVALOR < 0 THEN sc.SOMAMULTA + sc.SOMAVALOR ELSE sc.SOMAVALOR END AS TOTALGASTO,
  CASE WHEN sc.SOMAVALOR < 0 THEN 0 ELSE sc.SOMAMULTA END AS MULTA,
  CASE WHEN sc.SOMAVALOR <= 0 THEN c.LIMITEDECOMPRA - (sc.SOMAMULTA + sc.SOMAVALOR) ELSE c.LIMITEDECOMPRA - sc.SOMAVALOR END AS DISPONIVEL
FROM PARCELADECOMPRA pc
LEFT JOIN CLIENTES c ON pc.CODIGOCLIENTE = c.CODIGO
LEFT JOIN (
    SELECT
        pc2.CODIGOCLIENTE,
        SUM(pc2.VALOR - pc2.VALORPAGO) AS SOMAVALOR,
        SUM(pc2.MULTA) AS SOMAMULTA
    FROM PARCELADECOMPRA pc2
    WHERE pc2.VALORRESTANTE <> 0.00
    GROUP BY pc2.CODIGOCLIENTE
) sc ON pc.CODIGOCLIENTE = sc.CODIGOCLIENTE
LEFT JOIN CONVENIOS conv ON c.CONVENIOS = conv.CODIGO
WHERE UPPER(c.NOME) CONTAINING UPPER(?)
  AND pc.VALORRESTANTE <> 0.00
GROUP BY
  pc.CODIGOCLIENTE,
  c.NOME,
  c.MATRICULA,
  conv.NOME,
  c.BLOQUEIACLIENTE,
  c.LIMITEDECOMPRA,
  c.NOME,
  c.CIC,
  sc.SOMAVALOR,
  sc.SOMAMULTA
ORDER BY c.NOME;`;
      const params = [searchTerm.toUpperCase()];
      const resultado = await FQuery(query, params);

      if (!resultado || resultado.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Nenhum convênio encontrado com o termo informado.',
        });
      }

      res.json({ success: true, data: resultado });
    } catch (error) {
      console.error('Erro ao buscar convênio:', error);
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Erro interno do servidor.',
      });
    }
  });

  // -------------------------------------------------------------------------

  /*

  ENDPOINT PARA ATUALIZAÇÃO DE QUANTIDADE DE UM PRODUTO EM ESTOQUE.

  IMPORTANTE: ESTE ENDPOINT NÃO REALIZA O CADASTRO DO PRODUTO, CASO
  O PRODUTO NÃO TENHA CADASTRO, ELE DEVE SER REALIZADO NO ENDPOINT
  DE CADASTRO DE PRODUTOS COM AS ESPECIFICAÇÕES COMPLETAS DO PRODUTO.

  */

  app.post('/update/produto', async (req, res) => {
    try {
      /*
      PEGA O CORPO DA REQUISIÇÃO
      */

      const ProductData = req.body;
      const codigoProduto = ProductData.BARCODE;
      const quantity = ProductData.QUANTITY;
      const senha = ProductData.PASSWORD;
      const userCode = ProductData.USERCODE;

      /*
      VALIDAR CORPO DA REQUISIÇÃO
      */

      if (!userCode || !senha || !codigoProduto || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios no corpo da requisição',
        });
      }

      /*
      VERIFICAR CREDENCIAIS DO UTILIZADOR
      */

      if (senha !== PASSW)
        return res
          .status(401)
          .json({ success: false, message: 'Senha inválida.' });

      /*
      VERIFICAR SE O PRODUTO JÁ EXISTE NO ESTOQUE DA LOJA
      */

      const sql = 'SELECT ESTOQUEATUAL FROM PRODUTOS WHERE CODIGO = ?';
      const Result = await FQuery(sql, [codigoProduto]);
      if (Result.length === 0)
        return res
          .status(404)
          .json({ success: false, message: 'Produto não encontrado.' });

      /*
      VERIFICAR SE A QUANTIDADE INFORMADA JÁ ESTÁ NO ESTOQUE ANTES DE INSERIR AS MODIFICAÇÕES NO SISTEMA DA LOJA.
      */

      if (Result[0].ESTOQUEATUAL === quantity)
        return res.status(409).json({
          success: false,
          message: 'A quantidade informada já está no estoque.',
        });

      /*
      REALIZAR A ATUALIZAÇÃO DO ESTOQUE
      */

      const query = `EXECUTE PROCEDURE PROC_ALTERAESTOQUE (?, ?, ?, ?, NULL)`;
      const params = [codigoProduto, quantity, 1, `CesariaApp`];
      resultado = await FQuery(query, params);
      res.status(200).json({
        success: true,
        message: 'Estoque atualizado com sucesso.',
        data: resultado,
      });
    } catch (error) {
      // O catch agora serve como uma segurança extra para outros tipos de erro
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Erro interno do servidor.',
      });
    }
  });

  //------------------------------------------------------------------------

  /*
   * ENDPOINT PARA CADASTRO DE PRODUTOS CASO NÃO HAJA
   */

  app.post('/produto/cadastro', async (req, res) => {
    try {
      /*
      PEGA O CORPO DA REQUISIÇÃO
      */

      const produtoData = req.body;
      const Produto = produtoData.PRODUCT;
      const senha = produtoData.PASSWORD;
      const userCode = produtoData.USERCODE;

      /*
      VALIDAR CORPO DA REQUISIÇÃO
      */

      if (!userCode || !senha || !Produto) {
        res.json({
          success: false,
          message: 'Todos os campos são obrigatórios no corpo da requisição',
        });
      }

      /*
      VERIFICAR CREDENCIAIS DO UTILIZADOR
      */

      if (senha !== PASSW)
        return res
          .status(401)
          .json({ success: false, message: 'Senha inválida.' });

      /*
      VERIFICAR SE O PRODUTO JÁ TEM CADASTRO
      */

      const queryVerificacao = 'SELECT 1 FROM PRODUTOS WHERE CODIGO = ?';
      const resultadoVerificacao = await FQuery(queryVerificacao, [
        Produto.CODIGO,
      ]);

      if (resultadoVerificacao.length > 0) {
        return res.status(409).json({
          success: false,
          message: `O produto com o código ${Produto.CODIGO} já existe.`,
          data: resultadoVerificacao,
        });
      }

      /*
      SE NÃO EXISTIR, PROSSEGUIR COM O CADASTRO
      */

      Produto.ESTOQUEATUAL = 0;

      const colunas = Object.keys(Produto);
      const valores = Object.values(Produto);

      const placeholders = colunas.map(() => '?').join(', ');

      const queryCadastro = `INSERT INTO PRODUTOS (${colunas.join(
        ', ',
      )}) VALUES (${placeholders})`;

      const RespQuery = await FQuery(queryCadastro, valores);

      res.status(201).json({
        success: true,
        message: `Produto ${Produto.CODIGO} cadastrado com sucesso.`,
        data: RespQuery,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Erro interno do servidor.',
      });
    }
  });

  //------------------------------------------------------------------------

  /*
  CRIA UMA SOLICITAÇÃO DE TRANSFERENCIA DE PRODUTO
  */

  app.post('/request', (req, res) => {
    const { code, name, amount, storeId, password } = req.body;

    if (!code || !name || !amount || !storeId || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }

    if (password !== PASSW) {
      return res
        .status(401)
        .json({ success: false, message: 'Senha inválida.' });
    }

    console.log('Solicitação de produto recebida:\n', {
      code,
      name,
      amount,
      storeId,
    });

    openRequestModal(mainWindow, req.body);

    res.status(200).json({
      success: true,
      message: 'Solicitação de produto recebida com sucesso.',
    });
  });

  //----------------------------------------------------------------------

  /*
  RECEBE UMA RESPOSTA DE REQUISIÇÃO E MOSTRA AS INFORMAÇÕES NA TELA
  */

  app.post('/request/response', (req, res) => {
    const { code, name, amount, storeId, password, status, message } = req.body;

    if (
      !code ||
      !name ||
      !amount ||
      !storeId ||
      !password ||
      !status ||
      !message
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }

    if (password !== PASSW) {
      return res
        .status(401)
        .json({ success: false, message: 'Senha inválida.' });
    }

    console.log(
      '[SERVER DEBUG] Resposta de solicitação de produto recebida:\n',
      {
        status,
        message,
      },
    );

    // Call the function to open the modal in the renderer process
    console.log('Chamando Modal de Resposta de Requisição');
    openRequestResponseModal(mainWindow, req.body);

    res.status(200).json({
      success: true,
      message: 'resposta de solicitação recebida com sucesso.',
    });
  });

  /*
  SOLICITA A TRANSFERENCIA DO PRODUTO, CASO NÃO TENHA CADASTRO, CRIA ELE E ADICIONA
  A QUANTIDADE INFORMADA EM ESTOQUE, RETORNA UMA RESPOSTA DE SUCESSO QUE FAZ COM
  QUE O APP PROSSIGA COM A ATUALIZAÇÃO DE ESTOQUE DA LOJA QUE ENVIOU A TRANSFERENCIA.
  */

  app.post('/transfer', async (req, res) => {
    const { product, amount, storeId, password } = req.body;

    if (!product || !amount || !storeId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios.',
      });
    }

    if (password !== PASSW) {
      return res
        .status(401)
        .json({ success: false, message: 'Senha inválida.' });
    }

    /*
    NESSE CASO AMOUNT É O TANTO QUE SERÁ ADICIONADO, E NÃO O VALOR FINAL
    */

    const emEstoque = await verifyProduct(product);
    if (!emEstoque.success) {
      res.status(500).json({
        success: false,
        message: 'Erro ao determinar estoque local.',
        data: emEstoque,
      });
    };

    const novaQuantidade = emEstoque.data[0].ESTOQUEATUAL + amount;

    try {
      let upStock = await atualizarEstoque(product, novaQuantidade);
      if (!upStock.success) {
        const cadatroProduto = await cadastro(product);
        if (!cadatroProduto.success) {
          throw new Error(cadatroProduto.message);
        }
        upStock = await atualizarEstoque(product, novaQuantidade);
        if (!upStock.success) {
          throw new Error(upStock.message);
        }
      }
      res.status(200).json({
        success: true,
        message: 'Transferência realizada com sucesso.',
        data: upStock,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro interno do servidor',
        data: error,
      });
    }
  });

  /*
  INICIA A ESCUTA DO SERVIDOR NA PORTA DEFINIDA
  */

  app.listen(PORT, () => {
    console.log('Servidor Rodando');
    // Example: Send a message to the renderer process when the server starts
    if (mainWindow) {
      mainWindow.webContents.send(
        'server-started',
        `Servidor Express rodando na porta ${PORT}`,
      );
    }
  });

  function openRequestResponseModal(mainWindow, data) {
    if (mainWindow) {
      mainWindow.webContents.send('open-request-response-modal', { ...data });
    } else {
      console.error('Mainwindow não está definido.');
    }
  }

  function openRequestModal(mainWindow, data) {
    if (mainWindow) {
      mainWindow.webContents.send('open-request-modal', { ...data });
      alertFunctions.startSoundAlert();
    } else {
      console.error('MainWindow não está definido.');
    }
  }
}

export default startServer;
