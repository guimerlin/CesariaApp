import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import MessageBubble from './MessageBubble';

const ConversationPanel = ({
  isVisible,
  chatName,
  messages,
  typingUsers,
  currentUser,
  onSendMessage,
  onSendUrgentMessage,
  onReaction,
  updateTypingStatus,
}) => {
  const [messageText, setMessageText] = useState('');
  const [lastUrgentMessage, setLastUrgentMessage] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Encontra a última mensagem urgente recebida
    const urgentMessages = messages.filter(
      (msg) => msg.urgent && (msg.senderName || msg.sender) !== currentUser,
    );

    if (urgentMessages.length > 0) {
      setLastUrgentMessage(urgentMessages[urgentMessages.length - 1]);
    } else {
      setLastUrgentMessage(null);
    }
  }, [messages, currentUser]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessageText(text);

    // Gerencia status de digitação
    if (updateTypingStatus) {
      if (text.length > 0) {
        updateTypingStatus(true);

        // Limpa timeout anterior
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }

        // Define novo timeout para parar de digitar
        const newTimeout = setTimeout(() => {
          updateTypingStatus(false);
        }, 3000);

        setTypingTimeout(newTimeout);
      } else {
        updateTypingStatus(false);
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          setTypingTimeout(null);
        }
      }
    }
  };

  const handleSendMessage = () => {
    const text = messageText.trim();

    // Intercepta o comando /stock para consulta local de teste
    if (text.startsWith('/stock ')) {
      const searchTerm = text.substring(7).trim();
      if (searchTerm) {
        // Adiciona mensagem do sistema informando que a consulta está sendo processada
        const systemMessage = `Consultando estoque para: "${searchTerm}"...`;
        onSendMessage(systemMessage, false);

        // Aqui você pode implementar a lógica de consulta de estoque
        // Por enquanto, apenas simula uma resposta
        setTimeout(() => {
          const responseMessage = `Resultado da consulta de estoque para "${searchTerm}": Funcionalidade será implementada na página de Estoque.`;
          onSendMessage(responseMessage, false);
        }, 1000);
      } else {
        // Adiciona mensagem de erro localmente
        const errorMessage =
          'Por favor, forneça um termo para a busca. Ex: /stock sabonete';
        onSendMessage(errorMessage, false);
      }
      setMessageText('');

      // Para o status de digitação
      if (updateTypingStatus) {
        updateTypingStatus(false);
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      return;
    }

    if (text) {
      onSendMessage(text);
      setMessageText('');

      // Para o status de digitação
      if (updateTypingStatus) {
        updateTypingStatus(false);
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

  const handleSendUrgentMessage = () => {
    const text = messageText.trim();
    if (text) {
      onSendUrgentMessage(text);
      setMessageText('');

      // Para o status de digitação
      if (updateTypingStatus) {
        updateTypingStatus(false);
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = (isConfirm) => {
    if (lastUrgentMessage && onReaction) {
      onReaction(lastUrgentMessage, isConfirm);
      setLastUrgentMessage(null);
    }
  };

  // Cleanup do timeout quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      if (updateTypingStatus) {
        updateTypingStatus(false);
      }
    };
  }, []);

  if (!isVisible) {
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
          {chatName}
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
          messages.map((message, index) => (
            <MessageBubble
              key={message.id || index}
              message={message}
              isCurrentUser={
                (message.senderName || message.sender) === currentUser
              }
              showReactions={
                lastUrgentMessage &&
                lastUrgentMessage.id === message.id &&
                message.urgent &&
                (message.senderName || message.sender) !== currentUser
              }
              onConfirm={() => handleReaction(true)}
              onDeny={() => handleReaction(false)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500 italic">
          {typingUsers.length === 1
            ? `${typingUsers[0]} está digitando...`
            : `${typingUsers.join(', ')} estão digitando...`}
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-center gap-2 border-t border-gray-200 bg-white p-4">
        <Input
          id="messageInput"
          type="text"
          placeholder="Digite sua mensagem..."
          value={messageText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-1 focus:ring-2 focus:ring-red-400"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!messageText.trim()}
          className="bg-red-600 font-semibold text-white transition-colors duration-200 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Enviar
        </Button>
        <Button
          onClick={handleSendUrgentMessage}
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
