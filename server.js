import express from 'express';
import Firebird from 'node-firebird';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PASSW = 'Jk$8@zL!v9qY7#pW';
const app = express();
let resultado;

app.use(express.json());

/*
 * CREDENCIAIS DO BANCO DE DADOS FIREBIRD
 */

const firebirdOptions = {
  host: 'localhost',
  port: 3050,
  database: 'C:\\MAGNO SYSTEM\\PHARMAGNO\\SISGEMP.FDB',
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: false, // Opcional
  role: null, // Opcional
  pageSize: 4096, // Opcional
};
// -------------------------------------------------

/*
 * FUNÇÃO GLOBAL PARA REALIZAR A QUERY SQL NO BANCO DE DADOS, A
 * FUNÇÃO FILTRA RESULTADOS QUE RETORNAM STREAMS PARA QUE A QUERY
 * FUNCIONE CORRETAMENTE
 */

function FQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    Firebird.attach(firebirdOptions, (err, db) => {
      if (err) {
        console.error('Erro de conexão com o Firebird:', err);
        // Rejeita a promessa com um objeto de erro padronizado
        return reject({
          status: 500,
          message: 'Falha ao conectar no banco de dados.',
        });
      }

      db.query(sql, params, (err, result) => {
        // Garante que a conexão seja sempre fechada
        db.detach();

        if (err) {
          console.error(`Erro ao executar a query: ${sql}`, err);
          return reject({ status: 500, message: 'Falha ao executar a query.' });
        }
        // Resolve a promessa com o resultado bem-sucedido
        resolve(result);
      });
    });
  });
}

/*
 * INICIAR O SERVIDOR UTILIZANDO A FUNÇÃO STARTSERVER
 */

