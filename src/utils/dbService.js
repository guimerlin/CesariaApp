// dbService.js - Serviços centralizados para Firebase Realtime Database

import { ref, push, onValue, set, update, serverTimestamp, get, remove, onDisconnect, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
import { APP_CONFIG } from './firebaseConfig.js';

/**
 * Classe responsável por centralizar todas as operações com o Firebase Realtime Database
 * Mantém a estrutura de dados existente para compatibilidade
 */
class DatabaseService {
    constructor(database) {
        this.db = database;
        this.basePath = APP_CONFIG.basePath;
        this.listeners = new Map(); // Para gerenciar listeners ativos
    }

    /**
     * SEÇÃO: GERENCIAMENTO DE USUÁRIOS
     */

    /**
     * Registra ou atualiza um usuário no sistema
     * @param {string} userId - ID do usuário
     * @param {Object} userData - Dados do usuário
     */
    async setUser(userId, userData = {}) {
        const userRef = ref(this.db, `${this.basePath}/users/${userId}`);
        const data = {
            username: userId,
            lastSeen: serverTimestamp(),
            ...userData
        };
        await set(userRef, data);
    }

    /**
     * Atualiza o status online/offline de um usuário
     * @param {string} userId - ID do usuário
     * @param {boolean} isOnline - Status online
     */
    async updateUserStatus(userId, isOnline) {
        const userRef = ref(this.db, `${this.basePath}/users/${userId}`);
        const statusRef = ref(this.db, `${this.basePath}/status/${userId}`);
        
        await update(userRef, { online: isOnline });
        await update(statusRef, {
            state: isOnline ? 'online' : 'offline',
            last_changed: Date.now(),
            activeChat: null
        });

        // Configura desconexão automática
        if (isOnline) {
            onDisconnect(userRef).update({ online: false });
            onDisconnect(statusRef).update({
                state: 'offline',
                last_changed: Date.now(),
                activeChat: null
            });
        }
    }

    /**
     * Configura presença do usuário
     * @param {string} userId - ID do usuário
     */
    setupPresence(userId) {
        const myStatusRef = ref(this.db, `${this.basePath}/status/${userId}`);
        const isOnline = {
            state: 'online',
            last_changed: serverTimestamp(),
            activeChat: null
        };
        const isOffline = {
            state: 'offline',
            last_changed: serverTimestamp(),
            activeChat: null
        };

        onValue(ref(this.db, '.info/connected'), (snapshot) => {
            if (snapshot.val() === false) return;
            onDisconnect(myStatusRef).set(isOffline).then(() => {
                set(myStatusRef, isOnline);
            });
        });
    }

    /**
     * Ouve mudanças nos usuários
     * @param {Function} callback - Função chamada quando há mudanças
     * @returns {Function} Função para remover o listener
     */
    listenForUsers(callback) {
        const usersRef = ref(this.db, `${this.basePath}/users`);
        const unsubscribe = onValue(usersRef, callback);
        this.listeners.set('users', unsubscribe);
        return unsubscribe;
    }

    /**
     * Ouve mudanças no status dos usuários
     * @param {Function} callback - Função chamada quando há mudanças
     * @returns {Function} Função para remover o listener
     */
    listenForUserStatuses(callback) {
        const statusRef = ref(this.db, `${this.basePath}/status`);
        const unsubscribe = onValue(statusRef, callback);
        this.listeners.set('userStatuses', unsubscribe);
        return unsubscribe;
    }

    /**
     * SEÇÃO: GERENCIAMENTO DE MENSAGENS
     */

    /**
     * Envia uma mensagem para um chat
     * @param {string} chatId - ID do chat
     * @param {Object} messageData - Dados da mensagem
     * @returns {Promise<string>} ID da mensagem criada
     */
    async sendMessage(chatId, messageData) {
        const messagesRef = ref(this.db, `${this.basePath}/messages/${chatId}`);
        const newMessageRef = push(messagesRef);
        const messageId = newMessageRef.key;
        
        const message = {
            id: messageId,
            timestamp: serverTimestamp(),
            ...messageData
        };
        
        await set(newMessageRef, message);
        
        // Atualiza informações do chat
        await update(ref(this.db, `${this.basePath}/chats/${chatId}`), {
            lastMessageId: messageId,
            lastMessageTimestamp: serverTimestamp()
        });
        
        return messageId;
    }

    /**
     * Ouve mensagens de um chat
     * @param {string} chatId - ID do chat
     * @param {Function} callback - Função chamada quando há mudanças
     * @returns {Function} Função para remover o listener
     */
    listenForMessages(chatId, callback) {
        const messagesRef = ref(this.db, `${this.basePath}/messages/${chatId}`);
        const unsubscribe = onValue(messagesRef, callback);
        this.listeners.set(`messages_${chatId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * SEÇÃO: GERENCIAMENTO DE NOTIFICAÇÕES URGENTES
     */

    /**
     * Cria notificação urgente para usuários
     * @param {string} chatId - ID do chat
     * @param {string} senderId - ID do remetente
     * @param {Array<string>} recipientIds - IDs dos destinatários
     */
    async createUrgentNotification(chatId, senderId, recipientIds) {
        const notificationPayload = { hasUnread: true, from: senderId };
        
        for (const recipientId of recipientIds) {
            const notifRef = ref(this.db, `${this.basePath}/unreadUrgentNotifications/${recipientId}/${chatId}`);
            await set(notifRef, notificationPayload);
        }
    }

    /**
     * Ouve notificações urgentes de um usuário
     * @param {string} userId - ID do usuário
     * @param {Function} callback - Função chamada quando há mudanças
     * @returns {Function} Função para remover o listener
     */
    listenForUrgentNotifications(userId, callback) {
        const notificationsRef = ref(this.db, `${this.basePath}/unreadUrgentNotifications/${userId}`);
        const unsubscribe = onValue(notificationsRef, callback);
        this.listeners.set(`urgentNotifications_${userId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * Remove notificação urgente de um chat específico
     * @param {string} userId - ID do usuário
     * @param {string} chatId - ID do chat
     */
    async removeUrgentNotification(userId, chatId) {
        const notifRef = ref(this.db, `${this.basePath}/unreadUrgentNotifications/${userId}/${chatId}`);
        await remove(notifRef);
    }

    /**
     * Remove todas as notificações urgentes de um usuário
     * @param {string} userId - ID do usuário
     */
    async removeAllUrgentNotifications(userId) {
        const notificationsRef = ref(this.db, `${this.basePath}/unreadUrgentNotifications/${userId}`);
        await remove(notificationsRef);
    }

    /**
     * SEÇÃO: GERENCIAMENTO DE MENSAGENS NÃO LIDAS
     */

    /**
     * Incrementa contador de mensagens não lidas
     * @param {string} chatId - ID do chat
     * @param {Array<string>} recipientIds - IDs dos destinatários
     */
    async incrementUnreadCount(chatId, recipientIds) {
        for (const recipientId of recipientIds) {
            const unreadRef = ref(this.db, `${this.basePath}/unreadMessages/${recipientId}/${chatId}`);
            await runTransaction(unreadRef, (currentCount) => (currentCount || 0) + 1);
        }
    }

    /**
     * Marca mensagens como lidas
     * @param {string} userId - ID do usuário
     * @param {string} chatId - ID do chat
     */
    async markMessagesAsRead(userId, chatId) {
        const unreadRef = ref(this.db, `${this.basePath}/unreadMessages/${userId}/${chatId}`);
        await set(unreadRef, 0);
    }

    /**
     * Ouve contadores de mensagens não lidas
     * @param {string} userId - ID do usuário
     * @param {Function} callback - Função chamada quando há mudanças
     * @returns {Function} Função para remover o listener
     */
    listenForUnreadCounts(userId, callback) {
        const unreadRef = ref(this.db, `${this.basePath}/unreadMessages/${userId}`);
        const unsubscribe = onValue(unreadRef, callback);
        this.listeners.set(`unreadCounts_${userId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * SEÇÃO: GERENCIAMENTO DE STATUS DE DIGITAÇÃO
     */

    /**
     * Atualiza status de digitação
     * @param {string} chatId - ID do chat
     * @param {string} userId - ID do usuário
     * @param {boolean} isTyping - Se está digitando
     */
    async updateTypingStatus(chatId, userId, isTyping) {
        const typingRef = ref(this.db, `${this.basePath}/typing/${chatId}/${userId}`);
        
        if (isTyping) {
            await set(typingRef, userId);
        } else {
            await remove(typingRef);
        }
    }

    /**
     * Ouve status de digitação de um chat
     * @param {string} chatId - ID do chat
     * @param {Function} callback - Função chamada quando há mudanças
     * @returns {Function} Função para remover o listener
     */
    listenForTyping(chatId, callback) {
        const typingRef = ref(this.db, `${this.basePath}/typing/${chatId}`);
        const unsubscribe = onValue(typingRef, callback);
        this.listeners.set(`typing_${chatId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * SEÇÃO: GERENCIAMENTO DE ESTOQUE
     */

    /**
     * Envia requisição de estoque
     * @param {string} targetStoreId - ID da loja de destino
     * @param {string} requesterId - ID do solicitante
     * @param {string} searchTerm - Termo de busca
     * @returns {Promise<string>} ID da requisição
     */
    async sendStockRequest(targetStoreId, requesterId, searchTerm) {
        const requestId = `req_${requesterId}_${Date.now()}`;
        const requestPayload = {
            requesterId: requesterId,
            searchTerm: searchTerm,
            timestamp: Date.now()
        };
        
        const requestRef = ref(this.db, `${this.basePath}/stockRequests/${targetStoreId}/${requestId}`);
        await set(requestRef, requestPayload);
        
        return requestId;
    }

    /**
     * Ouve requisições de estoque para uma loja
     * @param {string} storeId - ID da loja
     * @param {Function} callback - Função chamada quando há mudanças
     * @returns {Function} Função para remover o listener
     */
    listenForStockRequests(storeId, callback) {
        const requestsRef = ref(this.db, `${this.basePath}/stockRequests/${storeId}`);
        const unsubscribe = onValue(requestsRef, callback);
        this.listeners.set(`stockRequests_${storeId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * Envia resposta de requisição de estoque
     * @param {string} requesterId - ID do solicitante
     * @param {string} requestId - ID da requisição
     * @param {Object} responseData - Dados da resposta
     */
    async sendStockResponse(requesterId, requestId, responseData) {
        const answerPayload = {
            requestId: requestId,
            timestamp: Date.now(),
            ...responseData
        };
        
        const answerRef = ref(this.db, `${this.basePath}/stockRequestAnswers/${requesterId}/${requestId}`);
        await set(answerRef, answerPayload);
    }

    /**
     * Ouve respostas de requisições de estoque
     * @param {string} requesterId - ID do solicitante
     * @param {Function} callback - Função chamada quando há mudanças
     * @returns {Function} Função para remover o listener
     */
    listenForStockResponses(requesterId, callback) {
        const answersRef = ref(this.db, `${this.basePath}/stockRequestAnswers/${requesterId}`);
        const unsubscribe = onValue(answersRef, callback);
        this.listeners.set(`stockResponses_${requesterId}`, unsubscribe);
        return unsubscribe;
    }

    /**
     * SEÇÃO: UTILITÁRIOS
     */

    /**
     * Obtém dados de um caminho específico
     * @param {string} path - Caminho no banco de dados
     * @returns {Promise<any>} Dados do caminho
     */
    async getData(path) {
        const dataRef = ref(this.db, `${this.basePath}/${path}`);
        const snapshot = await get(dataRef);
        return snapshot.val();
    }

    /**
     * Remove um listener específico
     * @param {string} listenerKey - Chave do listener
     */
    removeListener(listenerKey) {
        const unsubscribe = this.listeners.get(listenerKey);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(listenerKey);
        }
    }

    /**
     * Remove todos os listeners ativos
     */
    removeAllListeners() {
        for (const [key, unsubscribe] of this.listeners) {
            unsubscribe();
        }
        this.listeners.clear();
    }

    /**
     * Obtém estatísticas dos listeners ativos
     * @returns {Object} Estatísticas dos listeners
     */
    getListenerStats() {
        return {
            activeListeners: this.listeners.size,
            listenerKeys: Array.from(this.listeners.keys())
        };
    }
}

export { DatabaseService };

