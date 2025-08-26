import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import config from '../../../config.json';

const RequestsModal = ({ isOpen, onClose, requestData, currentUser }) => {
  if (!isOpen) return null;

  /*
  ACEITA A TRANSFERENCIA DE PRODUTO E ATUALIZA O ESTOQUE DE AMBAS AS LOJAS
  REALIZA O CADASTRO DO PRODUTO AUTOMATICAMENTE CASO ELE NÃO EXISTA NA LOJA
  QUE REALIZOU A SOLICITAÇÃO.
  */

  /**
   * Lida com chamadas de API de forma padronizada, centralizando o tratamento de erros.
   * @param {string} url - A URL para a requisição.
   * @param {object} options - As opções para a função fetch (método, corpo, etc.).
   * @returns {Promise<any>} - Os dados da resposta da API em caso de sucesso.
   * @throws {Error} - Lança um erro com a mensagem do backend se a requisição falhar.
   */
  const apiCall = async (url, options) => {
    // Utiliza a API específica do Electron para fazer requisições de rede
    const response = await window.electronAPI.fetchUrl(url, options);

    // Se a resposta indicar falha, lança um erro para ser capturado pelo bloco catch.
    // Isso interrompe a execução imediatamente.
    if (!response.success) {
      throw new Error(
        response.message || 'Ocorreu um erro na comunicação com a API.',
      );
    }

    // Retorna os dados em caso de sucesso
    return response.data.data;
  };

  /**
   * Envia a resposta final (sucesso ou erro) para a loja que solicitou o produto.
   * @param {string} baseUrl - A URL base da loja de destino.
   * @param {'Aceito' | 'Erro'} status - O status final da operação.
   * @param {string} message - A mensagem descritiva a ser enviada.
   */
  const sendFinalResponse = async (baseUrl, status, message) => {
    // Evita tentar enviar uma resposta se a URL não estiver disponível
    if (!baseUrl) return;

    const responseUrl = `http://${baseUrl}/request/response`;
    const responseOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: requestData.code,
        name: requestData.name,
        amount: requestData.amount,
        storeId: currentUser,
        password: config.APIPassword,
        status: status,
        message: message,
      }),
    };

    try {
      await apiCall(responseUrl, responseOptions);
      console.log(`[DEBUG] Resposta de '${status}' enviada com sucesso.`);
    } catch (error) {
      // Se até mesmo o envio da resposta de erro falhar, registra no console local.
      // Isso é uma falha crítica que precisa ser monitorada.
      console.error(
        `[DEBUG] Falha crítica: Não foi possível enviar a resposta final para ${baseUrl}. Erro: ${error.message}`,
      );
    }
  };

  /**
   * Função principal otimizada para processar a transferência de produtos entre estoques.
   */
  const onSend = async () => {
    // const selfUrl = config.endpoints[currentUser];
    // const baseUrl = config.endpoints[requestData.storeId];
    const selfUrl = "localhost:3000";
    const baseUrl = "localhost:3000"

    try {
      // --- 1. VALIDAÇÃO INICIAL DOS ENDPOINTS ---
      if (!selfUrl || !baseUrl) {
        throw new Error(
          'Endpoints de comunicação não configurados. A operação não pode continuar.',
        );
      }

      // --- 2. VERIFICAÇÃO DO PRODUTO E ESTOQUE LOCAL ---
      const localProductData = await apiCall(
        `http://${selfUrl}/produto/info/${requestData.code}`,
        { method: 'GET' },
      );

      if (!localProductData || localProductData.length === 0) {
        throw new Error('Produto não encontrado no estoque local.');
      }
      const localProduct = localProductData[0];

      if (localProduct.ESTOQUEATUAL < requestData.amount) {
        throw new Error(
          'A quantidade solicitada é maior que o estoque disponível.',
        );
      }

      // --- 3. TRANSFERÊNCIA REMOTA ---
      // O endpoint /transfer no servidor de destino vai:
      // a) Cadastrar o produto se ele não existir.
      // b) Adicionar a quantidade transferida ao estoque existente.
      await apiCall(`http://${baseUrl}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: localProduct,
          amount: requestData.amount,
          storeId: currentUser,
          password: config.APIPassword,
        }),
      });

      // --- 4. ATUALIZAÇÃO DO ESTOQUE LOCAL (SAÍDA) ---
      const newLocalStock = localProduct.ESTOQUEATUAL - requestData.amount;
      await apiCall(`http://${selfUrl}/update/produto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BARCODE: requestData.code,
          PASSWORD: config.APIPassword,
          USERCODE: 1,
          QUANTITY: newLocalStock,
        }),
      });

      // --- 5. ENVIO DA RESPOSTA DE SUCESSO ---
      const successMessage = `${requestData.amount} unidade(s) do produto '${requestData.name}' transferida(s) com sucesso.`;
      await sendFinalResponse(baseUrl, 'Aceito', successMessage);
    } catch (error) {
      // --- TRATAMENTO DE ERROS ---
      console.error('[DEBUG] Falha na operação de envio:', error.message);
      await sendFinalResponse(baseUrl, 'Erro', error.message);
    } finally {
      // --- FINALIZAÇÃO ---
      onClose();
    }
  };

  /*
  ENVIA RESPOSTA DE REJEICAO PARA A LOJA QUE SOLICITOU O PRODUTO
  */

  const onReject = async () => {
    const baseUrl = config.endpoints[requestData.storeId];

    try {
      if (!baseUrl) {
        throw new Error(
          `Sem configuração de endpoint para storeId: '${requestData.storeId}'`,
        );
      }

      // Utiliza a função helper para enviar a resposta de rejeição.
      await sendFinalResponse(
        baseUrl,
        'Rejeitado',
        'Solicitação de produto rejeitada.',
      );
    } catch (error) {
      // A função sendFinalResponse já lida com seus próprios erros de envio,
      // então aqui só precisamos registrar o erro de validação do endpoint.
      console.error(`[DEBUG] Falha ao rejeitar solicitação: ${error.message}`);
    } finally {
      // Garante que o modal seja sempre fechado.
      onClose();
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Solicitação de Produto</DialogTitle>
          <DialogDescription>
            Detalhes da solicitação de produto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>
            <strong>Código do Produto:</strong> {requestData?.code}
          </p>
          <p>
            <strong>Nome do Produto:</strong> {requestData?.name}
          </p>
          <p>
            <strong>Quantidade:</strong> {requestData?.amount}
          </p>
        </div>
        <DialogFooter>
          <Button
            onClick={onReject}
            className="bg-red-500 text-white hover:bg-red-600"
            variant="destructive"
          >
            Rejeitar
          </Button>
          <Button
            onClick={onSend}
            className="bg-green-500 text-white hover:bg-green-600"
          >
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestsModal;
