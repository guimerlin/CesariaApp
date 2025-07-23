import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const LoginScreen = ({ onLogin, isVisible }) => {
  const [username, setUsername] = useState('');
  const [loginStatus, setLoginStatus] = useState('');

  useEffect(() => {
    // Carrega o último nome de usuário do localStorage
    const lastUsername = localStorage.getItem('lastUsername');
    if (
      lastUsername &&
      lastUsername.trim() &&
      lastUsername.toLowerCase() !== 'null'
    ) {
      setUsername(lastUsername);
    }
  }, []);

  const handleLogin = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || trimmedUsername.toLowerCase() === 'null') {
      setLoginStatus('Digite um nome de usuário válido.');
      return;
    }

    localStorage.setItem('lastUsername', trimmedUsername);
    onLogin(trimmedUsername);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-200">
      <div className="absolute inset-0 bg-gradient-to-br from-red-100 via-red-50 to-gray-100 backdrop-blur-sm backdrop-filter"></div>
      <div className="relative flex w-96 flex-col items-center rounded-xl bg-white p-8 text-center shadow-2xl">
        <img
          src="../assets/cesariadigital.png"
          alt="Logo Cesaria Chat"
          className="mx-auto mb-5 h-24 w-24"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <h1 className="mb-2 text-2xl font-bold text-red-700">Cesaria Chat</h1>
        <p className="mb-6 text-gray-600">Entre com seu nome de usuário</p>
        <Input
          type="text"
          placeholder="Seu nome de usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mb-4 w-full focus:ring-2 focus:ring-red-400"
        />
        <Button
          onClick={handleLogin}
          className="w-full bg-red-600 font-semibold text-white transition-colors duration-200 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Entrar
        </Button>
        {loginStatus && (
          <p className="mt-4 h-5 text-sm text-red-500">{loginStatus}</p>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
