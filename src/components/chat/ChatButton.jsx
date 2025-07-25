import React from 'react';

const ChatButton = ({
  chatId,
  chatName,
  userId = null,
  isOnline = false,
  unreadCount = 0,
  hasUrgentNotification = false,
  onClick,
}) => {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((part) => part[0]?.toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <button
      className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors duration-200 hover:bg-gray-200 focus:ring-2 focus:ring-red-400 focus:outline-none"
      onClick={() => onClick(chatId, chatName)}
    >
      <div className="relative flex items-center">
        {userId && (
          <>
            <span
              className={`absolute mr-2 inline-flex h-3 w-3 rounded-full ${
                isOnline ? 'animate-ping bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span
              className={`relative mr-2 inline-flex h-3 w-3 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </>
        )}
        <span>{chatName}</span>
      </div>

      <div className="flex items-center space-x-2">
        {unreadCount > 0 && (
          <span className="min-w-[20px] rounded-full bg-red-500 px-2 py-1 text-center text-xs text-white">
            {unreadCount}
          </span>
        )}
        {hasUrgentNotification && (
          <span className="h-3 w-3 rounded-full bg-red-500"></span>
        )}
      </div>
    </button>
  );
};

export default ChatButton;
