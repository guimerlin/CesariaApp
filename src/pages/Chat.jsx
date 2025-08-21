import React from 'react';
import ChatList from '../components/chat/ChatList';
import ConversationPanel from '../components/chat/ConversationPanel';

const Chat = ({
  currentUser,
  users,
  userStatuses,
  unreadCounts,
  urgentNotifications,
  messages,
  typingUsers,
  currentChatId,
  currentChatName,
  onChatSelect,
  onSendMessage,
  onSendUrgentMessage,
  onReaction,
}) => {
  return (
    <div className="flex h-full flex-1 flex-row">
      <ChatList
        users={users}
        userStatuses={userStatuses}
        unreadCounts={unreadCounts}
        urgentNotifications={urgentNotifications}
        currentUser={currentUser}
        onChatSelect={onChatSelect}
      />

      <ConversationPanel
        isVisible={!!currentChatId}
        chatName={currentChatName}
        messages={messages}
        typingUsers={typingUsers}
        currentUser={currentUser}
        onSendMessage={onSendMessage}
        onSendUrgentMessage={onSendUrgentMessage}
        onReaction={onReaction}
      />
    </div>
  );
};

export default Chat;
