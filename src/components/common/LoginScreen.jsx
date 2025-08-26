import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useUser } from '../../contexts/UserContext';
import { Separator } from '../ui/separator';

const LoginScreen = ({ onShowCreateAccount }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmail, signInWithGoogle, error } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    await signInWithEmail(email, password);
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

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
        <p className="mb-6 text-gray-600">Faça login para continuar</p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full focus:ring-2 focus:ring-red-400"
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full focus:ring-2 focus:ring-red-400"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-red-600 font-semibold text-white transition-colors duration-200 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Entrar
          </Button>
        </form>

        <Separator className="my-4" />

        <Button
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full"
        >
          Entrar com Google
        </Button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Button variant="link" className="p-0 text-red-600" onClick={onShowCreateAccount}>
              Crie uma agora
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
