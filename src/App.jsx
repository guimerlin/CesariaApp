import React, { useEffect, useState } from 'react';
import './App.css';
import { UserProvider, useUser } from './contexts/UserContext';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { SearchContextProvider } from './contexts/SearchContext'; // Importar SearchContextProvider
import { useAlertHandler } from './hooks/useAlertHandler';
import LoginScreen from './components/common/LoginScreen';
import AlertOverlay from './components/common/AlertOverlay';
import Chat from './pages/Chat';
import Search from './pages/Search';
import Management from './pages/Management';
import TaskBar from './components/common/TaskBar';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import UpdateModal from './components/common/UpdateModal';
import CreateAccountModal from './components/common/CreateAccountModal';
import RequestsModal from './components/common/RequestsModal';
import RequestsResponseModal from './components/common/RequestsResponseModal';

const AppContent = () => {
  const { currentUser, isLoading } = useUser();
  const { urgentNotifications, openChat } = useChat();
  const {
    alertIsActive,
    alertMessage,
    triggerUrgentAlert,
    stopAlert,
  } = useAlertHandler();

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('downloading');
  const [isCreateAccountModalOpen, setCreateAccountModalOpen] = useState(false);

  // Mantendo a lógica dos modais de requisição por enquanto
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [requestsModalData, setRequestsModalData] = useState(null);
  const [isRequestsResponseModalOpen, setIsRequestsResponseModalOpen] = useState(false);
  const [requestsResponseModalData, setRequestsResponseModalData] = useState(null);

  // Efeitos para IPC (Update, Modals de requisição)
  useEffect(() => {
    window.electron.ipcRenderer.send('app-ready');

    const handleUpdateAvailable = () => { setUpdateStatus('downloading'); setShowUpdateModal(true); };
    const handleUpdateDownloaded = () => { setUpdateStatus('downloaded'); setShowUpdateModal(true); };
    const handleUpdatePending = () => { setUpdateStatus('pending'); setShowUpdateModal(true); };

    const handleOpenRequestModal = (event) => {
      setRequestsModalData(event);
      setIsRequestsModalOpen(true);
      triggerUrgentAlert('Nova solicitação de produto recebida!');
    };
    
    const handleOpenRequestResponseModal = (event) => {
      setRequestsResponseModalData(event);
      setIsRequestsResponseModalOpen(true);
      triggerUrgentAlert('Resposta de solicitação de produto recebida!');
    };

    window.electron.ipcRenderer.on('update-available', handleUpdateAvailable);
    window.electron.ipcRenderer.on('update-downloaded', handleUpdateDownloaded);
    window.electron.ipcRenderer.on('update-pending', handleUpdatePending);
    window.electron.ipcRenderer.on('open-request-modal', handleOpenRequestModal);
    window.electron.ipcRenderer.on('open-request-response-modal', handleOpenRequestResponseModal);
    
    return () => {
      window.electron.ipcRenderer.removeAllListeners('update-available');
      window.electron.ipcRenderer.removeAllListeners('update-downloaded');
      window.electron.ipcRenderer.removeAllListeners('update-pending');
      window.electron.ipcRenderer.removeAllListeners('open-request-modal');
      window.electron.ipcRenderer.removeAllListeners('open-request-response-modal');
    };
  }, [triggerUrgentAlert]);

  // Efeito para Alertas de Chat Urgente
  useEffect(() => {
    const hasUrgent = Object.keys(urgentNotifications).length > 0;
    if (hasUrgent && !alertIsActive) {
      const firstUrgentChatId = Object.keys(urgentNotifications)[0];
      const notification = urgentNotifications[firstUrgentChatId];
      const alertText = `MENSAGEM URGENTE DE ${notification.from.toUpperCase()}`;
      const chatInfo = { id: firstUrgentChatId, name: notification.from };
      triggerUrgentAlert(alertText, chatInfo);
    }
  }, [urgentNotifications, alertIsActive, triggerUrgentAlert]);

  const handleStopAlert = () => {
    stopAlert((chatInfo) => {
      if (chatInfo) {
        openChat(chatInfo.id, chatInfo.name);
      }
    });
  };

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-800">
      {!currentUser ? (
        <LoginScreen onShowCreateAccount={() => setCreateAccountModalOpen(true)} />
      ) : (
        <div className="flex h-full flex-1">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/stock" element={<Search />} />
            <Route path="/management" element={<Management />} />
          </Routes>
          <TaskBar />
        </div>
      )}

      <AlertOverlay
        isVisible={alertIsActive}
        alertMessage={alertMessage}
        onStopAlert={handleStopAlert}
      />
      <UpdateModal
        show={showUpdateModal}
        status={updateStatus}
        onRestart={() => window.electron.ipcRenderer.send('restart-app')}
        onLater={() => setShowUpdateModal(false)}
      />
      <CreateAccountModal
        isOpen={isCreateAccountModalOpen}
        onClose={() => setCreateAccountModalOpen(false)}
      />

      {/* Modais de requisição legados */}
      <RequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        requestData={requestsModalData}
        currentUser={currentUser?.name}
      />
      <RequestsResponseModal
        isOpen={isRequestsResponseModalOpen}
        onClose={() => setIsRequestsResponseModalOpen(false)}
        requestData={requestsResponseModalData}
        currentUser={currentUser?.name}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <UserProvider>
        <ChatProvider>
          <SearchContextProvider>
            <AppContent />
          </SearchContextProvider>
        </ChatProvider>
      </UserProvider>
    </Router>
  );
}

export default App;