import React from 'react';
import { AlignJustify } from 'lucide-react';
import { Button } from '../ui/button';
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
  const { setIsTaskBarVisible } = useChat();
  return (
    <div className="flex h-full w-1/4 flex-shrink-0 flex-col border-r border-gray-200 bg-white p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-red-700">Conversas</h2>
        <div className="flex space-x-2">
          {/* Botão de Barra de Tarefas */}
          <Button
            onClick={() => setIsTaskBarVisible((prev) => !prev)}
            size="sm"
            className="rounded-full bg-red-500 p-2 text-white transition-colors duration-100 hover:bg-red-600"
            title="Gerenciamento de Tabelas"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>
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
