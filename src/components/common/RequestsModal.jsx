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

  const apiCall = async (url, options) => {
    const response = await window.electronAPI.fetchUrl(url, options);

    if (!response.success) {
      throw new Error(
        response.message || 'Ocorreu um erro na comunicação com a API.',
      );
    }
    return response.data.data;
  };

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
      console.error(
        `[DEBUG] Falha crítica: Não foi possível enviar a resposta final para ${baseUrl}. Erro: ${error.message}`,
      );
    }
  };

  const onSend = async () => {
    // const selfUrl = config.endpoints[currentUser];
    // const baseUrl = config.endpoints[requestData.storeId];
    const selfUrl = "localhost:3000";
    const baseUrl = "localhost:3000"

    try {

      if (!selfUrl || !baseUrl) {
        throw new Error(
          'Endpoints de comunicação não configurados. A operação não pode continuar.',
        );
      }

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

      // --- TRANSFERÊNCIA REMOTA ---
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

      // --- ATUALIZAÇÃO DO ESTOQUE LOCAL (SAÍDA) ---
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

      // --- ENVIO DA RESPOSTA DE SUCESSO ---
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

      await sendFinalResponse(
        baseUrl,
        'Rejeitado',
        'Solicitação de produto rejeitada.',
      );
    } catch (error) {
      console.error(`[DEBUG] Falha ao rejeitar solicitação: ${error.message}`);
    } finally {
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
