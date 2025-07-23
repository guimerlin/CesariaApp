import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TaskBarButton from './TaskBarButton';
import { Home, Search, CreditCard, Settings } from 'lucide-react';

const TaskBar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'F1') {
        event.preventDefault();
        setIsVisible((prevIsVisible) => !prevIsVisible);
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

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed right-20 bottom-3 left-20 z-40 flex h-10 items-center justify-around rounded-full bg-gray-200 px-4 align-middle text-white shadow-md">
      <img
        src="../assets/cesariadigital.png"
        alt="TaskBar Icon"
        className="h-6 w-6"
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />

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

      {/* Botão adicional para futuras funcionalidades */}
      <TaskBarButton
        onClick={() => console.log('Funcionalidade futura')}
        isActive={false}
        title="Em breve"
      >
        <CreditCard className="h-6 w-6" />
      </TaskBarButton>
    </div>
  );
};

export default TaskBar;
