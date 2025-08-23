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

  const onSend = async () => {
    // const selfUrl = config.endpoints[currentUser];
    // const baseUrl = config.endpoints[requestData.storeId];
    const selfUrl = 'localhost:3000';
    const baseUrl = 'localhost:3000';

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
    VERIFICA SE O ITEM EXISTE NO ESTOQUE LOCAL
    */

    const SelfItemCheck = `http://${selfUrl}/produto/info/${requestData.code}`;
    const SelfItemCheckOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const selfItemCheckResult = await window.electronAPI.fetchUrl(
      SelfItemCheck,
      SelfItemCheckOptions,
    );

    console.log('selfItemCheckResult', selfItemCheckResult);
    if (!selfItemCheckResult.success || selfItemCheckResult.data.length === 0) {
      console.alert('Produto não encontrado no estoque local');
      onClose();
      return;
    }
    const selfProductInfo = selfItemCheckResult.data;
    console.log('selfProductInfo', selfProductInfo);

    /*
    VERIFICA SE O ITEM EXISTE NO ESTOQUE DA LOJA QUE SOLICITOU O PRODUTO
    */

    const RemoteItemCheck = `http://${selfUrl}/produto/info/${requestData.code}`;
    const RemoteItemCheckOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const remoteItemCheckResult = await window.electronAPI.fetchUrl(
      RemoteItemCheck,
      RemoteItemCheckOptions,
    );

    console.log('remoteItemCheckResult', remoteItemCheckResult);
    let remoteProductInfo = {};
    if (
      !remoteItemCheckResult.success ||
      remoteItemCheckResult.data.error === true
    ) {
      console.log('Produto não encontrado no estoque Remoto.');
    } else {
      remoteProductInfo = remoteItemCheckResult.data;
    }

    console.log('remoteProductInfo', remoteProductInfo);

    /*
    SE O PRODUTO NÃO EXISTIR NA LOJA QUE O SOLICITOU, CADASTRA-O
    */

    let productRegistered = false;
    if (!remoteProductInfo[0]) {
      console.log('[REQUEST MODAL DEBUG] Cadastrando Produto');
      const cadastroURL = `http://${baseUrl}/produto/cadastro`;
      const cadastroOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          PRODUCT: selfProductInfo[0],
          PASSWORD: config.APIPassword,
          USERCODE: 1,
        }),
      };

      const CadastroResult = await window.electronAPI.fetchUrl(
        cadastroURL,
        cadastroOptions,
      );

      console.log('CadastroResult', CadastroResult);
      if (!CadastroResult.success) {
        console.alert(
          `Erro ao cadastrar o Produto remotamente: ${CadastroResult.error}`,
        );
        onClose();
        return;
      } else {
        console.log('Produto cadastrado com sucesso', CadastroResult.data);
        remoteProductInfo = { ...selfProductInfo };
        remoteProductInfo[0].ESTOQUEATUAL = 0;
        productRegistered = true;
      }
    }

    /*
    VERIFICA SE A QUANTIDADE SOLICITADA É MAIOR QUE O ESTOQUE DISPONÍVEL
    */

    if (selfProductInfo[0].ESTOQUEATUAL < requestData.amount) {
      console.log(
        'A quantidade solicitada é maior do que o estoque disponível',
      );
      onClose();
      return;
    }

    /*
    ATUALIZA O ESTOQUE LOCAL PARA A NOVA QUANTIDADE DO PRODUTO
    */

    const novaQuantidade = selfProductInfo[0].ESTOQUEATUAL - requestData.amount;
    console.log('novaQuantidade', novaQuantidade);
    const updateSelfStock = `http://${baseUrl}/update/produto`;
    const updateSelfStockoptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BARCODE: requestData.code,
        QUANTITY: novaQuantidade,
        PASSWORD: config.APIPassword,
        USERCODE: 1,
      }),
    };

    const selfUpdateResult = await window.electronAPI.fetchUrl(
      updateSelfStock,
      updateSelfStockoptions,
    );

    let errorMessage = null;

    if (!selfUpdateResult.success) {
      errorMessage = `Erro ao atualizar o Estoque Local: ${selfUpdateResult.error}`;
      console.alert(errorMessage);
    } else {
      console.log(
        'Estoque local atualizado com sucesso',
        selfUpdateResult.data,
      );
    }

    /*
    ATUALIZA O ESTOQUE DA LOJA QUE SOLICITOU O PRODUTO
    */
    console.log('remoteProductInfo', remoteProductInfo);
    if (!errorMessage) {
      const updateRemoteStock = `http://${selfUrl}/update/produto`;
      const updateRemoteStockoptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BARCODE: requestData.code,
          QUANTITY: remoteProductInfo[0].ESTOQUEATUAL + requestData.amount,
          PASSWORD: config.APIPassword,
          USERCODE: 1,
        }),
      };

      const remoteUpdateResult = await window.electronAPI.fetchUrl(
        updateRemoteStock,
        updateRemoteStockoptions,
      );

      console.log('remoteUpdateResult', remoteUpdateResult);
      if (!remoteUpdateResult.success) {
        errorMessage = `Erro ao atualizar o Estoque remoto: ${remoteUpdateResult.error}`;
        console.alert(errorMessage);
      } else {
        console.log(
          'Estoque remoto atualizado com sucesso',
          remoteUpdateResult.data,
        );
      }
    }

    /*
    ENVIA RESPOSTA PARA A LOJA QUE SOLICITOU O PRODUTO
    */

    const successMessage = productRegistered
      ? `Solicitação de produto Aceita. O produto '${requestData.name}' foi cadastrado automaticamente, e a quantidade atual é de ${requestData.amount} unidade${
          requestData.amount > 1 ? 's' : ''
        }.`
      : `Solicitação de produto Aceita. ${requestData.amount} unidade${
          requestData.amount > 1 ? 's' : ''
        } do produto '${requestData.name}' fo${
          requestData.amount > 1 ? 'ram' : 'i'
        } incluida${requestData.amount > 1 ? 's' : ''} no estoque. A quantidade atual é de ${selfProductInfo[0].ESTOQUEATUAL + requestData.amount}. A quantidade anterior era de ${selfProductInfo[0].ESTOQUEATUAL}.`;

    const url = `http://${baseUrl}/request/response`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: requestData.code,
        name: requestData.name,
        amount: requestData.amount,
        storeId: currentUser,
        password: config.APIPassword,
        status: errorMessage ? 'Erro' : 'Aceito',
        message: errorMessage || successMessage,
      }),
    };

    const sendResponseResult = await window.electronAPI.fetchUrl(url, options);

    console.log('sendResponseResult', sendResponseResult);
    if (!sendResponseResult.success) {
      console.alert(`Erro ao enviar resposta: ${sendResponseResult.error}`);
    } else {
      console.log('Resposta enviada com sucesso', sendResponseResult.data);
    }
    onClose();
  };

  /*
  ENVIA RESPOSTA DE REJEICAO PARA A LOJA QUE SOLICITOU O PRODUTO
  */

  const onReject = async () => {
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
        code: requestData.code,
        name: requestData.name,
        amount: requestData.amount,
        storeId: currentUser,
        password: config.APIPassword,
        status: 'Rejected',
        message: 'Solicitação de produto rejeitada.',
      }),
    };

    const sendReject = await window.electronAPI.fetchUrl(url, options);

    console.log('sendReject', sendReject);
    if (!sendReject.success) {
      console.alert(`Erro ao enviar resposta de rejeição: ${sendReject.error}`);
      onClose();
      return;
    } else {
      console.log('Resposta de rejeição enviada com sucesso', sendReject.data);
      onClose();
    }
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
