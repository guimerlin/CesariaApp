import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';

const RequestsModal = ({ isOpen, onClose, requestData }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Solicitação de Produto</DialogTitle>
          <DialogDescription>
            Detalhes da solicitação de produto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p><strong>Código do Produto:</strong> {requestData?.codigoProduto}</p>
          <p><strong>Nome do Produto:</strong> {requestData?.nomeProduto}</p>
          <p><strong>Quantidade:</strong> {requestData?.quantidade}</p>
        </div>
        <Button onClick={onClose}>Fechar</Button>
      </DialogContent>
    </Dialog>
  );
};

export default RequestsModal;
