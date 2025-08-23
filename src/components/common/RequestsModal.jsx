import React, { useState } from 'react';
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
  const [selfProductInfo, setSelfProductInfo] = useState(null);
  const [remoteProductInfo, setRemoteProductInfo] = useState(null);

  if (!isOpen) return null;

  /*
  ACEITA A TRANSFERENCIA DE PRODUTO E ATUALIZA O ESTOQUE DE AMBAS AS LOJAS
  REALIZA O CADASTRO DO PRODUTO AUTOMATICAMENTE CASO ELE NÃO EXISTA NA LOJA
  */

  const onSend = () => {
    // const selfUrl = config.endpoints[currentUser];
    // const baseUrl = config.endpoints[requestData.storeId];
    const selfUrl = 'localhost:3000';
    const baseUrl = 'localhost:3000';
    let selfProduct;

    /*
    CONFIRMAÇÕES DE INFORMAÇÕES IMPORTANTES PARA O FUNCIONAMENTO
    DO SCRIPT DE ATUALIZAÇÃO DE ESTOQUE
    */

    if (!selfUrl) {
      console.log(
        `Configuração de endpoint não encontrada para currentUser: '${currentUser}'`,
      );
      onClose();
      return;
    }
    if (!baseUrl) {
      console.alert(
        `Configuração de endpoint não encontrada para storeId: '${requestData.storeId}'`,
      );
      onClose();
      return;
    }

    /*
    VERIFICA SE O ITEM EXISTE NO ESTOQUE LOCAL E SE A QUANTIDADE SOLICITADA
    É VÁLIDA OU MAIOR QUE O ESTOQUE DISPONÍVEL
    */

    const SelfItemCheck = `http://${selfUrl}/produto/info/${requestData.codigoProduto}`;
    const SelfItemCheckOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    window.electronAPI
      .fetchUrl(SelfItemCheck, SelfItemCheckOptions)
      .then((result) => {
        if (!result.success) {
          console.alert(
            `Erro ao buscar informações do Produto: ${result.error}`,
          );
          return onClose();
        } else {
          console.log('Produto Encontrado:', result.data);
          setSelfProductInfo(result.data);
        }
      })
      .catch((error) => {
        console.alert(
          'Falha ao executar fetchUrl para buscar informações do Produto:',
          error,
        );
        return onClose();
      });

    const RemoteItemCheck = `http://${selfUrl}/produto/info/${requestData.codigoProduto}`;
    const RemoteItemCheckOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    window.electronAPI
      .fetchUrl(SelfItemCheck, SelfItemCheckOptions)
      .then((result) => {
        if (!result.success) {
          console.alert(
            `Erro ao buscar informações do Produto: ${result.error}`,
          );
          return onClose();
        }
        console.log('Produto Encontrado:', result.data);
        setRemoteProductInfo(result.data);
      })
      .catch((error) => {
        console.alert(
          'Falha ao executar fetchUrl para buscar informações do Produto:',
          error,
        );
        return onClose();
      });

    console.log('A', selfProduct, 'B', selfProductInfo);
    console.log(config.APIPassword);
    if (selfProductInfo[0].ESTOQUEATUAL < requestData.quantidade) {
      console.alert(
        'A quantidade solicitada é maior do que o estoque disponível',
      );
      return onClose();
    }

    /*
    ATUALIZA O ESTOQUE LOCAL PARA A NOVA QUANTIDADE DO PRODUTO
    */

    const novaQuantidade =
      selfProductInfo[0].ESTOQUEATUAL - requestData.quantidade;
    const updateSelfStock = `http://${baseUrl}/update/produto`;
    const updateSelfStockoptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BARCODE: requestData.codigoProduto,
        QUANTITY: novaQuantidade,
        PASSWORD: config.APIPassword,
        USERCODE: 1,
      }),
    };

    window.electronAPI
      .fetchUrl(updateSelfStock, updateSelfStockoptions)
      .then((result) => {
        if (!result.success) {
          console.error(`Erro ao atualizar o Estoque: ${result.error}`);
        } else {
          console.log('Estoque atualizado com sucesso', result.data);
        }
      })
      .catch((error) => {
        console.error(
          'Falha ao executar fetchUrl para Atualizar Estoque:',
          error,
        );
      });

    /*
      ATUALIZA O ESTOQUE DA LOJA QUE SOLICITOU O PRODUTO
      */

    const updateRemoteStock = `http://${selfUrl}/update/produto`;
    const updateRemoteStockoptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BARCODE: requestData.codigoProduto,
        QUANTITY: remoteProductInfo[0].ESTOQUEATUAL + requestData.quantidade,
        PASSWORD: config.APIPassword,
        USERCODE: 1,
      }),
    };

    window.electronAPI
      .fetchUrl(updateRemoteStock, updateRemoteStockoptions)
      .then((result) => {
        if (!result.success) {
          console.error(`Erro ao atualizar o Estoque Remoto: ${result.error}`);
        } else {
          console.log('Estoque remoto atualizado com sucesso', result.data);
        }
      })
      .catch((error) => {
        console.error(
          'Falha ao executar fetchUrl para Atualizar Estoque Remoto:',
          error,
        );
      });

    /*
    ENVIA RESPOSTA DE SUCESSO PARA A LOJA QUE SOLICITOU O PRODUTO
    */

    const url = `http://${baseUrl}/request/response`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Senha: config.APIPassword,
        codigoProduto: requestData.codigoProduto,
        nomeProduto: requestData.nomeProduto,
        quantidade: requestData.quantidade,
        storeId: currentUser,
      }),
    };

    window.electronAPI
      .fetchUrl(url, options)
      .then((result) => {
        if (!result.success) {
          console.error(`Erro ao enviar resposta: ${result.error}`);
        } else {
          console.log('Resposta enviada com sucesso', result.data);
        }
      })
      .catch((error) => {
        console.error('Falha ao executar fetchUrl para responder:', error);
      });
    onClose();
  };

  /*
  ENVIA RESPOSTA DE REJEICAO PARA A LOJA QUE SOLICITOU O PRODUTO
  */

  const onReject = () => {
    if (!requestData || !requestData.storeId) {
      console.error('RequestData não informada');
      onClose();
      return;
    }

    // const baseUrl = config.endpoints[requestData.storeId];
    const baseUrl = 'localhost:3000';

    if (!baseUrl) {
      console.error(
        `Sem configuração de endpoint para storeId: '${requestData.storeId}'`,
      );
      onClose();
      return;
    }

    const url = `http://${baseUrl}/request/response`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Senha: config.APIPassword,
        codigoProduto: requestData.codigoProduto,
        nomeProduto: requestData.nomeProduto,
        quantidade: requestData.quantidade,
        storeId: currentUser,
      }),
    };

    window.electronAPI
      .fetchUrl(url, options)
      .then((result) => {
        if (!result.success) {
          // Mesmo que a requisição falhe, o modal será fechado no `finally`
          console.error(`Erro ao rejeitar solicitação: ${result.error}`);
          // Opcional: Mostrar um erro para o usuário
        } else {
          console.log('Requisição rejeitada com sucesso:', result.data, url);
        }
      })
      .catch((error) => {
        console.error('Falha ao executar fetchUrl para rejeitar:', error);
      })
      .finally(() => {
        onClose();
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Solicitação de Produto</DialogTitle>
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

export default RequestsModal;
