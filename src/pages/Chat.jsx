import React from 'react';
import ChatList from '../components/chat/ChatList';
import ConversationPanel from '../components/chat/ConversationPanel';

const Chat = () => {
  return (
    <div className="flex h-full flex-1 flex-row">
      <ChatList />
      <ConversationPanel />
    </div>
  );
};

export default Chat;
