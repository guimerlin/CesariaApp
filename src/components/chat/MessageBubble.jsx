import React from 'react';

const MessageBubble = ({
  message,
  isCurrentUser,
  showReactions = false,
  onConfirm,
  onDeny,
}) => {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((part) => part[0]?.toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(
      typeof timestamp === 'object' && timestamp.seconds
        ? timestamp.seconds * 1000
        : Number(timestamp),
    );

    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isCurrentUser && (
        <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-semibold text-white">
          {getInitials(message.senderName || message.sender)}
        </div>
      )}

      <div className="flex max-w-xs flex-col lg:max-w-md">
        <div
          className={`rounded-lg px-4 py-2 ${
            isCurrentUser
              ? 'bg-red-600 text-white'
              : message.urgent
                ? 'border-2 border-yellow-400 bg-yellow-100 text-gray-800'
                : 'bg-gray-200 text-gray-800'
          }`}
        >
          <div className="mb-1 text-xs font-semibold">
            {message.urgent ? '🚨 ' : ''}
            {message.senderName || message.sender}
            {message.urgent ? ' (URGENTE)' : ''}
          </div>
          <div
            className="text-sm break-words"
            dangerouslySetInnerHTML={{ __html: message.text }}
          />
          <div className="mt-1 text-xs opacity-70">
            {formatTime(message.timestamp)}
          </div>
        </div>

        {/* Reações rápidas para mensagens urgentes */}
        {showReactions && message.urgent && !isCurrentUser && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={onConfirm}
              className="rounded bg-green-500 px-3 py-1 text-sm text-white transition-colors hover:bg-green-600"
            >
              ✔️ Confirmar
            </button>
            <button
              onClick={onDeny}
              className="rounded bg-red-500 px-3 py-1 text-sm text-white transition-colors hover:bg-red-600"
            >
              ❌ Negar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
