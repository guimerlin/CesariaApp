import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useUser } from '../../contexts/UserContext';

const CreateAccountModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiLink, setApiLink] = useState('');
  const [configJson, setConfigJson] = useState('');
  const [error, setError] = useState('');

  const { signUpWithEmail } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let parsedConfig = {};
    try {
      if (configJson.trim()) {
        parsedConfig = JSON.parse(configJson);
      }
    } catch {
      setError('O JSON de configuração é inválido. Por favor, verifique a sintaxe.');
      return;
    }

    if (!name || !email || !password || !apiLink) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const result = await signUpWithEmail(name, email, password, apiLink, parsedConfig);

    if (result.success) {
      onClose(); // Fecha o modal em caso de sucesso
    } else {
      setError(result.error || 'Ocorreu um erro ao criar a conta.');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Conta</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para criar uma nova conta de usuário.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Senha
              </Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiLink" className="text-right">
                Link da API
              </Label>
              <Input id="apiLink" value={apiLink} onChange={(e) => setApiLink(e.target.value)} className="col-span-3" placeholder="ex: minha-loja.com:3000" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="config" className="text-right pt-2">
                Config (JSON)
              </Label>
              <Textarea
                id="config"
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
                className="col-span-3"
                placeholder='Cole o conteúdo do seu config.json aqui...'
                rows={8}
              />
            </div>
            {error && <p className="col-span-4 text-center text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Criar Conta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAccountModal;
