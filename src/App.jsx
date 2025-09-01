import React, { useEffect, useState } from 'react';
import './App.css';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { useAlertHandler } from './hooks/useAlertHandler';
import LoginScreen from './components/common/LoginScreen';
import AlertOverlay from './components/common/AlertOverlay';
import Chat from './pages/Chat';
import Search from './pages/Search';
import Management from './pages/Management';
import TaskBar from './components/common/TaskBar';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import UpdateModal from './components/common/UpdateModal';
import RequestsModal from './components/common/RequestsModal'; // Import RequestsModal
import RequestsResponseModal from './components/common/RequestsResponseModal'; // Import RequestsModal

const AppContent = () => {
  const {
    currentUser,
    users,
    userStatuses,
    unreadCounts,
    urgentNotifications,
    messages,
    typingUsers,
    currentChatId,
    currentChatName,
    handleLogin,
    openChat,
    sendMessage,
    openStockQuery,
    openManagement,
  } = useChat();

  const {
    alertIsActive,
    alertMessage,
    triggerUrgentAlert,
    stopAlert,
    initializeAudioContext,
  } = useAlertHandler();

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('downloading'); // 'downloading' or 'downloaded'

  // State for RequestsModal
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [requestsModalData, setRequestsModalData] = useState(null);
  const [isRequestsResponseModalOpen, setIsRequestsResponseModalOpen] =
    useState(false);
  const [requestsResponseModalData, setRequestsResponseModalData] =
    useState(null);

  useEffect(() => {
    // Envia o evento para o processo principal assim que o app estiver pronto
    window.electron.ipcRenderer.send('app-ready');

    const handleUpdateAvailable = () => {
      setUpdateStatus('downloading');
      setShowUpdateModal(true);
    };

    const handleUpdateDownloaded = () => {
      setUpdateStatus('downloaded');
      setShowUpdateModal(true);
    };

    const handleUpdatePending = () => {
      setUpdateStatus('pending');
      setShowUpdateModal(true);
    };

    const handleOpenRequestModal = (event, data) => {
      console.log('[DEBUG] Evento IPC recebido:', event); // NOVO LOG
      setRequestsModalData(event);
      console.log('[DEBUG] Abrindo modal de solicitação:', event);
      setIsRequestsModalOpen(true);
      // triggerUrgentAlert('Nova solicitação de produto recebida!');
    };

    const handleOpenRequestResponseModal = (event, data) => {
      console.log('[DEBUG] Evento IPC Response recebido:', event); // NOVO LOG
      setRequestsResponseModalData(event);
      console.log('[DEBUG] Abrindo modal de Resposta de solicitação:', event);
      setIsRequestsResponseModalOpen(true);
      // triggerUrgentAlert('Resposta de solicitação de produto recebida!');
    };

    window.electron.ipcRenderer.on('update-available', handleUpdateAvailable);
    window.electron.ipcRenderer.on('update-downloaded', handleUpdateDownloaded);
    window.electron.ipcRenderer.on('update-pending', handleUpdatePending);
    window.electron.ipcRenderer.on(
      'open-request-modal',
      handleOpenRequestModal,
    ); // New listener
    window.electron.ipcRenderer.on(
      'open-request-response-modal',
      handleOpenRequestResponseModal,
    ); // New listener

    return () => {
      window.electron.ipcRenderer.removeListener(
        'update-available',
        handleUpdateAvailable,
      );
      window.electron.ipcRenderer.removeListener(
        'update-downloaded',
        handleUpdateDownloaded,
      );
      window.electron.ipcRenderer.removeListener(
        'update-pending',
        handleUpdatePending,
      );
      window.electron.ipcRenderer.removeListener(
        'open-request-modal',
        handleOpenRequestModal,
      ); // Cleanup new listener
    };
  }, []);

  const handleRestart = () => {
    window.electron.ipcRenderer.send('restart-app');
  };

  const handleLater = () => {
    setShowUpdateModal(false);
  };

  const handleCloseRequestsModal = () => {
    setIsRequestsModalOpen(false);
    setRequestsModalData(null);
  };

  const handleCloseRequestsResponseModal = () => {
    setIsRequestsResponseModalOpen(false);
    setRequestsResponseModalData(null);
  };

  // Inicializa o contexto de áudio na primeira interação do usuário
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

  // Monitora notificações urgentes para disparar alertas
  useEffect(() => {
    const hasUrgentNotifications = Object.keys(urgentNotifications).length > 0;

    if (hasUrgentNotifications && !alertIsActive) {
      // Encontra a primeira notificação urgente
      const firstUrgentChatId = Object.keys(urgentNotifications)[0];
      // const urgentNotification = urgentNotifications[firstUrgentChatId]; // This variable is not used

      let chatInfo = {
        id: firstUrgentChatId,
        name:
          firstUrgentChatId === 'geral_lojas'
            ? '📢 Geral - Todas as Lojas'
            : firstUrgentChatId,
      };

      // Tenta encontrar o nome do usuário se for um chat privado
      if (firstUrgentChatId !== 'geral_lojas') {
        const otherUserId = firstUrgentChatId
          .replace(currentUser, '')
          .replace('_', '');
        const otherUser = users.find((u) => u.id === otherUserId);
        if (otherUser) {
          chatInfo.name = otherUser.username;
        }
      }

      const alertText =
        firstUrgentChatId === 'geral_lojas'
          ? 'MENSAGEM URGENTE NO CHAT GERAL'
          : `MENSAGEM URGENTE DE ${chatInfo.name}`;

      console.log('[DEBUG] Disparando alerta para:', alertText, chatInfo);
      triggerUrgentAlert(alertText, chatInfo);
    }
  }, [
    urgentNotifications,
    alertIsActive,
    triggerUrgentAlert,
    users,
    currentUser,
  ]);

  // Função para enviar mensagem urgente
  const handleSendUrgentMessage = (text) => {
    sendMessage(text, true);
  };

  // Função para lidar com reações
  const handleReaction = (message, isConfirm) => {
    // const requester = message.senderName || message.sender; // 'requester' is assigned a value but never used.
    const productInfo = message.productInfo || null;
    const originalText = message.text || '';

    let reactionText;
    if (productInfo && (productInfo.PRODUTO || productInfo.CODIGO)) {
      reactionText = isConfirm
        ? `✔️ Confirmação: O produto "${productInfo.PRODUTO || ''}" (Código: ${productInfo.CODIGO || ''}) será transferido.`
        : `❌ Negado: O produto "${productInfo.PRODUTO || ''}" (Código: ${productInfo.CODIGO || ''}) não está disponível para transferência.`;
    } else {
      reactionText = isConfirm
        ? `✔️ Confirmação: "${originalText}"`
        : `❌ Negado: "${originalText}"`;
    }

    sendMessage(reactionText, false);
  };

  // Função para parar alerta
  const handleStopAlert = () => {
    stopAlert((chatInfo) => {
      if (chatInfo) {
        console.log('[DEBUG] Abrindo chat após parar alerta:', chatInfo);
        openChat(chatInfo.id, chatInfo.name);
      }
    });
  };

  // Auto-login se houver usuário salvo
  useEffect(() => {
    const lastUsername = localStorage.getItem('lastUsername');
    if (
      lastUsername &&
      lastUsername.trim() &&
      lastUsername.toLowerCase() !== 'null' &&
      !currentUser
    ) {
      console.log('[DEBUG] Auto-login com usuário salvo:', lastUsername);
      handleLogin(lastUsername);
    }
  }, [handleLogin, currentUser]);

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
                  userStatuses={userStatuses}
                  unreadCounts={unreadCounts}
                  urgentNotifications={urgentNotifications}
                  messages={messages}
                  typingUsers={typingUsers}
                  currentChatId={currentChatId}
                  currentChatName={currentChatName}
                  onChatSelect={openChat}
                  onSendMessage={sendMessage}
                  onSendUrgentMessage={handleSendUrgentMessage}
                  onReaction={handleReaction}
                  onOpenStockQuery={openStockQuery}
                  onOpenManagement={openManagement}
                />
              }
            />
            {/* Outras rotas serão implementadas pelo usuário */}
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
        onRestart={handleRestart}
        onLater={handleLater}
      />
      <RequestsModal
        isOpen={isRequestsModalOpen}
        onClose={handleCloseRequestsModal}
        requestData={requestsModalData}
        currentUser={currentUser}
      />
      <RequestsResponseModal
        isOpen={isRequestsResponseModalOpen}
        onClose={handleCloseRequestsResponseModal}
        requestData={requestsResponseModalData}
        currentUser={currentUser}
      />
    </div>
  );
};

function App() {
  return (
    <Router>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </Router>
  );
}

export default App;
