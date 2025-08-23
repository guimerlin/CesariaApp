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

const RequestsResponseModal = ({ isOpen, onClose, requestData, onSend }) => {
  if (!isOpen) return null;

  const onReject = () => {
    if (!requestData || !requestData.storeId) {
      console.error(
        'Cannot reject request: storeId is missing from requestData',
      );
      onClose();
      return;
    }

    const baseUrl = config.endpoints[requestData.storeId];
    if (!baseUrl) {
      console.error(
        `Cannot reject request: no endpoint configured for storeId '${requestData.storeId}'`,
      );
      onClose();
      return;
    }

    const url = `https://${baseUrl}/request/reject`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    };

    window.electronAPI
      .fetchUrl(url, options)
      .then((result) => {
        if (!result.success) {
          // Mesmo que a requisição falhe, o modal será fechado no `finally`
          console.error(`Erro ao rejeitar solicitação: ${result.error}`);
          // Opcional: Mostrar um erro para o usuário
        } else {
          console.log("Request rejected successfully", result.data);
        }
      })
      .catch((error) => {
        console.error("Falha ao executar fetchUrl para rejeitar:", error);
      })
      .finally(() => {
        onClose();
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Resposta de Solicitação</DialogTitle>
          <DialogDescription>
            Detalhes da solicitação de produto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>
            <strong>Código do Produto:</strong> {requestData?.codigoProduto}
          </p>
          <p>
            <strong>Nome do Produto:</strong> {requestData?.nomeProduto}
          </p>
          <p>
            <strong>Quantidade:</strong> {requestData?.quantidade}
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

export default RequestsResponseModal;
