// ChatContext.jsx - Contexto para gerenciar estado global do chat

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from 'react';
import {
  // getDatabase,
  ref,
  push,
  onValue,
  set,
  serverTimestamp,
  get,
  remove,
  onDisconnect,
  runTransaction,
} from 'firebase/database';
import { firebaseDb, APP_CONFIG } from '../utils/firebaseConfig';
// import {
//   getFirebirdConfig,
//   getFirebirdConfigForStore,
// } from '../utils/firebirdConfig';
import { DatabaseService } from '../utils/dbService';

const ChatContext = createContext();

// Reducer para gerenciar estado do chat
const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SET_USER_STATUSES':
      return { ...state, userStatuses: action.payload };
    case 'SET_CURRENT_CHAT':
      return {
        ...state,
        currentChatId: action.payload.chatId,
        currentChatName: action.payload.chatName,
      };
    case 'SET_MESSAGES': // This case is already present in the original code
      return { ...state, messages: action.payload };
    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload };
    case 'SET_UNREAD_COUNTS':
      return { ...state, unreadCounts: action.payload };
    case 'SET_URGENT_NOTIFICATIONS':
      return { ...state, urgentNotifications: action.payload };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    default:
      return state;
  }
};

const initialState = {
  currentUser: null,
  users: [],
  userStatuses: {},
  currentChatId: null,
  currentChatName: null,
  messages: [],
  typingUsers: [],
  unreadCounts: {},
  urgentNotifications: {},
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const [isTaskBarVisible, setIsTaskBarVisible] = useState(false);

  const basePath = APP_CONFIG.basePath;
  const dbService = new DatabaseService(firebaseDb);

  // Funções utilitárias
  const _getPrivateChatId = (user1, user2) => {
    return [user1, user2].sort().join('_');
  };

  // Função de login
  const handleLogin = async (username) => {
    dispatch({ type: 'SET_CURRENT_USER', payload: username });

    // Registra usuário no Firebase
    await set(ref(firebaseDb, `${basePath}/users/${username}`), {
      username: username,
      lastSeen: serverTimestamp(),
    });

    // Configura presença
    setupPresence(username);

    // Inicia listeners
    listenForUsers();
    listenForUserStatuses();
    listenForUnreadCounts(username);
    listenForUrgentNotifications(username);
    // listenForStockRequests(username);
    // listenForTableRequests(username);
  };

  // Configuração de presença
  const setupPresence = (username) => {
    const myStatusRef = ref(firebaseDb, `${basePath}/status/${username}`);
    const isOnline = {
      state: 'online',
      last_changed: serverTimestamp(),
      activeChat: null,
    };
    const isOffline = {
      state: 'offline',
      last_changed: serverTimestamp(),
      activeChat: null,
    };

    onValue(ref(firebaseDb, '.info/connected'), (snapshot) => {
      if (snapshot.val() === false) return;
      onDisconnect(myStatusRef)
        .set(isOffline)
        .then(() => {
          set(myStatusRef, isOnline);
        });
    });
  };

  // Listeners
  const listenForUsers = () => {
    onValue(ref(firebaseDb, `${basePath}/users`), (snapshot) => {
      const users = snapshot.val() || {};
      const allUsers = Object.keys(users).map((u) => ({ id: u, username: u }));
      dispatch({ type: 'SET_USERS', payload: allUsers });
    });
  };

  const listenForUserStatuses = () => {
    onValue(ref(firebaseDb, `${basePath}/status`), (snapshot) => {
      const userStatuses = snapshot.val() || {};
      dispatch({ type: 'SET_USER_STATUSES', payload: userStatuses });
    });
  };

  const listenForUnreadCounts = (username) => {
    onValue(
      ref(firebaseDb, `${basePath}/unreadMessages/${username}`),
      (snapshot) => {
        const unreadCounts = snapshot.val() || {};
        dispatch({ type: 'SET_UNREAD_COUNTS', payload: unreadCounts });
      },
    );
  };

  const listenForUrgentNotifications = (username) => {
    onValue(
      ref(firebaseDb, `${basePath}/unreadUrgentNotifications/${username}`),
      (snapshot) => {
        const notifications = snapshot.val() || {};
        const urgentNotifications = {};
        Object.keys(notifications).forEach((chatId) => {
          if (notifications[chatId]?.hasUnread) {
            urgentNotifications[chatId] = true;
          }
        });
        dispatch({
          type: 'SET_URGENT_NOTIFICATIONS',
          payload: urgentNotifications,
        });
      },
    );
  };

  // Função para abrir chat

  const openChat = (chatId, chatName) => {
    dispatch({
      type: 'SET_CURRENT_CHAT',
      payload: { chatId, chatName },
    });

    // Carrega mensagens do chat
    loadMessages(chatId);

    // Marca mensagens como lidas
    markMessagesAsRead(chatId);

    // Remove notificação urgente
    removeUrgentNotification(chatId);
  };

  // Carrega mensagens do chat
  const loadMessages = (chatId) => {
    onValue(ref(firebaseDb, `${basePath}/messages/${chatId}`), (snapshot) => {
      const msgs = snapshot.val() || {};
      const messages = Object.entries(msgs)
        .sort((a, b) => (a[1].timestamp || 0) - (b[1].timestamp || 0))
        .map(([msgId, msg]) => ({ ...msg, id: msgId }));

      dispatch({ type: 'SET_MESSAGES', payload: messages });
    });
  };

  // Envia mensagem
  const sendMessage = async (text, isUrgent = false) => {
    if (!text || !state.currentChatId || !state.currentUser) return;

    const msgRef = ref(
      firebaseDb,
      `${basePath}/messages/${state.currentChatId}`,
    );
    const newMsg = {
      senderId: state.currentUser,
      senderName: state.currentUser,
      text,
      urgent: isUrgent,
      timestamp: serverTimestamp(),
    };

    await push(msgRef, newMsg);

    // Incrementa contador de não lidas
    await incrementUnreadCount(state.currentChatId);

    // Se urgente, cria notificação
    if (isUrgent) {
      await createUrgentNotification(state.currentChatId);
    }
  };

  // Envia mensagem para Chat especifico
  const sendMessageChat = async (text, isUrgent = false, chatId) => {
    if (!text || !state.currentChatId || !state.currentUser) return;

    const msgRef = ref(
      firebaseDb,
      `${basePath}/messages/${chatId}`,
    );
    const newMsg = {
      senderId: state.currentUser,
      senderName: state.currentUser,
      text,
      urgent: isUrgent,
      timestamp: serverTimestamp(),
    };

    await push(msgRef, newMsg);

    // Incrementa contador de não lidas
    await incrementUnreadCount(chatId);

    // Se urgente, cria notificação
    if (isUrgent) {
      await createUrgentNotification(chatId);
    }
  };

  // Incrementa contador de mensagens não lidas
  const incrementUnreadCount = async (chatId) => {
    const usersSnapshot = await get(ref(firebaseDb, `${basePath}/users`));
    const allUsers = Object.keys(usersSnapshot.val() || {});

    for (const user of allUsers) {
      if (user !== state.currentUser) {
        const userUnreadRef = ref(
          firebaseDb,
          `${basePath}/unreadMessages/${user}/${chatId}`,
        );
        await runTransaction(
          userUnreadRef,
          (currentCount) => (currentCount || 0) + 1,
        );
      }
    }
  };

  // **INÍCIO DA CORREÇÃO**
  // Cria notificação urgente
  const createUrgentNotification = async (chatId) => {
    const notificationPayload = { hasUnread: true, from: state.currentUser };
    const isPrivateChat = chatId !== 'geral_lojas';

    if (isPrivateChat) {
      // Se for um chat privado, notifica apenas o outro participante.
      const participants = chatId.split('_');
      const recipient = participants.find((p) => p !== state.currentUser);

      if (recipient) {
        await set(
          ref(
            firebaseDb,
            `${basePath}/unreadUrgentNotifications/${recipient}/${chatId}`,
          ),
          notificationPayload,
        );
      }
    } else {
      // Se for um chat de grupo, notifica todos, exceto o remetente.
      const usersSnapshot = await get(ref(firebaseDb, `${basePath}/users`));
      const allUsers = Object.keys(usersSnapshot.val() || {});

      for (const user of allUsers) {
        if (user !== state.currentUser) {
          await set(
            ref(
              firebaseDb,
              `${basePath}/unreadUrgentNotifications/${user}/${chatId}`,
            ),
            notificationPayload,
          );
        }
      }
    }
  };
  // **FIM DA CORREÇÃO**

  // Marca mensagens como lidas
  const markMessagesAsRead = (chatId) => {
    if (!state.currentUser) return;
    const userUnreadRef = ref(
      firebaseDb,
      `${basePath}/unreadMessages/${state.currentUser}/${chatId}`,
    );
    set(userUnreadRef, 0);
  };

  // Remove notificação urgente
  const removeUrgentNotification = (chatId) => {
    if (!state.currentUser) return;
    remove(
      ref(
        firebaseDb,
        `${basePath}/unreadUrgentNotifications/${state.currentUser}/${chatId}`,
      ),
    );
  };

  // Função para abrir janelas do Electron
  const openStockQuery = () => {
    if (window.electronAPI?.openStockWindow) {
      window.electronAPI.openStockWindow();
    } else {
      console.warn(
        'API do Electron não disponível para abrir janela de estoque',
      );
    }
  };

  const openManagement = () => {
    if (window.electronAPI?.openManagementWindow) {
      window.electronAPI.openManagementWindow();
    } else {
      console.warn(
        'API do Electron não disponível para abrir janela de gerenciamento',
      );
    }
  };

  // Lógica para lidar com o status de digitação
  const updateTypingStatus = async (isTyping) => {
    if (!state.currentChatId || !state.currentUser) return;
    const typingUserRef = ref(
      firebaseDb,
      `${basePath}/typing/${state.currentChatId}/${state.currentUser}`,
    );
    if (isTyping) {
      await set(typingUserRef, state.currentUser);
    } else {
      await remove(typingUserRef);
    }
  };

  useEffect(() => {
    if (!state.currentChatId) return;
    const typingChatRef = ref(
      firebaseDb,
      `${basePath}/typing/${state.currentChatId}`,
    );
    const unsubscribe = onValue(typingChatRef, (snapshot) => {
      const typingUsers = [];
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.key !== state.currentUser) {
          typingUsers.push(childSnapshot.val());
        }
      });
      dispatch({ type: 'SET_TYPING_USERS', payload: typingUsers });
    });
    return () => unsubscribe();
  }, [basePath, state.currentChatId, state.currentUser]);

  const value = {
    ...state,
    handleLogin,
    openChat,
    sendMessage,
    sendMessageChat,
    openStockQuery,
    openManagement,
    updateTypingStatus,
    // handleLocalStockQuery,
    isTaskBarVisible,
    setIsTaskBarVisible,
    db: firebaseDb,
    dbService,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
// eslint-disable-next-line react-refresh/only-export-components
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat deve ser usado dentro de um ChatProvider');
  }
  return context;
};
