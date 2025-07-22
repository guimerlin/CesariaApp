import React from 'react';
import { Search, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import ChatButton from './ChatButton';

const ChatList = ({ 
  users, 
  userStatuses, 
  unreadCounts, 
  urgentNotifications, 
  currentUser,
  onChatSelect,
  onOpenStockQuery,
  onOpenManagement 
}) => {
  return (
    <div className="w-1/4 bg-white border-r border-gray-200 p-4 flex flex-col shadow-lg flex-shrink-0 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-red-700">Conversas</h2>
        <div className="flex space-x-2">
          {/* Botão de Consulta de Estoque */}
          <Button
            onClick={onOpenStockQuery}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors duration-200 focus:ring-2 focus:ring-blue-400"
            title="Consulta de Estoque"
          >
            <Search className="h-4 w-4" />
          </Button>
          
          {/* Botão de Gerenciamento de Tabelas */}
          <Button
            onClick={onOpenManagement}
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors duration-200 focus:ring-2 focus:ring-green-400"
            title="Gerenciamento de Tabelas"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1">
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
          .filter(user => user.id !== currentUser)
          .map(user => {
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

