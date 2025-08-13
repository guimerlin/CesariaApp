import React, { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TaskBarButton from './TaskBarButton';
import { Home, Search, CreditCard, Settings } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

const TaskBar = () => {
  const { isTaskBarVisible, setIsTaskBarVisible } = useChat();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'F1') {
        event.preventDefault();
        setIsTaskBarVisible((prevIsTaskBarVisible) => !prevIsTaskBarVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (!isTaskBarVisible) {
    return null;
  }

  return (
    <div className="fixed right-20 bottom-3 left-20 z-40 flex h-10 items-center justify-around rounded-full bg-gray-700/90 px-4 align-middle text-white shadow-md">
      <TaskBarButton
        onClick={() => handleNavigation('/')}
        isActive={location.pathname === '/'}
        title="Chat"
      >
        <Home className="h-6 w-6" />
      </TaskBarButton>

      <TaskBarButton
        onClick={() => handleNavigation('/stock')}
        isActive={location.pathname === '/stock'}
        title="Consulta de Estoque"
      >
        <Search className="h-6 w-6" />
      </TaskBarButton>

      <TaskBarButton
        onClick={() => handleNavigation('/management')}
        isActive={location.pathname === '/management'}
        title="Gerenciamento"
      >
        <Settings className="h-6 w-6" />
      </TaskBarButton>
    </div>
  );
};

export default TaskBar;
