# 🚀 Cesaria App: Facilitando a Transferência de Produtos entre Lojas

## 📖 Visão Geral

O **Cesaria App** é uma aplicação desktop desenvolvida com o propósito principal de otimizar e facilitar a comunicação e a transferência de produtos entre as diversas lojas da Rede Cesaria. Originado do projeto **Cesaria Chat**, o aplicativo evoluiu para integrar funcionalidades essenciais de gerenciamento de estoque e dados, tornando-se uma ferramenta robusta para a operação diária.

## ✨ Funcionalidades Principais

- **Chat em Tempo Real:** Comunicação instantânea entre as lojas e usuários.
- **Alertas de Mensagens Urgentes:** Notificações visuais e sonoras para mensagens de alta prioridade.
- **Consulta de Estoque:** Permite consultar o estoque de produtos em diferentes lojas, utilizando integração com o banco de dados Firebird.
- **Gerenciamento de Tabelas Firebird:** Funcionalidade para pesquisar e visualizar dados de tabelas específicas do Firebird (como `DADOSPREVENDA` e `CLIENTES`), com filtros e formatação avançada.
- **Modularização:** Código organizado em componentes, hooks e serviços reutilizáveis para facilitar a manutenção e o desenvolvimento futuro.

## 💻 Tecnologias Utilizadas

O Cesaria App é construído com um stack de tecnologias modernas e eficientes:

- **Frontend:**
  - [**React**](https://react.dev/): Biblioteca JavaScript para construção de interfaces de usuário.
  - [**React Router DOM**](https://reactrouter.com/en/main): Para navegação e roteamento dentro da aplicação.
  - [**Tailwind CSS**](https://tailwindcss.com/): Framework CSS utilitário para estilização rápida e responsiva.
- **Backend (Electron Main Process):**
  - [**Electron**](https://www.electronjs.org/): Framework para construir aplicações desktop multiplataforma com tecnologias web.
  - [**Node.js**](https://nodejs.org/): Ambiente de execução JavaScript para o lado do servidor e comunicação IPC.
  - [**node-firebird**](https://www.npmjs.com/package/node-firebird): Driver Node.js para conexão e consulta a bancos de dados Firebird.
- **Banco de Dados em Tempo Real:**
  - [**Firebase Realtime Database**](https://firebase.google.com/docs/database): Utilizado para o sistema de chat, status de usuários e comunicação entre as instâncias do aplicativo nas diferentes lojas.

## 📂 Estrutura do Projeto

O projeto segue uma estrutura modular para organização do código:

```
src/
├── App.jsx                 # Componente principal da aplicação e roteamento
├── App.css                 # Estilos globais
├── components/             # Componentes reutilizáveis da UI
│   ├── common/             # Componentes genéricos (LoginScreen, AlertOverlay, TaskBar)
│   ├── management/         # Componentes específicos da página de gerenciamento
│   └── stock/              # Componentes específicos da página de estoque
├── contexts/               # Contextos React (ex: ChatContext)
├── hooks/                  # Hooks React customizados (ex: useChat, useFirebird, useStockSearch, useManagementSearch)
├── pages/                  # Páginas principais da aplicação (Chat, Search, Management)
├── services/               # Lógica de negócio e comunicação com APIs/Firebase (ex: stockService, managementService, firebirdService)
└── utils/                  # Funções utilitárias e configurações (ex: dbService, firebirdConfig)
```

## 🚀 Como Rodar o Projeto

Para configurar e executar o Cesaria App em seu ambiente local, siga os passos abaixo:

1.  **Clone o Repositório:**

    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd cesaria-app
    ```

2.  **Instale as Dependências:**
    Certifique-se de ter o [Node.js](https://nodejs.org/en/download/) e o [npm](https://www.npmjs.com/get-npm) (ou [Yarn](https://yarnpkg.com/)) instalados.

    ```bash
    npm install
    # ou
    yarn install
    ```

3.  **Configuração do Firebase:**
    - Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
    - Configure o Realtime Database e as regras de segurança.
    - Obtenha suas credenciais de configuração do Firebase (API Key, Auth Domain, Project ID, etc.).
    - Atualize as configurações do Firebase no arquivo `src/utils/firebaseConfig.js` (ou similar) do projeto.

4.  **Configuração do Firebird (Electron Main Process):**
    - O aplicativo se conecta a bancos de dados Firebird através do processo principal do Electron.
    - As configurações de conexão (host, porta, usuário, senha, caminho do banco de dados) são gerenciadas via `electron-main.js` e podem ser configuradas via interface do usuário (modal de configuração).
    - Certifique-se de que o `electron-main.js` (ou o arquivo onde os `ipcMain.handle` estão definidos) contém a lógica de conexão e consulta real ao seu banco de dados Firebird, utilizando o driver `node-firebird`.

5.  **Iniciar o Projeto (Modo de Desenvolvimento):**

    ```bash
    npm start
    # ou
    yarn start
    ```

    Isso iniciará a aplicação Electron em modo de desenvolvimento.

6.  **Fazer o Build (Opcional):**
    Para gerar um build de produção do aplicativo (executável para Windows, macOS, Linux), você pode usar um comando como:
    ```bash
    npm run build
    # ou
    yarn build
    ```
    (Este comando pode variar dependendo da sua configuração de build do Electron).

## 🤝 Contribuição

Sinta-se à vontade para contribuir com o projeto. Para isso, siga os passos de configuração e envie suas pull requests.

## 📄 Licença

[Adicione sua licença aqui, ex: MIT License]
