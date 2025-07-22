// services/stockService.js
import { ref, onValue, set, get, remove } from 'firebase/database';

export class StockService {
  constructor(db, currentUser, basePath) {
    this.db = db;
    this.currentUser = currentUser;
    this.basePath = basePath;
  }

  /**
   * Carrega as lojas online
   */
  async loadOnlineStores() {
    console.log('[STOCK SERVICE] Carregando lojas online...', this.db);
    const statusRef = ref(this.db, `${this.basePath}/status`);
    const snapshot = await get(statusRef);
    const statuses = snapshot.val() || {};

    const onlineUsers = Object.entries(statuses)
      .filter(
        ([userId, status]) =>
          status.state === 'online' && userId !== this.currentUser,
      )
      .map(([userId]) => userId);

    return onlineUsers;
  }

  /**
   * Envia requisição de estoque para uma loja específica
   */
  async sendStockRequest(targetStore, searchTerm) {
    const requestId = `req_${this.currentUser}_${Date.now()}`;
    const requestPayload = {
      requesterId: this.currentUser,
      searchTerm: searchTerm,
      timestamp: Date.now(),
    };

    const requestRef = ref(
      this.db,
      `${this.basePath}/stockRequests/${targetStore}/${requestId}`,
    );
    await set(requestRef, requestPayload);

    return requestId;
  }

  /**
   * Envia requisição para múltiplas lojas
   */
  async sendMultipleStockRequests(stores, searchTerm) {
    const requests = stores.map((store) =>
      this.sendStockRequest(store, searchTerm),
    );
    return Promise.all(requests);
  }

  /**
   * Escuta respostas de estoque
   */
  listenForStockAnswers(callback) {
    const answersRef = ref(
      this.db,
      `${this.basePath}/stockRequestAnswers/${this.currentUser}`,
    );

    return onValue(answersRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const answers = snapshot.val();
      const processedAnswers = {};

      Object.entries(answers).forEach(([key, answer]) => {
        const loja =
          answer.storeId ||
          answer.from ||
          answer.loja ||
          key.split('_')[1] ||
          'Desconhecida';

        if (!processedAnswers[loja]) {
          processedAnswers[loja] = [];
        }

        if (Array.isArray(answer.results)) {
          processedAnswers[loja].push(
            ...answer.results.map((prod) => ({
              ...prod,
              storeId: loja,
            })),
          );
        }

        // Remove a resposta do Firebase
        remove(
          ref(
            this.db,
            `${this.basePath}/stockRequestAnswers/${this.currentUser}/${key}`,
          ),
        );
      });

      if (Object.keys(processedAnswers).length > 0) {
        callback(processedAnswers);
      }
    });
  }

  /**
   * Envia solicitação de item
   */
  async sendItemRequest(targetStore, productInfo, quantidade) {
    const requestPayload = {
      requester: this.currentUser,
      product: productInfo,
      quantidade: quantidade,
      timestamp: Date.now(),
    };

    const itemRequestRef = ref(
      this.db,
      `${this.basePath}/itemRequests/${targetStore}/${Date.now()}`,
    );
    await set(itemRequestRef, requestPayload);

    return requestPayload;
  }

  /**
   * Envia mensagem no chat
   */
  async sendChatMessage(targetStore, productInfo, quantidade, dbService) {
    const lojas = [this.currentUser, targetStore].sort();
    const chatId = `${lojas[0]}_${lojas[1]}`;

    const message = {
      sender: this.currentUser,
      senderName: this.currentUser,
      timestamp: Date.now(),
      text: `Solicitação URGENTE de ${quantidade} unidade(s) do produto "${productInfo.PRODUTO}" (Código: ${productInfo.CODIGO}).`,
      urgent: true,
      product: productInfo,
      quantidade: quantidade,
    };

    await dbService.sendMessage(chatId, message);
    await dbService.createUrgentNotification(chatId, this.currentUser, [
      targetStore,
    ]);
  }

  /**
   * Escuta requisições de tabela direcionadas para esta loja
   */
  listenForTableRequests(callback) {
    const requestsRef = ref(
      this.db,
      `${this.basePath}/tableRequests/${this.currentUser}`,
    );

    return onValue(requestsRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const requests = snapshot.val();

      Object.entries(requests).forEach(([requestId, request]) => {
        callback(requestId, request);
        // Remove a requisição do Firebase
        remove(
          ref(
            this.db,
            `${this.basePath}/tableRequests/${this.currentUser}/${requestId}`,
          ),
        );
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
      timestamp: Date.now(),
    };

    const answerRef = ref(
      this.db,
      `${this.basePath}/tableRequestAnswers/${requesterId}/${requestId}`,
    );
    await set(answerRef, answerPayload);
  }
}
