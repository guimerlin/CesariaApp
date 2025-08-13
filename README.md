<div align="center">
  <img src="https://raw.githubusercontent.com/simandromeda/newbegin/main/assets/cesariadigital.png" alt="Logo Cesaria Digital" width="200"/>
  <h1>Cesaria App</h1>
  <p><strong>Aplicação desktop para comunicação e gestão de produtos entre lojas.</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow" alt="Status do Projeto: Em Desenvolvimento">
    <img src="https://img.shields.io/badge/Electron-494949?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  </p>
</div>

---

## 📖 Visão Geral

O **Cesaria App** é uma aplicação desktop robusta, construída com **Electron** e **React**, projetada para modernizar e centralizar a comunicação e a gestão de operações entre as lojas da Rede Cesaria. Em um ambiente de varejo dinâmico, a comunicação ágil e o acesso rápido a informações de estoque são cruciais para o sucesso. O Cesaria App nasceu da necessidade de substituir métodos de comunicação fragmentados (como telefone e aplicativos de mensagens pessoais) por uma plataforma unificada e segura. A ferramenta evoluiu de um simples chat para uma solução completa, integrando consulta de estoque e gerenciamento de dados diretamente de bancos de dados **Firebird**, com uma interface de usuário moderna e reativa que não exige conhecimento técnico avançado dos operadores.

---

## ✨ Funcionalidades Principais

- **💬 Chat em Tempo Real:** O coração da aplicação. Permite a comunicação instantânea e organizada entre as lojas, com suporte para conversas individuais e em grupo. O sistema inclui status de usuário (online/offline/ausente) e indicadores de mensagens não lidas, garantindo que as solicitações sejam vistas e respondidas prontamente.

- **🚨 Alertas de Urgência:** Para situações críticas, como a busca por um produto para um cliente que está aguardando na loja, os usuários podem enviar mensagens com um marcador de urgência. Isso dispara uma notificação sonora e visual destacada na tela do destinatário, garantindo atenção imediata.

- **📦 Consulta de Estoque Multi-loja:** Uma interface dedicada e poderosa que permite aos funcionários buscar produtos por código, descrição ou código de barras. Os resultados são agregados e exibidos de forma clara, mostrando a quantidade disponível em cada uma das lojas da rede, agilizando a localização de itens para transferência.

- **📊 Gerenciamento de Dados:** Esta ferramenta avançada concede acesso controlado para consultas diretas em tabelas do banco de dados Firebird, como `CLIENTES` e `DADOSPREVENDA`. Com filtros dinâmicos, um gerente pode, por exemplo, obter uma lista de clientes que compraram um determinado item ou analisar dados de pré-vendas de um período específico, tudo isso através de uma interface gráfica, sem a necessidade de escrever queries SQL.

- **⚙️ Configuração Descomplicada:** Através de um modal de configurações intuitivo, o usuário final pode facilmente adicionar, editar ou remover os parâmetros de conexão com os bancos de dados Firebird de cada loja. Isso elimina a necessidade de intervenção técnica para alterar arquivos de configuração, dando autonomia às lojas.

- **🎨 Interface Moderna:** Construída com **Tailwind CSS** e uma biblioteca de componentes inspirada em **shadcn/ui**, a aplicação oferece uma experiência de usuário limpa, consistente e responsiva. O design foi pensado para ser funcional e agradável, reduzindo a curva de aprendizado.

---

## 💻 Arquitetura e Tecnologias

O Cesaria App utiliza a arquitetura do Electron, que inteligentemente divide a aplicação em dois processos para máxima segurança e performance:

1.  **Processo Principal (`electron-main.js`):**
    - Atua como o backend da aplicação, rodando em um ambiente **Node.js** completo. Isso lhe dá acesso total aos recursos do sistema operacional.
    - É responsável por gerenciar o ciclo de vida da aplicação (criação de janelas, menus, atalhos) e todas as interações com o sistema de arquivos e redes.
    - Crucialmente, é o **único processo que se comunica com o banco de dados Firebird**, utilizando o driver `node-firebird`. Ele recebe solicitações do frontend, executa as queries de forma segura e retorna os resultados através de canais de comunicação IPC (`ipcMain`), prevenindo qualquer tipo de acesso direto e inseguro ao banco de dados pelo frontend.

