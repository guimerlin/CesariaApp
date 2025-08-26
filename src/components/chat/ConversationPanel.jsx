import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import MessageBubble from './MessageBubble';
import { useChat } from '../../contexts/ChatContext';
import { useUser } from '../../contexts/UserContext';

const ConversationPanel = () => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  const {
    currentChatId,
    currentChatName,
    messages,
    sendMessage,
  } = useChat();
  const { currentUser } = useUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (isUrgent = false) => {
    const text = messageText.trim();
    if (text) {
      sendMessage(text, isUrgent);
      setMessageText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(false);
    }
  };

  if (!currentChatId) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <h2 className="mb-2 text-xl font-semibold">Selecione uma conversa</h2>
          <p>Escolha um chat na lista à esquerda para começar a conversar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-gray-50">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between bg-white p-4 shadow-md">
        <h2 className="flex-1 text-center text-xl font-bold text-gray-800">
          {currentChatName}
        </h2>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-2 text-lg">Nenhuma mensagem ainda</p>
              <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.senderId === currentUser.uid}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex items-center gap-2 border-t border-gray-200 bg-white p-4">
        <Input
          id="messageInput"
          type="text"
          placeholder="Digite sua mensagem..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 focus:ring-2 focus:ring-red-400"
        />
        <Button
          onClick={() => handleSendMessage(false)}
          disabled={!messageText.trim()}
          className="bg-red-600 font-semibold text-white transition-colors duration-200 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Enviar
        </Button>
        <Button
          onClick={() => handleSendMessage(true)}
          disabled={!messageText.trim()}
          className="bg-yellow-400 font-semibold text-red-900 transition-colors duration-200 hover:bg-yellow-500 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
        >
          Urgente
        </Button>
      </div>
    </div>
  );
};

export default ConversationPanel;
