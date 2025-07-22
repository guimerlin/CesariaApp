import React, { useEffect } from 'react';
import './App.css';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { useAlertHandler } from './hooks/useAlertHandler';
import LoginScreen from './components/common/LoginScreen';
import AlertOverlay from './components/common/AlertOverlay';
import Chat from './pages/Chat';
import Search from './pages/Search';
import Management from './pages/Management';
import TaskBar from './components/common/TaskBar';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

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