2.  **Processo de Renderização (Frontend):**
    - É a interface gráfica da aplicação, onde toda a mágica do **React** acontece. Cada janela do Electron roda seu próprio processo de renderização.
    - É essencialmente um ambiente de navegador web, portanto, por questões de segurança, ele não pode acessar diretamente o sistema de arquivos ou bancos de dados locais.
    - Ele se comunica com o Processo Principal através de uma "ponte" segura estabelecida pelo script de pré-carregamento (`electron-preload.js`). Este script expõe uma API global e segura (`window.api`) que o React pode usar para enviar solicitações de consulta ao banco de dados e receber os dados de volta.

| Categoria                  | Tecnologia                                                                             | Papel e Justificativa da Escolha                                                                                                                                                                                         |
| :------------------------- | :------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Desktop Framework**      | [**Electron**](https://www.electronjs.org/)                                            | Escolhido por permitir o desenvolvimento de aplicações desktop multiplataforma usando tecnologias web (HTML, CSS, JS), o que acelera o desenvolvimento e facilita a manutenção.                                          |
| **Frontend**               | [**React**](https://react.dev/)                                                        | Selecionado por sua arquitetura baseada em componentes, que promove a reutilização de código, e seu DOM virtual, que garante uma interface de usuário rápida e reativa.                                                  |
| **Estilização**            | [**Tailwind CSS**](https://tailwindcss.com/) & [**shadcn/ui**](https://ui.shadcn.com/) | Tailwind CSS foi escolhido por sua abordagem "utility-first", que permite criar designs complexos rapidamente. shadcn/ui oferece componentes acessíveis e customizáveis que aceleram ainda mais o desenvolvimento da UI. |
| **Roteamento**             | [**React Router DOM**](https://reactrouter.com/en/main)                                | É a solução padrão da comunidade React para gerenciar a navegação entre as diferentes telas (páginas) da aplicação de forma declarativa e eficiente.                                                                     |
| **Backend (Main Process)** | [**Node.js**](https://nodejs.org/)                                                     | É o ambiente de execução nativo do processo principal do Electron, fornecendo o poder necessário para operações de backend, como acesso a bancos de dados e ao sistema de arquivos.                                      |
| **Banco de Dados (Local)** | [**node-firebird**](https://www.npmjs.com/package/node-firebird)                       | Driver essencial para a comunicação com o legado de bancos de dados Firebird existentes nas lojas, permitindo a integração direta com os sistemas de gestão atuais.                                                      |
| **Banco de Dados (Cloud)** | [**Firebase Realtime Database**](https://firebase.google.com/docs/database)            | Escolhido por sua capacidade de sincronização de dados em tempo real com baixa latência, o que é perfeito para a implementação do sistema de chat e status de presença dos usuários.                                     |
| **Build Tool**             | [**Vite**](https://vitejs.dev/)                                                        | Selecionado por sua performance superior em ambiente de desenvolvimento, oferecendo um servidor de desenvolvimento extremamente rápido com Hot Module Replacement (HMR) instantâneo.                                     |

---

## 📂 Estrutura Detalhada do Projeto

O projeto é organizado de forma modular para facilitar a manutenção, escalabilidade e a colaboração entre desenvolvedores.

/
├── electron-main.js # Ponto de entrada do Electron (Processo Principal). Gerencia janelas e canais IPC.
├── electron-preload.js # Ponte de segurança que expõe APIs do Node (via contextBridge) para o React.
├── config.json # Arquivo de configuração para os bancos de dados. Gerenciado pela UI.
├── src/
│ ├── main.jsx # Ponto de entrada da aplicação React. Renderiza o componente App.
│ ├── App.jsx # Componente raiz com o provedor de contexto, o roteador e o layout principal da aplicação.
│ ├── index.css # Arquivo de estilos globais e configuração do Tailwind CSS.
│ ├── components/ # Contém todos os componentes de UI reutilizáveis.
│ │ ├── chat/ # Componentes específicos do Chat (lista de conversas, balão de mensagem, etc.).
│ │ ├── common/ # Componentes genéricos usados em várias telas (Login, Barra de Tarefas, Alertas).
│ │ ├── management/ # Componentes da tela de Gestão de Dados (filtros, tabela de resultados).
│ │ ├── stock/ # Componentes da tela de Consulta de Estoque (input de busca, tabela de estoque).
│ │ └── ui/ # Componentes base (shadcn/ui) como Button, Input, Card, etc.
│ ├── contexts/ # Contextos React para gerenciamento de estado global.
│ │ └── ChatContext.jsx # Centraliza todo o estado e a lógica do chat (mensagens, usuários, etc.).
│ ├── hooks/ # Hooks customizados para encapsular lógicas complexas e reutilizáveis.
│ │ ├── useStockSearch.jsx # Gerencia o estado (loading, error, data) e a lógica da busca de estoque.
│ │ └── useManagementSearch.jsx # Lógica similar, mas para a tela de gestão de dados.
│ ├── pages/ # Componentes de página que representam as telas principais da aplicação.
│ │ ├── Chat.jsx
│ │ ├── Search.jsx # (Consulta de Estoque)
│ │ ├── Management.jsx
│ │ └── Settings.jsx
│ ├── services/ # Camada de abstração para comunicação com o backend (Processo Principal).
│ │ └── firebirdService.jsx # Contém funções que chamam a API do Electron para executar queries no Firebird.
│ └── utils/ # Configurações e funções utilitárias.
│ └── firebaseConfig.js # Objeto de configuração para inicializar a conexão com o Firebase.
└── ...

---

## 🚀 Guia de Instalação e Execução

Siga os passos abaixo para configurar e rodar o projeto em seu ambiente de desenvolvimento.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/download/) (versão LTS recomendada)
- [Git](https://git-scm.com/)

### Passos

1.  **Clone o repositório:**

    ```bash
    git clone [https://github.com/simandromeda/newbegin.git](https://github.com/simandromeda/newbegin.git)
    cd newbegin
    ```

2.  **Instale as dependências:**
    Este comando instalará todas as dependências listadas no `package.json`, tanto para o React (devDependencies) quanto para o Electron.

    ```bash
    npm install
    ```

3.  **Configure o Firebase:**
    - Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
    - No menu lateral, vá em **Build > Realtime Database** e crie um novo banco de dados.
    - Vá para as **Regras** (`Rules`) e configure-as para permitir leitura e escrita (para desenvolvimento, pode-se usar `".read": true, ".write": true`, mas para produção, regras mais restritivas são necessárias).
    - Volte para a página inicial do projeto, clique no ícone de engrenagem (`Project Settings`) e crie um novo **Aplicativo da Web** (`</>`).
    - Copie o objeto de configuração `firebaseConfig` e cole-o no arquivo `src/utils/firebaseConfig.js`.

4.  **Configure o Firebird:**
    - A conexão com o Firebird é gerenciada pelo arquivo `config.json` na raiz do projeto.
    - Você pode editar este arquivo manualmente, seguindo a estrutura de array de objetos, onde cada objeto representa uma loja.
    - A forma recomendada, no entanto, é iniciar o aplicativo e usar a **tela de Configurações** (`Settings`) para adicionar e salvar as credenciais de cada loja de forma segura e intuitiva.

5.  **Inicie a aplicação em modo de desenvolvimento:**
    Este comando iniciará o processo do Electron e, simultaneamente, o servidor de desenvolvimento do Vite para a aplicação React, com suporte a hot-reload.

    ```bash
    npm start
    ```

6.  **Compile para Produção (Build):**
    Para gerar os executáveis da aplicação (para Windows, Linux ou macOS), use o comando abaixo. Este comando utiliza o `electron-forge` para empacotar a aplicação em um formato distribuível. Os arquivos finais estarão na pasta `/out`.
    ```bash
    npm run make
    ```

---

## 🤝 Contribuição

Contribuições são muito bem-vindas! Se você deseja melhorar o projeto, siga nosso guia de contribuição:

1.  Faça um _fork_ do projeto para sua conta do GitHub.
2.  Crie uma nova _branch_ a partir da `main` para sua feature ou correção (`git checkout -b feature/nome-da-feature`).
3.  Desenvolva sua funcionalidade. Mantenha o estilo de código consistente (o projeto usa Prettier e ESLint para formatação automática).
4.  Faça o _commit_ das suas alterações com mensagens claras e descritivas (`git commit -m 'feat: Adiciona nova feature de exportação'`).
5.  Faça o _push_ da sua _branch_ para o seu _fork_ (`git push origin feature/nome-da-feature`).
6.  Abra um _Pull Request_ no repositório original, detalhando as alterações que você fez.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
