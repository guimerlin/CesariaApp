import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const LoginScreen = ({ onLogin, isVisible }) => {
  const [username, setUsername] = useState('');
  const [loginStatus, setLoginStatus] = useState('');

  useEffect(() => {
    // Carrega o último nome de usuário do localStorage
    const lastUsername = localStorage.getItem('lastUsername');
    if (lastUsername && lastUsername.trim() && lastUsername.toLowerCase() !== "null") {
      setUsername(lastUsername);
    }
  }, []);

  const handleLogin = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || trimmedUsername.toLowerCase() === "null") {
      setLoginStatus("Digite um nome de usuário válido.");
      return;
    }
    
    localStorage.setItem('lastUsername', trimmedUsername);
    onLogin(trimmedUsername);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-200 z-50">
      <div className="absolute inset-0 bg-gradient-to-br from-red-100 via-red-50 to-gray-100 backdrop-filter backdrop-blur-sm"></div>
      <div className="relative bg-white p-8 rounded-xl shadow-2xl w-96 text-center flex flex-col items-center">
        <img 
          src="/src/assets/cesaria.ico" 
          alt="Logo Cesaria Chat" 
          className="w-24 h-24 mx-auto mb-5"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <h1 className="text-2xl font-bold mb-2 text-red-700">Cesaria Chat</h1>
        <p className="text-gray-600 mb-6">Entre com seu nome de usuário</p>
        <Input
          type="text"
          placeholder="Seu nome de usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full mb-4 focus:ring-2 focus:ring-red-400"
        />
        <Button
          onClick={handleLogin}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Entrar
        </Button>
        {loginStatus && (
          <p className="mt-4 text-sm text-red-500 h-5">{loginStatus}</p>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;

