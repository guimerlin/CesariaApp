// SERVIÇO RESPONSAVEL POR ENVIAR E RECEBER REQUISIÇÔES DE TABELAS, COMO PRODUTOS, DADOSPREVENDA, CONVENIOS E ETC.

import { ref, onValue, set, get, remove } from "firebase/database";

export class ManagementService {
  constructor(db, currentUser, basePath) {
    this.db = db;
    this.currentUser = currentUser;
    this.basePath = basePath;
  }

////////////////////////////////////////////////////////////////////////////////////////////////////////

  // CARREGA LOJAS ONLINE  // PASSAR PARA USERSSERVICE.JSX FUTURAMENTE

  async loadOnlineStores() {
    const statusRef = ref(this.db, `${this.basePath}/status`);
    const snapshot = await get(statusRef);
    const statuses = snapshot.val() || {};
    
    const onlineUsers = Object.entries(statuses)
      .filter(([userId, status]) => status.state === 'online' && userId !== this.currentUser)
      .map(([userId]) => userId);

    return onlineUsers;
  }

////////////////////////////////////////////////////////////////////////////////////////////////////

  // ENVIA REQUISIÇÃO DE TABELA PARA UMA LOJA ESPECÍFICA

  async sendTableRequest(targetStore, tableName, fieldName, searchValue) {
    const requestId = `req_${this.currentUser}_${Date.now()}`;
    const requestPayload = {
      requesterId: this.currentUser,
      tableName: tableName,
      fieldName: fieldName,
      searchValue: searchValue,
      timestamp: Date.now()
    };

    const requestRef = ref(this.db, `${this.basePath}/tableRequests/${targetStore}/${requestId}`);
    await set(requestRef, requestPayload);
    
    return requestId;
  }

/////////////////////////////////////////////////////////////////////////////////////////////////

  // ENVIA REQUISIÇÕES PARA MÚLTIPLAS LOJAS

  async sendMultipleTableRequests(stores, tableName, fieldName, searchValue) {
    console.log('[REQUEST SERVICE] Enviando requisições para múltiplas lojas:', {
      stores,
      tableName,
      fieldName,
      searchValue
    });
    
    const requests = stores.map(store => 
      this.sendTableRequest(store, tableName, fieldName, searchValue)
    );
    return Promise.all(requests);
  }

/////////////////////////////////////////////////////////////////////////////////////////////////////////

  // ESCUTA RESPOSTAS DE REQUISIÇÕES DE TABELA

  listenForTableAnswers(callback) {
    const answersRef = ref(this.db, `${this.basePath}/tableRequestAnswers/${this.currentUser}`);
    
    console.log('[REQUEST SERVICE] Iniciando listener para respostas em:', answersRef.toString());
    
    return onValue(answersRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const answers = snapshot.val();
      console.log('[REQUEST SERVICE] Respostas recebidas:', answers);
      
      const processedAnswers = {};

      Object.entries(answers).forEach(([requestId, answer]) => {
        const storeId = answer.storeId || answer.from || 'Desconhecida';
        console.log(`[REQUEST SERVICE] Processando resposta de ${storeId}:`, answer);
        
        if (!processedAnswers[storeId]) {
          processedAnswers[storeId] = [];
        }
        
        if (Array.isArray(answer.results)) {
          console.log(`[REQUEST SERVICE] ${storeId} retornou ${answer.results.length} resultados`);
          processedAnswers[storeId].push(...answer.results.map(item => ({
            ...item,
            storeId: storeId
          })));
        }
        
        // Remove a resposta do Firebase após um delay para garantir processamento
        setTimeout(() => {
          remove(ref(this.db, `${this.basePath}/tableRequestAnswers/${this.currentUser}/${requestId}`));
          console.log(`[REQUEST SERVICE] Resposta ${requestId} removida do Firebase`);
        }, 1000); // 1 segundo de delay
      });

      if (Object.keys(processedAnswers).length > 0) {
        console.log('[REQUEST SERVICE] Chamando callback com resultados processados:', processedAnswers);
        callback(processedAnswers);
      }
    });
  }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // ESCUTA REQUISIÇÕES DE TABELA DIRECIONADAS PARA ESTA LOJA

  listenForTableRequests(callback) {
    const requestsRef = ref(this.db, `${this.basePath}/tableRequests/${this.currentUser}`);
    
    return onValue(requestsRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const requests = snapshot.val();
      
      Object.entries(requests).forEach(([requestId, request]) => {
        callback(requestId, request);
        // Remove a requisição do Firebase
        remove(ref(this.db, `${this.basePath}/tableRequests/${this.currentUser}/${requestId}`));
      });
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////

  // ENVIA RESPOSTA DE REQUISIÇÃO DE TABELA

  async sendTableResponse(requesterId, requestId, result) {
    const answerPayload = {
      requestId: requestId,
      storeId: this.currentUser,
      results: result.success ? result.data : [],
      error: result.success ? null : result.error,
      timestamp: Date.now()
    };

    const answerRef = ref(this.db, `${this.basePath}/tableRequestAnswers/${requesterId}/${requestId}`);
    await set(answerRef, answerPayload);
  }
}

