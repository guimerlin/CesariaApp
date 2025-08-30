import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import config from '../../../config.json';

const RequestsModal = ({ isOpen, onClose, requestData, currentUser }) => {
  const [quantity, setQuantity] = useState(requestData?.amount || 1);

  useEffect(() => {
    if (requestData) {
      setQuantity(requestData.amount);
    }
  }, [requestData]);

  if (!isOpen) return null;

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

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
    if (!baseUrl) return;

    const responseUrl = `https://${baseUrl}/request/response`;
    const responseOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: requestData.code,
        name: requestData.name,
        amount: quantity, // Usar a quantidade do estado
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
    // const selfUrl = "localhost:3000";
    // const baseUrl = "localhost:3000";
    const selfUrl = config.endpoints[currentUser];
    const baseUrl = config.endpoints[requestData.storeId];
    let transf1 = false;

    try {
      if (!selfUrl || !baseUrl) {
        throw new Error(
          `Endpoints de comunicação não configurados. A operação não pode continuar: SelfUrl: ${selfUrl}, BaseUrl: ${baseUrl}, currentUser: ${currentUser}, requestData.storeId: ${requestData.storeId}`,
        );
      }

      const localProductData = await apiCall(
        `https://${selfUrl}/produto/info/${requestData.code}`,
        { method: 'GET' },
      );

      if (!localProductData || localProductData.length === 0) {
        throw new Error('Produto não encontrado no estoque local.');
      }
      const localProduct = localProductData[0];

      if (localProduct.ESTOQUEATUAL < quantity) {
        // Usar a quantidade do estado
        throw new Error(
          'A quantidade solicitada é maior que o estoque disponível.',
        );
      }

      // --- TRANSFERÊNCIA REMOTA ---
      await apiCall(`https://${baseUrl}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: localProduct,
          amount: quantity, // Usar a quantidade do estado
          storeId: currentUser,
          password: config.APIPassword,
        }),
      });

      transf1 = true;

      // --- ATUALIZAÇÃO DO ESTOQUE LOCAL (SAÍDA) ---
      const newLocalStock = localProduct.ESTOQUEATUAL - quantity; // Usar a quantidade do estado
      await apiCall(`https://${selfUrl}/update/produto`, {
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
      const successMessage = `${quantity} unidade(s) do produto '${requestData.name}' transferida(s) com sucesso. Ambos os estoques foram atualizados automaticamente, nenhum procedimento é necessário.`;
      await sendFinalResponse(baseUrl, 'Aceito', successMessage);
      alert(successMessage);
      alert(
        'O produto foi automaticamente retirado do estoque local e Adicionado na loja de destino. Não é necessário alterações no estoque local. Apenas anote os dados da transferencia como Loja, produto e  quantidade caso necessário.',
      );
    } catch (error) {
      console.error('[DEBUG] Falha na operação de envio:', error.message);
      await sendFinalResponse(baseUrl, 'Erro', error.message);
      if (transf1) {
        alert(
          'Houve uma falha ao atualizar  o estoque local, mas o Produto foi adicionado ao estoque da Loja de destino. Envie uma foto da próxima caixa de Diálogo ao Suporte TI no Grupo da loja.',
        );
      }
      alert('Houve uma falha ao relizar a transferência automaticamente. Confirme a transferência com a loja de destino e faça o procedimento manual. Após esta mensagem, envie uma foto do Erro para o Suporte TI no Grupo da loja.')
      alert(error.message);
    } finally {
      onClose();
    }
  };

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
          <DialogTitle>
            <strong>{requestData?.storeId}</strong>
          </DialogTitle>
          <DialogDescription>
            Solicitação de transferencia de produtos recebida da loja "
            {requestData?.storeId}", confirme as informações e quantidade antes
            de enviar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>
            <strong>Código do Produto:</strong> {requestData?.code}
          </p>
          <p>
            <strong>Nome do Produto:</strong> {requestData?.name}
          </p>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="quantity" className="text-right">
              <strong>Quantidade:</strong>
            </label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              className="col-span-3"
            />
          </div>
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
            Enviar para {requestData?.storeId}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestsModal;
