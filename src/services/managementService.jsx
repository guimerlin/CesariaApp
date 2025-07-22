// services/managementService.jsx
import { ref, onValue, set, get, remove } from "firebase/database";

export class ManagementService {
  constructor(db, currentUser, basePath) {
    this.db = db;
    this.currentUser = currentUser;
    this.basePath = basePath;
  }

  /**
   * Carrega as lojas online
   */
  async loadOnlineStores() {
    const statusRef = ref(this.db, `${this.basePath}/status`);
    const snapshot = await get(statusRef);
    const statuses = snapshot.val() || {};
    
    const onlineUsers = Object.entries(statuses)
      .filter(([userId, status]) => status.state === 'online' && userId !== this.currentUser)
      .map(([userId]) => userId);

    return onlineUsers;
  }

  /**
   * Envia requisição de consulta de tabela para uma loja específica
   */
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

  /**
   * Envia requisições para múltiplas lojas
   */
  async sendMultipleTableRequests(stores, tableName, fieldName, searchValue) {
    const requests = stores.map(store => 
      this.sendTableRequest(store, tableName, fieldName, searchValue)
    );
    return Promise.all(requests);
  }

  /**
   * Escuta respostas de requisições de tabela
   */
  listenForTableAnswers(callback) {
    const answersRef = ref(this.db, `${this.basePath}/tableRequestAnswers/${this.currentUser}`);
    
    return onValue(answersRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const answers = snapshot.val();
      const processedAnswers = {};

      Object.entries(answers).forEach(([requestId, answer]) => {
        const storeId = answer.storeId || answer.from || 'Desconhecida';
        
        if (!processedAnswers[storeId]) {
          processedAnswers[storeId] = [];
        }
        
        if (Array.isArray(answer.results)) {
          processedAnswers[storeId].push(...answer.results.map(item => ({
            ...item,
            storeId: storeId
          })));
        }
        
        // Remove a resposta do Firebase
        remove(ref(this.db, `${this.basePath}/tableRequestAnswers/${this.currentUser}/${requestId}`));
      });

      if (Object.keys(processedAnswers).length > 0) {
        callback(processedAnswers);
      }
    });
  }

  /**
   * Escuta requisições de tabela direcionadas para esta loja
   */
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

  /**
   * Envia resposta de requisição de tabela
   */
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

