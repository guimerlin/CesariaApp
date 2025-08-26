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

const RequestsResponseModal = ({ isOpen, onClose, requestData, currentUser }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Resposta de Solicitação</DialogTitle>
          <DialogDescription>
            Resposta de solicitação recebida de {requestData.storeId}
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
            <strong>Quantidade Solicitada:</strong> {requestData?.amount}
          </p>
          <p>
            <strong>Status:</strong> {requestData?.status}
          </p>
          <p className={requestData?.status === 'Aceito' ? 'text-green-500' : 'text-red-500'
          }>
            <strong>Mensagem:</strong> {requestData?.message}
          </p>
        </div>
        <DialogFooter>
          <Button
            onClick={onClose}
            className="bg-gray-500 text-white hover:bg-gray-600"
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestsResponseModal;