function startServer(PORT, mainWindow) {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'endpoint.html'));
  });

  app.get('/icon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'icon.ico'));
  });

  /*
  BUSCA DETALHADA POR PRODUTOS POR CODIGO OU NOME
  */

  app.get('/produto/info/:searchTerm', async (req, res) => {
    const searchTerm = req.params.searchTerm;

    if (!searchTerm) return res.send('Termo de Busca Inválido');

    const query = `
          SELECT 
            *
          FROM PRODUTOS 
          WHERE (UPPER(PRODUTO) CONTAINING UPPER(?) OR UPPER(CODIGO) CONTAINING UPPER(?))
          ORDER BY PRODUTO
        `;
    const params = [searchTerm.toUpperCase(), searchTerm.toUpperCase()];

    resultado = await FQuery(query, params);

    if (resultado.length === 0) return res.status(404).json({error: true});

    res.json(resultado);
  });

  //--------------------------------------------------------------------

  /*
  BUSCA SIMPLES POR PRODUTOS COM ESTOQUE MAIOR QUE 0
  */

  app.get('/produto/:searchTerm', async (req, res) => {
    const searchTerm = req.params.searchTerm;

    if (!searchTerm) return res.send('Termo de Busca Inválido');

    const query = `
          SELECT 
            CODIGO,
            PRODUTO,
            APRESENTACAO,
            ESTOQUEATUAL,
            PRECOCUSTO,
            PRECOVENDA
          FROM PRODUTOS 
          WHERE (UPPER(PRODUTO) CONTAINING UPPER(?) OR UPPER(CODIGO) CONTAINING UPPER(?))
          AND ESTOQUEATUAL > 0
          ORDER BY PRODUTO
        `;
    const params = [searchTerm.toUpperCase(), searchTerm.toUpperCase()];
    resultado = await FQuery(query, params);

    if (resultado.length === 0)
      return res
        .status(404)
        .json({ message: 'Nenhum produto encontrado com o termo informado.' });

    let codigoProduto = 7896181916826,
      nomeProduto = 'Risperidona',
      quantidade = 1,
      storeId = 'Parque Pinheiros';

    openRequestModal(
      mainWindow,
      codigoProduto,
      nomeProduto,
      quantidade,
      storeId,
    );
    res.json(resultado);
  });

  //----------------------------------------------------------------------

  /*
  BUSCA POR SALDO E DIVIDA DE CLIENTES QUE TEM DEBITOS PENDENTES
  NO BANCO DE DADOS DA LOJA.
  */

  app.get('/convenio/:searchTerm/:password', async (req, res) => {
    const searchTerm = req.params.searchTerm;
    const password = req.params.password;

    if (password !== PASSW)
      return res.status(401).json({
        error: 'Senha Inválida',
        succes: false,
        message: 'Senha Inválida',
      });

    const query = `SELECT
  c.NOME,
  c.CIC AS DOCUMENTO,
  c.MATRICULA,
  conv.NOME AS CONVENIO,
  c.BLOQUEIACLIENTE AS BLOQUEIO,
  c.LIMITEDECOMPRA AS LIMITE,
  CAST(
    '{' || LIST(
      '"' || pc.CODIGOVENDA || '": {
        "vencimento": "' || pc.VENCIMENTO || '", 
        "descricao": "' || pc.DESCRICAO || '", 
        "valor": ' || pc.VALOR || ', 
        "multa": ' || pc.MULTA || ', 
        "valor_pago": ' || pc.VALORPAGO || ', 
        "valor_restante": ' || pc.VALORRESTANTE || ', 
        "itens": ' || COALESCE((
            SELECT '[' || LIST(
              CASE WHEN vcf2.CANCELAMENTO IS NULL THEN
                '{"produto": "' || vcf2.PRODUTO || '", "valor_total": ' || vcf2.PRECOTOTAL || ', "codigo": "' || vcf2.CODIGOPRODUTO || '"}'
              END, ', ')
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
    const params = [searchTerm];
    resultado = await FQuery(query, params);

    if (resultado.length === 0)
      return res
        .status(404)
        .json({ message: 'Nenhum convênio encontrado com o termo informado.' });

    res.json(resultado);
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

      if (!userCode) return res.status(400);
      if (!senha) return res.status(400);
      if (!codigoProduto) return res.status(400);
      if (!quantity) return res.status(400);

      /*
      VERIFICAR CREDENCIAIS DO UTILIZADOR
      */

      if (senha !== PASSW) return res.status(401);

      /*
      VERIFICAR SE O PRODUTO JÁ EXISTE NO ESTOQUE DA LOJA
      */

      const sql = 'SELECT ESTOQUEATUAL FROM PRODUTOS WHERE CODIGO = ?';
      const Result = await FQuery(sql, [codigoProduto]);
      if (Result.length === 0) return res.status(404);

      /*
      VERIFICAR SE A QUANTIDADE INFORMADA JÁ ESTÁ NO ESTOQUE ANTES DE INSERIR AS MODIFICAÇÕES NO SISTEMA DA LOJA.
      */

      if (Result[0].ESTOQUEATUAL === quantity) return res.status(409);

      /*
      REALIZAR A ATUALIZAÇÃO DO ESTOQUE
      */

      const query = `EXECUTE PROCEDURE PROC_ALTERAESTOQUE (?, ?, ?, ?, NULL)`;
      const params = [codigoProduto, quantity, 1, `CesariaApp`];
      resultado = await FQuery(query, params);
      res.status(200).json(resultado);
    } catch (error) {
      // O catch agora serve como uma segurança extra para outros tipos de erro
      res.status(error.status || 500).json({
        error: error.message || 'Erro interno do servidor.',
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

      if (!userCode) return res.status(400);
      if (!senha) return res.status(400);
      if (!Produto) {
        return res.status(400).json({
          error: 'O campo PRODUCT é obrigatório no corpo da requisição.',
        });
      }

      /*
      VERIFICAR CREDENCIAIS DO UTILIZADOR
      */

      if (senha !== PASSW) return res.status(401);

      /*
      VERIFICAR SE O PRODUTO JÁ TEM CADASTRO
      */

      const queryVerificacao = 'SELECT 1 FROM PRODUTOS WHERE CODIGO = ?';
      const resultadoVerificacao = await FQuery(queryVerificacao, [
        Produto.CODIGO,
      ]);

      if (resultadoVerificacao.length > 0) {
        return res.status(409).json({
          error: `O produto com o código ${Produto.CODIGO} já existe.`,
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

      await FQuery(queryCadastro, valores);

      res.status(201).json({
        success: true,
        message: `Produto ${Produto.CODIGO} cadastrado com sucesso.`,
      });
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ error: error.message || 'Erro interno do servidor.' });
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
        .json({ message: 'Todos os campos são obrigatórios.' });
    }

    if (password !== PASSW) {
      return res.status(401).json({ message: 'Senha inválida.' });
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
        .json({ message: 'Todos os campos são obrigatórios.' });
    }

    if (password !== PASSW) {
      return res.status(401).json({ message: 'Senha inválida.' });
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
    } else {
      console.error('MainWindow não está definido.');
    }
  }
}

export default startServer;
