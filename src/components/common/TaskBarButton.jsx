import React from 'react';

const TaskBarButton = ({ onClick, children, isActive = false, title = '' }) => {
  const handleClick = () => {
    console.log('Botão clicado! Chamando função...');
    if (onClick) {
      onClick();
    }
    console.log('Função chamada com sucesso!');
  };

  return (
    <button
      className={`rounded-full p-1 align-middle opacity-100 transition-colors duration-200 ${
        isActive
          ? 'bg-red-500 text-white'
          : 'text-red-500 hover:bg-gray-300 hover:text-gray-600'
      }`}
      onClick={handleClick}
      title={title}
    >
      {children}
    </button>
  );
};

export default TaskBarButton;
