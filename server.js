import express from 'express';
import Firebird from 'node-firebird';

const app = express();

// Adiciona o middleware para interpretar o corpo da requisição como JSON
app.use(express.json());

// --- CONFIGURAÇÕES DO BANCO DE DADOS FIREBIRD ---
// ATENÇÃO: Preencha com as suas informações de conexão.
// É uma boa prática usar variáveis de ambiente para dados sensíveis.
const firebirdOptions = {
  host: "localhost",
  port: 3050,
  database: "C:\\MAGNO SYSTEM\\PHARMAGNO\\SISGEMP.FDB",
  user: "SYSDBA",
  password: "masterkey",
  lowercase_keys: false, // Opcional
  role: null, // Opcional
  pageSize: 4096, // Opcional
};
// -------------------------------------------------

function FQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    Firebird.attach(firebirdOptions, (err, db) => {
      if (err) {
        console.error("Erro de conexão com o Firebird:", err);
        // Rejeita a promessa com um objeto de erro padronizado
        return reject({
          status: 500,
          message: "Falha ao conectar no banco de dados.",
        });
      }

      db.query(sql, params, (err, result) => {
        // Garante que a conexão seja sempre fechada
        db.detach();

        if (err) {
          console.error(`Erro ao executar a query: ${sql}`, err);
          return reject({ status: 500, message: "Falha ao executar a query." });
        }
        // Resolve a promessa com o resultado bem-sucedido
        resolve(result);
      });
    });
  });
}

function startServer() {
  const PORT = 3000; // Você pode tornar isso configurável

  // Endpoint original
  app.get("/", (req, res) => {
    res.send("Nada");
  });

  // Endpoint original
  app.get("/status", (req, res) => {
    res.json({
      status: "online",
      uptime: process.uptime(),
    });
  });

  //////////////////////////////////////////////////////////////////

  //BUSCAR POR PRODUTOS

  app.get("/produto/:searchTerm", async (req, res) => {
    // Pega o parâmetro da URL
    const searchTerm = req.params.searchTerm;

      if (!searchTerm) return res.send("Termo de Busca Inválido");

    // A query SQL fica segura e pré-definida aqui no servidor
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
    let resultado = await FQuery(query, params);

    if (resultado.length === 0)
      return res
        .status(404)
        .json({ message: "Nenhum produto encontrado com o termo informado." });

    res.json(resultado);
  });

  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  //BUSCAR POR CONVENIO

  app.get("/convenio/:searchTerm", async (req, res) => {
    // Pega o parâmetro da URL
    const searchTerm = req.params.searchTerm;

    // A query SQL fica segura e pré-definida aqui no servidor
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
    const params = [searchTerm];
    let resultado = await FQuery(query, params);

    if (resultado.length === 0)
      return res
        .status(404)
        .json({ message: "Nenhum convênio encontrado com o termo informado." });

    res.json(resultado);
  });

  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  //

  app.get("/update/produto/:codigo/:quantidade/:senha", async (req, res) => {
    // Pega o parâmetro da URL
    const codigo = req.params.codigo;
    const quantidade = req.params.quantidade;
    const senha = req.params.senha;

    if (senha !== "2444666668888888") return res.send("Senha Inválida");

    const query = `EXECUTE PROCEDURE PROC_ALTERAESTOQUE (?, ?, ?, ?, NULL)`;
    const params = [codigo, quantidade, 1, "CesariaApp"];
    let resultado = await FQuery(query, params);
    res.json(resultado);
  });

  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  //VERIFICAR CADASTRO DE PRODUTO

  app.get("/verify/produto/:codigo", async (req, res) => {
    // Pega o parâmetro da URL
    const codigo = req.params.codigo;

    if (!codigo) return res.send("Código Inválido");

    const query = `
          SELECT 
            PRODUTO
          FROM PRODUTOS 
          WHERE UPPER(CODIGO) = UPPER(?)
        `;
    const params = [codigo];
    let resultado = await FQuery(query, params);

    if (resultado.length === 0)
      return res
        .status(404)
        .json({ message: "Nenhum produto encontrado com o código informado." });

    res.json(resultado);
  });

  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  //CADASTRAR PRODUTO SE NÂO HOUVER CADASTRO

  //   app.post("/cadastro/produto", async (req, res) => {

  //     // A query SQL fica segura e pré-definida aqui no servidor
  //     const query = ``;
  //     const params = [];
  //     resultado = await FQuery(query, params);
  //     res.json(resultado);
  //     });

  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  app.listen(PORT, () => {
    console.log("Servidor Rodando");
  });
}

export default startServer
