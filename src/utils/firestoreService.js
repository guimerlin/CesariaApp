import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { firebaseFirestore } from './firebaseConfig';

/**
 * Classe responsável por centralizar todas as operações com o Cloud Firestore.
 * Substitui o dbService antigo que era para o Realtime Database.
 */
class FirestoreService {
  constructor() {
    this.db = firebaseFirestore;
    this.listeners = new Map(); // Para gerenciar listeners do onSnapshot
    console.log('[FirestoreService] Service a postos.');
  }

  /**
   * SEÇÃO: GERENCIAMENTO DE USUÁRIOS E AUTENTICAÇÃO
   */

  async createUser(uid, userData) {
    console.log(`[FirestoreService] Criando usuário: ${uid}`);
    const userRef = doc(this.db, 'users', uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
    });
    console.log(`[FirestoreService] Usuário ${uid} criado com sucesso.`);
  }

  async getUser(uid) {
    console.log(`[FirestoreService] Buscando usuário: ${uid}`);
    const userRef = doc(this.db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      console.log(`[FirestoreService] Usuário ${uid} encontrado.`);
      return userSnap.data();
    } else {
      console.warn(`[FirestoreService] Nenhum usuário encontrado com o UID: ${uid}`);
      return null;
    }
  }

  async updateUser(uid, data) {
    console.log(`[FirestoreService] Atualizando usuário: ${uid}`);
    const userRef = doc(this.db, 'users', uid);
    await updateDoc(userRef, data);
  }

  listenForAllUsers(callback) {
    console.log('[FirestoreService] Ouvindo todos os usuários...');
    const usersRef = collection(this.db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const users = [];
      snapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() });
      });
      callback(users);
    });
    const listenerKey = 'allUsers';
    this.listeners.set(listenerKey, unsubscribe);
    return listenerKey;
  }

  /**
   * SEÇÃO: GERENCIAMENTO DE STATUS
   */

  async updateUserStatus(uid, statusData) {
    console.log(`[FirestoreService] Atualizando status de ${uid}:`, statusData);
    const statusRef = doc(this.db, 'status', uid);
    await setDoc(statusRef, statusData, { merge: true });
  }

  listenForUserStatuses(callback) {
    console.log('[FirestoreService] Ouvindo status de usuários...');
    const statusesRef = collection(this.db, 'status');
    const unsubscribe = onSnapshot(statusesRef, (snapshot) => {
      const statuses = {};
      snapshot.forEach((doc) => {
        statuses[doc.id] = doc.data();
      });
      callback(statuses);
    });
    this.listeners.set('userStatuses', unsubscribe);
    return unsubscribe;
  }

  /**
   * SEÇÃO: GERENCIAMENTO DE MENSAGENS E CHATS
   */

  async sendMessage(chatId, messageData) {
    console.log(`[FirestoreService] Enviando mensagem para o chat: ${chatId}`);
    const messagesRef = collection(this.db, `chats/${chatId}/messages`);
    const newMessage = await addDoc(messagesRef, {
      ...messageData,
      timestamp: serverTimestamp(),
    });

    // Atualiza o timestamp da última mensagem no documento do chat
    const chatRef = doc(this.db, 'chats', chatId);
    await setDoc(chatRef, { lastMessageTimestamp: serverTimestamp() }, { merge: true });

    return newMessage.id;
  }

  listenForMessages(chatId, callback) {
    console.log(`[FirestoreService] Ouvindo mensagens do chat: ${chatId}`);
    const messagesRef = collection(this.db, `chats/${chatId}/messages`);
    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      // Ordena as mensagens por timestamp
      messages.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
      callback(messages);
    });
    const listenerKey = `messages_${chatId}`;
    this.listeners.set(listenerKey, unsubscribe);
    return listenerKey;
  }

  /**
   * SEÇÃO: GERENCIAMENTO DE NOTIFICAÇÕES
   */

  async createUrgentNotification(userId, chatId, notificationData) {
    console.log(`[FirestoreService] Criando notificação urgente para ${userId} no chat ${chatId}`);
    const notifRef = doc(this.db, `users/${userId}/urgentNotifications`, chatId);
    await setDoc(notifRef, notificationData);
  }

  listenForUrgentNotifications(userId, callback) {
    console.log(`[FirestoreService] Ouvindo notificações urgentes para: ${userId}`);
    const notificationsRef = collection(this.db, `users/${userId}/urgentNotifications`);
    const unsubscribe = onSnapshot(notificationsRef, (snapshot) => {
      const notifications = {};
      snapshot.forEach((doc) => {
        notifications[doc.id] = doc.data();
      });
      callback(notifications);
    });
    const listenerKey = `urgentNotifications_${userId}`;
    this.listeners.set(listenerKey, unsubscribe);
    return listenerKey;
  }

  async removeUrgentNotification(userId, chatId) {
    console.log(`[FirestoreService] Removendo notificação urgente de ${userId} no chat ${chatId}`);
    const notifRef = doc(this.db, `users/${userId}/urgentNotifications`, chatId);
    await deleteDoc(notifRef);
  }

  /**
   * SEÇÃO: MENSAGENS NÃO LIDAS
   */

  async incrementUnreadCount(userId, chatId) {
    console.log(`[FirestoreService] Incrementando não lidas para ${userId} no chat ${chatId}`);
    const unreadRef = doc(this.db, `users/${userId}/unreadCounts`, chatId);
    await runTransaction(this.db, async (transaction) => {
        const unreadDoc = await transaction.get(unreadRef);
        const newCount = (unreadDoc.data()?.count || 0) + 1;
        transaction.set(unreadRef, { count: newCount });
    });
  }

  async markMessagesAsRead(userId, chatId) {
    console.log(`[FirestoreService] Marcando mensagens como lidas para ${userId} no chat ${chatId}`);
    const unreadRef = doc(this.db, `users/${userId}/unreadCounts`, chatId);
    await setDoc(unreadRef, { count: 0 });
  }

  listenForUnreadCounts(userId, callback) {
    console.log(`[FirestoreService] Ouvindo contagem de não lidas para: ${userId}`);
    const unreadRef = collection(this.db, `users/${userId}/unreadCounts`);
    const unsubscribe = onSnapshot(unreadRef, (snapshot) => {
      const counts = {};
      snapshot.forEach((doc) => {
        counts[doc.id] = doc.data().count;
      });
      callback(counts);
    });
    const listenerKey = `unreadCounts_${userId}`;
    this.listeners.set(listenerKey, unsubscribe);
    return listenerKey;
  }

  /**
   * SEÇÃO: UTILITÁRIOS DE LISTENER
   */

  /**
   * Remove um listener específico baseado na sua chave.
   * @param {string} listenerKey - A chave única para o listener a ser removido.
   */
  removeListener(listenerKey) {
    const unsubscribe = this.listeners.get(listenerKey);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerKey);
      console.log(`[FirestoreService] Listener removido: ${listenerKey}`);
    }
  }

  /**
   * Remove todos os listeners ativos gerenciados por esta instância do serviço.
   */
  removeAllListeners() {
    for (const [, unsubscribe] of this.listeners) {
      unsubscribe();
    }
    this.listeners.clear();
    console.log('[FirestoreService] Todos os listeners foram removidos.');
  }
}

// Exporta uma instância única do serviço para ser usada como um singleton.
export const firestoreService = new FirestoreService();
