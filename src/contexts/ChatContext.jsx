import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import { firestoreService } from '../utils/firestoreService';

const ChatContext = createContext(null);

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CHAT':
      return { ...state, currentChatId: action.payload.chatId, currentChatName: action.payload.chatName };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_UNREAD_COUNTS':
      return { ...state, unreadCounts: action.payload };
    case 'SET_URGENT_NOTIFICATIONS':
      return { ...state, urgentNotifications: action.payload };
    case 'SET_ALL_USERS':
      return { ...state, allUsers: action.payload };
    case 'SET_USER_STATUSES':
        return { ...state, userStatuses: action.payload };
    case 'CLEAR_CHAT':
      return { ...state, currentChatId: null, currentChatName: null, messages: [] };
    default:
      return state;
  }
};

const initialState = {
  isLoading: false,
  currentChatId: null,
  currentChatName: null,
  messages: [],
  unreadCounts: {},
  urgentNotifications: {},
  allUsers: [],
  userStatuses: {},
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { currentUser } = useUser();

  // Setup listeners when user logs in
  useEffect(() => {
    if (currentUser) {
      const unreadListenerKey = firestoreService.listenForUnreadCounts(currentUser.uid, (counts) => {
        dispatch({ type: 'SET_UNREAD_COUNTS', payload: counts });
      });

      const urgentNotifListenerKey = firestoreService.listenForUrgentNotifications(currentUser.uid, (notifications) => {
        dispatch({ type: 'SET_URGENT_NOTIFICATIONS', payload: notifications });
      });

      const userStatusListenerKey = firestoreService.listenForUserStatuses((statuses) => {
        dispatch({ type: 'SET_USER_STATUSES', payload: statuses });
      });

      const allUsersListenerKey = firestoreService.listenForAllUsers((users) => {
        dispatch({ type: 'SET_ALL_USERS', payload: users });
      });

      return () => {
        firestoreService.removeListener(unreadListenerKey);
        firestoreService.removeListener(urgentNotifListenerKey);
        firestoreService.removeListener(userStatusListenerKey);
        firestoreService.removeListener(allUsersListenerKey);
      };
    }
  }, [currentUser]);

  // Setup message listener when a chat is selected
  useEffect(() => {
    if (state.currentChatId) {
      const messageListenerKey = firestoreService.listenForMessages(state.currentChatId, (messages) => {
        dispatch({ type: 'SET_MESSAGES', payload: messages });
      });

      return () => {
        firestoreService.removeListener(messageListenerKey);
      };
    }
  }, [state.currentChatId]);

  const openChat = useCallback(async (chatId, chatName) => {
    if (!currentUser) return;
    dispatch({ type: 'SET_CHAT', payload: { chatId, chatName } });

    // Mark messages as read and remove notification
    await firestoreService.markMessagesAsRead(currentUser.uid, chatId);
    await firestoreService.removeUrgentNotification(currentUser.uid, chatId);
  }, [currentUser]);

  const sendMessage = useCallback(async (text, isUrgent = false) => {
    if (!text.trim() || !state.currentChatId || !currentUser) return;

    const messageData = {
      senderId: currentUser.uid,
      senderName: currentUser.name,
      text,
      isUrgent,
    };

    await firestoreService.sendMessage(state.currentChatId, messageData);

    // Create notifications for other users in the chat
    const recipients = [];
    if (state.currentChatId === 'geral_lojas') {
        // For the general chat, notify all users except the current one.
        recipients.push(...state.allUsers
            .filter(user => user.uid !== currentUser.uid)
            .map(user => user.uid)
        );
    } else {
        // Private chat ID is assumed to be 'uid1_uid2'
        const ids = state.currentChatId.split('_');
        const recipientId = ids.find(id => id !== currentUser.uid);
        if (recipientId) recipients.push(recipientId);
    }

    for (const recipientId of recipients) {
      await firestoreService.incrementUnreadCount(recipientId, state.currentChatId);
      if (isUrgent) {
        await firestoreService.createUrgentNotification(recipientId, state.currentChatId, {
          from: currentUser.name,
          timestamp: new Date(),
        });
      }
    }
  }, [currentUser, state.currentChatId]);


  const value = {
    ...state,
    openChat,
    sendMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
