import React, { useEffect, useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { useAlertHandler } from './hooks/useAlertHandler';
import LoginScreen from './components/common/LoginScreen';
import AlertOverlay from './components/common/AlertOverlay';
import Chat from './pages/Chat';
import Search from './pages/Search';
import Management from './pages/Management';
import TaskBar from './components/common/TaskBar';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import UpdateModal from './components/common/UpdateModal';
import RequestsModal from './components/common/RequestsModal';
import RequestsResponseModal from './components/common/RequestsResponseModal';

const AppContent = () => {
  // Hooks from new contexts
  const { user: currentUser, login: handleLogin } = useAuth();
  const { allUsers: users } = useUser();
  const {
    messages,
    activeChat: currentChatId,
    setActiveChat: openChat,
    sendMessage,
    getChatName,
  } = useChat();
  const { unreadCounts, urgentNotifications } = useNotification();

  // Alert handler hook
  const { alertIsActive, alertMessage, triggerUrgentAlert, stopAlert, initializeAudioContext } = useAlertHandler();

  // Local state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('downloading');
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [requestsModalData, setRequestsModalData] = useState(null);
  const [isRequestsResponseModalOpen, setIsRequestsResponseModalOpen] = useState(false);
  const [requestsResponseModalData, setRequestsResponseModalData] = useState(null);

  // Electron IPC listeners
  useEffect(() => {
    window.electron.ipcRenderer.send('app-ready');
    const listeners = {
      'update-available': () => { setUpdateStatus('downloading'); setShowUpdateModal(true); },
      'update-downloaded': () => { setUpdateStatus('downloaded'); setShowUpdateModal(true); },
      'update-pending': () => { setUpdateStatus('pending'); setShowUpdateModal(true); },
      'open-request-modal': (event) => { setRequestsModalData(event); setIsRequestsModalOpen(true); },
      'open-request-response-modal': (event) => { setRequestsResponseModalData(event); setIsRequestsResponseModalOpen(true); },
    };

    Object.entries(listeners).forEach(([channel, handler]) => {
      window.electron.ipcRenderer.on(channel, handler);
    });

    return () => {
      Object.keys(listeners).forEach(channel => {
        window.electron.ipcRenderer.removeAllListeners(channel);
      });
    };
  }, []);

  // Audio context initialization
  useEffect(() => {
    const handleFirstInteraction = () => {
      initializeAudioContext();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [initializeAudioContext]);

  // Urgent notifications effect
  useEffect(() => {
    const hasUrgentNotifications = Object.keys(urgentNotifications).length > 0;
    if (hasUrgentNotifications && !alertIsActive) {
      const firstUrgentChatId = Object.keys(urgentNotifications)[0];
      const notification = urgentNotifications[firstUrgentChatId];
      const chatName = getChatName(firstUrgentChatId, users) || notification.from;
      const chatInfo = { id: firstUrgentChatId, name: chatName };
      const alertText = `MENSAGEM URGENTE DE ${chatName.toUpperCase()}`;
      triggerUrgentAlert(alertText, chatInfo);
    }
  }, [urgentNotifications, alertIsActive, triggerUrgentAlert, getChatName, users]);

  // Handler functions
  const handleSendUrgentMessage = (text) => {
    if (currentChatId) {
      sendMessage(currentChatId, text, true);
    }
  };

  const handleStopAlert = () => {
    stopAlert((chatInfo) => {
      if (chatInfo) {
        openChat(chatInfo.id);
      }
    });
  };

  const handleRestart = () => window.electron.ipcRenderer.send('restart-app');
  const handleLater = () => setShowUpdateModal(false);
  const handleCloseRequestsModal = () => setIsRequestsModalOpen(false);
  const handleCloseRequestsResponseModal = () => setIsRequestsResponseModalOpen(false);

  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-800">
      <LoginScreen isVisible={!currentUser} onLogin={handleLogin} />
      {currentUser && (
        <div className="flex h-full flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <Chat
                  currentUser={currentUser}
                  users={users}
                  unreadCounts={unreadCounts}
                  messages={messages[currentChatId] || []}
                  currentChatId={currentChatId}
                  onChatSelect={openChat}
                  onSendMessage={sendMessage}
                  onSendUrgentMessage={handleSendUrgentMessage}
                  getChatName={(chatId) => getChatName(chatId, users)}
                />
              }
            />
            <Route path="/stock" element={<Search />} />
            <Route path="/management" element={<Management />} />
          </Routes>
          <TaskBar />
        </div>
      )}
      <AlertOverlay isVisible={alertIsActive} alertMessage={alertMessage} onStopAlert={handleStopAlert} />
      <UpdateModal show={showUpdateModal} status={updateStatus} onRestart={handleRestart} onLater={handleLater} />
      <RequestsModal isOpen={isRequestsModalOpen} onClose={handleCloseRequestsModal} requestData={requestsModalData} currentUser={currentUser} />
      <RequestsResponseModal isOpen={isRequestsResponseModalOpen} onClose={handleCloseRequestsResponseModal} requestData={requestsResponseModalData} currentUser={currentUser} />
    </div>
  );
};

const App = () => (
  <Router>
    <AuthProvider>
      <UserProvider>
        <ChatProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </ChatProvider>
      </UserProvider>
    </AuthProvider>
  </Router>
);

export default App;
