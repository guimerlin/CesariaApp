import React from 'react';
import ChatButton from './ChatButton';
import { useChat } from '../../contexts/ChatContext';

const ChatList = ({
  users,
  userStatuses,
  unreadCounts,
  urgentNotifications,
  currentUser,
  onChatSelect,
}) => {
  return (
    <div className="flex h-full w-1/4 flex-shrink-0 flex-col border-r border-gray-200 bg-white p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-red-700">Conversas</h2>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto">
        {/* Chat Geral */}
        <ChatButton
          chatId="geral_lojas"
          chatName="📢 Geral - Todas as Lojas"
          unreadCount={unreadCounts?.['geral_lojas'] || 0}
          hasUrgentNotification={urgentNotifications?.['geral_lojas'] || false}
          onClick={onChatSelect}
        />

        {/* Chats Privados */}
        {users
          .filter((user) => user.id !== currentUser)
          .map((user) => {
            const chatId = [currentUser, user.id].sort().join('_');
            const isOnline = userStatuses?.[user.id]?.state === 'online';

            return (
              <ChatButton
                key={user.id}
                chatId={chatId}
                chatName={user.username}
                userId={user.id}
                isOnline={isOnline}
                unreadCount={unreadCounts?.[chatId] || 0}
                hasUrgentNotification={urgentNotifications?.[chatId] || false}
                onClick={onChatSelect}
              />
            );
          })}
      </div>
    </div>
  );
};

export default ChatList;
