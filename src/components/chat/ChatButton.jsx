import React from 'react';

const ChatButton = ({ 
  chatId, 
  chatName, 
  userId = null, 
  isOnline = false, 
  unreadCount = 0, 
  hasUrgentNotification = false,
  onClick 
}) => {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0]?.toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <button
      className="w-full text-left p-3 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors duration-200 flex items-center justify-between"
      onClick={() => onClick(chatId, chatName)}
    >
      <div className="flex items-center">
        {userId && (
          <span 
            className={`w-3 h-3 rounded-full mr-2 ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        )}
        <span>{chatName}</span>
      </div>
      
      <div className="flex items-center space-x-2">
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
            {unreadCount}
          </span>
        )}
        {hasUrgentNotification && (
          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
        )}
      </div>
    </button>
  );
};

export default ChatButton;

