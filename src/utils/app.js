// Importações dos módulos utilitários
import { initializeFirebase } from './utils/firebaseConfig.js';
import { DatabaseService } from './utils/dbService.js';
import { getFirebirdConfig, getFirebirdConfigForStore } from './utils/firebirdConfig.js';
import { alertHandler } from './utils/alertHandler.js';

// Importações do Firebase (mantidas para compatibilidade com código existente)
import { ref, push, onValue, set, update, serverTimestamp, get, remove, onDisconnect, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// Inicialização do Firebase usando o módulo utilitário
console.log("[DEBUG] Inicializando Firebase...");
const { app, db } = initializeFirebase();
console.log("[DEBUG] Firebase inicializado.");

// Inicialização do serviço de banco de dados
const dbService = new DatabaseService(db);

// Configurações do aplicativo (mantidas para compatibilidade)
const appId = "default-app-id";
const basePath = `artifacts/${appId}/public/data`;

let currentUser = null;
let currentChatId = null;
// ... (resto das variáveis)

// --- ELEMENTOS DOM (adicionar o novo botão) ---
const openStockQueryBtn = document.getElementById('openStockQueryBtn');
const openManagementBtn = document.getElementById('openManagementBtn');
// ... (resto dos elementos DOM existentes)
const loginScreen = document.getElementById('loginScreen');
const mainChatScreen = document.getElementById('mainChatScreen');
const usernameInput = document.getElementById('usernameInput');
const loginStatus = document.getElementById('loginStatus');
const chatListContainer = document.getElementById('chatListContainer');
const conversationPanel = document.getElementById('conversationPanel');
const conversationHeader = document.getElementById('conversationHeader');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');
const alertOverlay = document.getElementById('alertOverlay');
const alertMessage = document.getElementById('alertMessage');


// --- NOVA FUNÇÃO: OUVIR REQUISIÇÕES DE ESTOQUE ---
let stockRequestListener = null;
let tableRequestListener = null; // Listener para requisições de tabela

function listenForStockRequests() {
    if (stockRequestListener) {
        stockRequestListener(); // Remove o listener antigo
    }
    if (!currentUser) return;

    const requestsRef = ref(db, `${basePath}/stockRequests/${currentUser}`);
    console.log(`[DEBUG] Ouvindo requisições de estoque em: ${requestsRef.toString()}`);

    stockRequestListener = onValue(requestsRef, (snapshot) => {
        if (!snapshot.exists()) {
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const requestId = childSnapshot.key;
            const requestData = childSnapshot.val();
            console.log(`[DEBUG] Recebida requisição de estoque [${requestId}] de ${requestData.requesterId}`);
            
            // Processa a requisição
            handleStockRequest(requestId, requestData);

            // Remove a requisição para não processar de novo
            remove(childSnapshot.ref);
        });
    });
}

async function handleStockRequest(requestId, requestData) {
    try {
        const firebirdConfig = getFirebirdConfig();
        // Consulta o Firebird
        const result = await window.electronAPI.queryFirebird(firebirdConfig, requestData.searchTerm);

        // Monta o payload da resposta
        const answerPayload = {
            requestId: requestId,
            storeId: currentUser, // <-- ADICIONE ESTA LINHA!
            results: result.success ? result.data : null,
            error: result.success ? null : result.error,
            timestamp: Date.now()
        };

        // Envia a resposta para o nó da loja que fez o pedido
        const answerRef = ref(db, `${basePath}/stockRequestAnswers/${requestData.requesterId}/${requestId}`);
        await set(answerRef, answerPayload);
        console.log(`[DEBUG] Resposta para [${requestId}] enviada para ${requestData.requesterId}`);

        // Apaga a requisição do nó da loja que respondeu
        const requestRef = ref(db, `${basePath}/stockRequests/${currentUser}/${requestId}`);
        await remove(requestRef);
        console.log(`[DEBUG] Requisição [${requestId}] removida do nó de stockRequests de ${currentUser}`);
    } catch (error) {
        console.error(`[DEBUG] Erro ao processar requisição de estoque [${requestId}]:`, error);
        // Informa o solicitante sobre o erro
        const errorPayload = {
            requestId: requestId,
            results: [],
            error: "A loja consultada encontrou um erro interno.",
            timestamp: Date.now()
        };
        const answerRef = ref(db, `${basePath}/stockRequestAnswers/${requestData.requesterId}/${requestId}`);
        await set(answerRef, errorPayload);
    }
}

// --- NOVA SEÇÃO: OUVIR REQUISIÇÕES DE TABELA (MOVIDO DE STOCK.JS) ---

/**
 * Ouve requisições de tabela genérica direcionadas para esta loja.
 * Esta função agora fica no app.js para estar sempre ativa após o login.
 */
function listenForTableRequests() {
    if (tableRequestListener) {
        tableRequestListener(); // Remove o listener antigo
    }
    if (!currentUser) return;

    const requestsRef = ref(db, `${basePath}/tableRequests/${currentUser}`);
    console.log(`[DEBUG] Ouvindo requisições de TABELA em: ${requestsRef.toString()}`);

    tableRequestListener = onValue(requestsRef, (snapshot) => {
        if (!snapshot.exists()) {
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const requestId = childSnapshot.key;
            const requestData = childSnapshot.val();
            console.log(`[DEBUG] Recebida requisição de TABELA [${requestId}] de ${requestData.requesterId}`);
            
            // Processa a requisição
            handleTableRequest(requestId, requestData);

            // Remove a requisição para não processar de novo
            remove(childSnapshot.ref);
        });
    });
}

/**
 * Processa uma requisição de tabela, consultando o Firebird.
 */
async function handleTableRequest(requestId, request) {
    const { requesterId, tableName, fieldName, searchValue } = request;
    
    console.log(`[DEBUG] Processando requisição de tabela: ${tableName}.${fieldName} = "${searchValue}"`);
    
    try {
        const firebirdConfig = getFirebirdConfig();
        
        // Executa a consulta usando a API do Electron
        const result = await window.electronAPI.queryTableFirebird(
            firebirdConfig,
            tableName,
            fieldName,
            searchValue
        );
        
        await sendTableResponse(requesterId, requestId, result);
        console.log(`[DEBUG] Resposta de tabela enviada para ${requesterId}`);
        
    } catch (error) {
        console.error("[DEBUG] Erro ao processar requisição de tabela:", error);
        await sendTableResponse(requesterId, requestId, {
            success: false,
            error: error.message || 'Erro interno do servidor'
        });
    }
}

/**
 * Envia a resposta da consulta de tabela de volta para o solicitante via Firebase.
 */
async function sendTableResponse(requesterId, requestId, result) {
    const answerPayload = {
        requestId: requestId,
        storeId: currentUser,
        results: result.success ? result.data : [],
        error: result.success ? null : result.error,
        timestamp: Date.now()
    };

    const answerRef = ref(db, `${basePath}/tableRequestAnswers/${requesterId}/${requestId}`);
    await set(answerRef, answerPayload);
    console.log("[DEBUG] Resposta de tabela enviada:", answerPayload);
}

// ####################################################################
// ########## INÍCIO: SEÇÃO DE TESTE DE CONSULTA LOCAL ################
// ####################################################################

/**
 * Lida com a consulta de estoque local e exibe os resultados na UI do chat.
 * Esta função é chamada quando um comando /stock é digitado.
 * @param {string} searchTerm O produto a ser pesquisado.
 */
async function handleLocalStockQuery(searchTerm) {
    const searchAll = document.getElementById('searchAllStores')?.checked ?? true;
    addMessageToUI('Sistema (Teste Local)', `Consultando estoque${searchAll ? ' de todas as lojas' : ''} para: "${searchTerm}"...`, false, false);

    try {
        let resultsByStore = {};

        if (searchAll) {
            // Busca todos os usuários/lojas
            const usersSnapshot = await get(ref(db, `${basePath}/users`));
            const allStores = Object.keys(usersSnapshot.val() || {});
            for (const store of allStores) {
                const firebirdConfig = getFirebirdConfigForStore(store); // Implemente esta função para cada loja
                const result = await window.electronAPI.queryFirebird(firebirdConfig, searchTerm);
                resultsByStore[store] = result.success && result.data ? result.data : [];
            }
        } else {
            // Busca apenas na loja atual
            const firebirdConfig = getFirebirdConfig();
            const result = await window.electronAPI.queryFirebird(firebirdConfig, searchTerm);
            resultsByStore[currentUser] = result.success && result.data ? result.data : [];
        }

        // Exibe os resultados separados por loja
        let resultText = '';
        for (const [store, items] of Object.entries(resultsByStore)) {
            resultText += `<div style="margin-bottom:16px;"><b>Loja: ${store}</b><ul style="list-style-type: disc; margin-left: 20px;">`;
            if (items.length > 0) {
                items.forEach(p => {
                    resultText += `<li>
                        <b>${p.PRODUTO || 'N/A'}</b> (ID: ${p.CODIGO || 'N/A'}) - Estoque: ${p.ESTOQUEATUAL || 0} - Preço: R$ ${p.PRECOVENDA || 0}
                        <button class="solicitar-btn" data-store="${store}" data-codigo="${p.CODIGO}">Solicitar produto</button>
                    </li>`;
                });
            } else {
                resultText += `<li>Nenhum resultado encontrado.</li>`;
            }
            resultText += "</ul></div>";
        }
        addMessageToUI('Sistema (Teste Local)', resultText, false, false);

        // Adiciona evento aos botões de solicitar
        setTimeout(() => {
            document.querySelectorAll('.solicitar-btn').forEach(btn => {
                btn.onclick = function() {
                    const loja = btn.getAttribute('data-store');
                    const codigo = btn.getAttribute('data-codigo');
                    solicitarProduto(loja, codigo, searchTerm);
                };
            });
        }, 100);

    } catch (error) {
        console.error("[DEBUG] Erro na consulta de estoque local:", error);
        addMessageToUI('Sistema (Teste Local)', `Ocorreu um erro grave ao consultar o estoque local.`, false, true);
    }
}

// Função para solicitar produto para a loja correta
function solicitarProduto(loja, codigo, searchTerm) {
    // Monta a requisição para a loja de destino
    const requestPayload = {
        requesterId: currentUser,
        searchTerm: searchTerm,
        codigo: codigo
    };
    const requestsRef = ref(db, `${basePath}/stockRequests/${loja}`);
    push(requestsRef, requestPayload);
    addMessageToUI('Sistema', `Solicitação enviada para a loja <b>${loja}</b> referente ao produto código <b>${codigo}</b>.`, false, false);
}

// Implemente esta função para retornar a configuração correta do Firebird para cada loja
// Esta função agora é importada de ./utils/firebirdConfig.js
// function getFirebirdConfigForStore(store) {
//     return getFirebirdConfig();
// }

// ####################################################################
// ########### FIM: SEÇÃO DE TESTE DE CONSULTA LOCAL ##################
// ####################################################################


// --- ATUALIZAÇÃO NO LOGIN ---
window.handleLogin = async function() {
    const username = (usernameInput?.value || "").trim();
    if (!username || username.toLowerCase() === "null") {
        loginStatus.textContent = "Digite um nome de usuário válido.";
        return;
    }
    currentUser = username;
    localStorage.setItem('lastUsername', username);
    window.currentUserId = username;
    window.currentUsername = username;
    
    loginScreen.classList.add('hidden');
    mainChatScreen.classList.remove('hidden');

    await set(ref(db, `${basePath}/users/${currentUser}`), { username: currentUser, lastSeen: serverTimestamp() });
    
    updateUserStatus(currentUser, true);
    listenForUsers();
    setupPresence();
    setupGlobalUrgentAlertListener();
    setupUnreadMessagesListener();
    listenForStockRequests(); // <-- Inicia o listener de requisições de estoque
    listenForTableRequests(); // <-- Inicia o listener de requisições de tabela
    
    window.addEventListener('beforeunload', () => updateUserStatus(currentUser, false));
};


// ... (resto do seu código app.js existente, sem alterações)
function getPrivateChatId(user1, user2) {
    return [user1, user2].sort().join('_');
}
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}
function getInitials(name) {
    return name
        .split(' ')
        .map(part => part[0]?.toUpperCase())
        .join('')
        .slice(0, 2);
}
window.logout = function() {
    updateUserStatus(currentUser, false);
    currentUser = null;
    currentChatId = null;
    loginScreen.classList.remove('hidden');
    mainChatScreen.classList.add('hidden');
    usernameInput.value = '';
    loginStatus.textContent = '';
    messagesContainer.innerHTML = '';
    chatListContainer.innerHTML = '';
    conversationPanel.classList.add('hidden');
    console.log("[DEBUG] Logout realizado.");
};
function setupPresence() {
    const myStatusRef = ref(db, `${basePath}/status/${currentUser}`);
    const isOnline = {
        state: 'online',
        last_changed: serverTimestamp(),
        activeChat: null
    };
    const isOffline = {
        state: 'offline',
        last_changed: serverTimestamp(),
        activeChat: null
    };
    onValue(ref(db, '.info/connected'), (snapshot) => {
        if (snapshot.val() === false) return;
        onDisconnect(myStatusRef).set(isOffline).then(() => {
            set(myStatusRef, isOnline);
        });
    });
}
function updateUserStatus(username, online) {
    const userRef = ref(db, `${basePath}/users/${username}`);
    update(userRef, { online });
    const statusRef = ref(db, `${basePath}/status/${username}`);
    update(statusRef, {
        state: online ? 'online' : 'offline',
        last_changed: Date.now(),
        activeChat: null
    });
    if (online) onDisconnect(userRef).update({ online: false });
    if (online) onDisconnect(statusRef).update({
        state: 'offline',
        last_changed: Date.now(),
        activeChat: null
    });
    console.log(`[DEBUG] Status do usuário ${username}:`, online ? "online" : "offline");
}
function updateUserStatusUI(userId, state) {
    const statusDot = document.getElementById(`status-${userId}`);
    if (statusDot) {
        statusDot.className = `status-dot ${state === 'online' ? 'online' : 'offline'}`;
    }
}
function listenForUsers() {
    console.log("[DEBUG] Iniciando listener de usuários...");
    onValue(ref(db, `${basePath}/users`), (snapshot) => {
        let users = snapshot.val() || {};
        let allUsers = Object.keys(users).map(u => ({ id: u, username: u }));
        console.log("[DEBUG] Usuários recebidos do Firebase:", allUsers);
        loadChatList(allUsers);
    });
    const statusRef = ref(db, `${basePath}/status`);
    onValue(statusRef, (snapshot) => {
        let userStatuses = snapshot.val() || {};
        Object.keys(userStatuses).forEach(userId => {
            updateUserStatusUI(userId, userStatuses[userId].state);
        });
    });
}
function loadChatList(allUsers) {
    chatListContainer.innerHTML = '';
    const geralBtn = createChatButton('geral_lojas', '📢 Geral - Todas as Lojas');
    chatListContainer.appendChild(geralBtn);
    allUsers.forEach(user => {
        if (user.id !== currentUser) {
            const chatId = getPrivateChatId(currentUser, user.id);
            const btn = createChatButton(chatId, user.username, user.id);
            chatListContainer.appendChild(btn);
        }
    });
    updateChatListNotificationIndicators();
    updateUnreadCountIndicators();
    console.log("[DEBUG] Lista de chats carregada.");
}
function createChatButton(chatId, chatName, userId = null) {
    const button = document.createElement('button');
    button.className = 'w-full text-left p-3 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors duration-200 flex items-center justify-between';
    button.onclick = () => openChat(chatId, chatName);
    button.id = `chat-button-${chatId}`;
    const left = document.createElement('div');
    left.className = 'flex items-center';
    if (userId) {
        const statusDot = document.createElement('span');
        statusDot.className = 'status-dot offline';
        statusDot.id = `status-${userId}`;
        left.appendChild(statusDot);
    }
    const nameSpan = document.createElement('span');
    nameSpan.textContent = chatName;
    left.appendChild(nameSpan);
    button.appendChild(left);
    const right = document.createElement('div');
    right.className = 'flex items-center space-x-2';
    const unread = document.createElement('div');
    unread.id = `unread-${chatId}`;
    right.appendChild(unread);
    const notif = document.createElement('div');
    notif.id = `notif-${chatId}`;
    notif.className = 'notification-container';
    right.appendChild(notif);
    button.appendChild(right);
    return button;
}
function openChat(chatId, chatName) {
    currentChatId = chatId;
    conversationPanel.classList.remove('hidden');
    conversationHeader.textContent = chatName;
    if (activeMessageListener) activeMessageListener();
    loadMessages(chatId);
    listenForTyping(chatId);
    markUrgentNotificationAsReadForChat(chatId);
    markMessagesAsRead(chatId);
    if (reactionBar) reactionBar.classList.add('hidden');
    lastUrgentReactInfo = null;
    console.log("[DEBUG] Chat aberto:", chatId, chatName);
}
let activeMessageListener = null;
function loadMessages(chatId) {
    messagesContainer.innerHTML = '';
    const chatMessagesRef = ref(db, `${basePath}/messages/${chatId}`);
    activeMessageListener = onValue(chatMessagesRef, (snapshot) => {
        messagesContainer.innerHTML = '';
        const msgs = snapshot.val() || {};
        Object.entries(msgs)
            .sort((a, b) => (a[1].timestamp || 0) - (b[1].timestamp || 0))
            .forEach(([msgId, msg]) => {
                addMessageToUI(
                    msg.senderName || msg.sender,
                    msg.text,
                    (msg.senderName || msg.sender) === currentUser,
                    msg.urgent,
                    msg.timestamp,
                    msgId,
                    msg.productInfo || null,
                    chatId
                );
            });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// --- REAÇÕES RÁPIDAS PARA MENSAGENS URGENTES ---
let reactionBar = document.getElementById('reactionBar');
let lastUrgentReactInfo = null;

// Função para mostrar as reações
function showUrgentReactions(chatId, messageId, productInfo, requester, originalText = "") {
    if (!reactionBar || !reactionBar.classList.contains('hidden')) return; // Só mostra se estiver oculto
    reactionBar.innerHTML = `
        <div class="flex items-center gap-2">
            <button id="react-confirm" class="px-3 py-1 bg-green-500 text-white rounded">✔️ Confirmar</button>
            <button id="react-deny" class="px-3 py-1 bg-red-500 text-white rounded">❌ Negar</button><span class="ml-2 text-xs text-gray-500 max-w-xs" title="${originalText.replace(/"/g, '&quot;')}">${originalText}
            </span>
        </div>
    `;
    reactionBar.classList.remove('hidden');
    lastUrgentReactInfo = { chatId, messageId, productInfo, requester, originalText };

    const hideBar = () => {
        reactionBar.classList.add('hidden');
        lastUrgentReactInfo = null;
    };

    document.getElementById('react-confirm').onclick = () => {
        sendReactionMessage(chatId, requester, productInfo, true, originalText);
        hideBar();
    };
    document.getElementById('react-deny').onclick = () => {
        sendReactionMessage(chatId, requester, productInfo, false, originalText);
        hideBar();
    };
}

// Função para enviar mensagem automática de reação
function sendReactionMessage(chatId, requester, productInfo, isConfirm, originalText = "") {
    let text;
    if (productInfo && (productInfo.PRODUTO || productInfo.CODIGO)) {
        text = isConfirm
            ? `✔️ Confirmação: O produto "${productInfo.PRODUTO || ''}" (Código: ${productInfo.CODIGO || ''}) será transferido.`
            : `❌ Negado: O produto "${productInfo.PRODUTO || ''}" (Código: ${productInfo.CODIGO || ''}) não está disponível para transferência.`;
    } else {
        // Responde anexando a mensagem original entre aspas
        text = isConfirm
            ? `✔️ Confirmação: "${originalText}"`
            : `❌ Negado: "${originalText}"`;
    }
    const msg = {
        senderId: currentUser,
        senderName: currentUser,
        timestamp: Date.now(),
        text,
        urgent: false,
        reactionTo: requester,
        productInfo: productInfo || null
    };
    push(ref(db, `${basePath}/messages/${chatId}`), msg);
}

// Ajuste em addMessageToUI para detectar mensagens urgentes recebidas
function addMessageToUI(senderName, text, isCurrentUser, isUrgent = false, timestamp = null, messageId = null, productInfo = null, chatId = null) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'message-row ' + (isCurrentUser ? 'sent' : 'received');
    let timeStr = '';
    if (timestamp) {
        const date = new Date(
            typeof timestamp === 'object' && timestamp.seconds
                ? timestamp.seconds * 1000
                : Number(timestamp)
        );
        timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    const messageDiv = document.createElement('div');
    let bubbleClass = 'message-bubble ' + (isCurrentUser ? 'sent' : 'received');
    if (isUrgent) bubbleClass += ' urgent';
    messageDiv.className = bubbleClass;
    messageDiv.innerHTML = `
        <span class="sender">${isUrgent ? '🚨 ' : ''}${senderName}${isUrgent ? ' (URGENTE)' : ''}</span>
        <span>${text}</span>
        <span class="message-time">${timeStr}</span>
    `;
    if (isCurrentUser) {
        rowDiv.appendChild(messageDiv);
    } else {
        const badge = document.createElement('div');
        badge.className = 'profile-badge';
        badge.textContent = getInitials(senderName);
        rowDiv.appendChild(badge);
        rowDiv.appendChild(messageDiv);
    }
    messagesContainer.appendChild(rowDiv);

    // Sempre mostra as reações apenas para a última mensagem urgente recebida no chat atual
    if (
        isUrgent &&
        !isCurrentUser &&
        chatId === currentChatId
    ) {
        // Esconde o reactionBar antes de mostrar para a nova mensagem urgente
        if (reactionBar) reactionBar.classList.add('hidden');
        if (!productInfo) {
            const match = text.match(/produto "([^"]+)" \(Código: ([^)]+)\)/);
            if (match) {
                productInfo = { PRODUTO: match[1], CODIGO: match[2] };
            }
        }
        showUrgentReactions(chatId, messageId, productInfo, senderName, text);
    }
}

window.sendMessage = function() {
    const text = messageInput.value.trim();
    
    // Intercepta o comando /stock para consulta local de teste
    if (text.startsWith('/stock ')) {
        const searchTerm = text.substring(7).trim();
        if (searchTerm) {
            handleLocalStockQuery(searchTerm);
        } else {
            addMessageToUI('Sistema', 'Por favor, forneça um termo para a busca. Ex: /stock sabonete', false, true);
        }
        messageInput.value = '';
        return; // Impede que a mensagem seja enviada como chat
    }

    sendMessageToDB(false); // Envia como mensagem de chat normal
};

window.sendUrgentMessage = async function() {
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    if (messageText && currentChatId && currentUser) {
        updateTypingStatus(false);
        const newMessageRef = push(ref(db, `${basePath}/messages/${currentChatId}`));
        const messageId = newMessageRef.key;
        try {
            await set(newMessageRef, { id: messageId, senderId: currentUser, senderName: currentUser, text: messageText, timestamp: serverTimestamp(), urgent: true });
            messageInput.value = '';
            await update(ref(db, `${basePath}/chats/${currentChatId}`), { lastMessageId: messageId, lastMessageTimestamp: serverTimestamp() });
            incrementUnreadCount(currentChatId);
            const notificationPayload = { hasUnread: true, from: currentUser };
            if (currentChatId === 'geral_lojas') {
                const usersSnapshot = await get(ref(db, `${basePath}/users`));
                const allUsers = Object.keys(usersSnapshot.val() || {});
                for (const user of allUsers) {
                    if (user !== currentUser) {
                        await set(ref(db, `${basePath}/unreadUrgentNotifications/${user}/${currentChatId}`), notificationPayload);
                    }
                }
            } else {
                const recipientId = currentChatId.replace(currentUser, '').replace('_', '');
                await set(ref(db, `${basePath}/unreadUrgentNotifications/${recipientId}/${currentChatId}`), notificationPayload);
            }
        } catch (error) {
            console.error("Erro ao enviar mensagem urgente:", error);
        }
    }
};
function sendMessageToDB(isUrgent) {
    const text = messageInput.value.trim();
    if (!text || !currentChatId) return;
    const msgRef = ref(db, `${basePath}/messages/${currentChatId}`);
    const newMsg = {
        senderId: currentUser,
        senderName: currentUser,
        text,
        urgent: isUrgent,
        timestamp: Date.now()
    };
    push(msgRef, newMsg).then(() => {
        console.log("[DEBUG] Mensagem enviada para o Firebase:", text, "Urgente:", isUrgent);
    }).catch(e => {
        console.error("[DEBUG] Erro ao enviar mensagem:", e);
    });
    messageInput.value = '';
    incrementUnreadCount(currentChatId);
    if (isUrgent) notifyUrgent(currentChatId);
}
function notifyUrgent(chatId) {
    get(ref(db, `${basePath}/users`)).then(snapshot => {
        const allUsers = Object.keys(snapshot.val() || {});
        allUsers.forEach(user => {
            if (user !== currentUser) {
                set(ref(db, `${basePath}/unreadUrgentNotifications/${user}/${chatId}`), { hasUnread: true, from: currentUser });
            }
        });
    });
}
let globalUrgentNotificationListenerUnsubscribe = null;
function setupGlobalUrgentAlertListener() {
    if (!currentUser || globalUrgentNotificationListenerUnsubscribe) return;
    const currentUserNotificationsRef = ref(db, `${basePath}/unreadUrgentNotifications/${currentUser}`);
    globalUrgentNotificationListenerUnsubscribe = onValue(currentUserNotificationsRef, async (snapshot) => {
        let hasUnreadNotifications = snapshot.exists() && snapshot.hasChildren();
        if (hasUnreadNotifications && !alertHandler.isAlertActive()) {
            let alertText = "MENSAGEM URGENTE";
            let chatInfo = null;
            
            snapshot.forEach(childSnapshot => {
                const payload = childSnapshot.val();
                const chatId = childSnapshot.key;
                const senderName = payload.from || 'Alguém';
                const chatNameForRedirect = (chatId === 'geral_lojas') ? '📢 Geral - Todas as Lojas' : senderName;
                chatInfo = { id: chatId, name: chatNameForRedirect };
                
                if (chatId === 'geral_lojas') {
                    alertText = `MENSAGEM URGENTE DE ${senderName} NO CHAT GERAL`;
                } else {
                    alertText = `MENSAGEM URGENTE DE ${senderName}`;
                }
                return true;
            });
            
            // Usa o alertHandler para disparar o alerta
            alertHandler.triggerUrgentAlert(alertText, chatInfo);
        } else if (!hasUnreadNotifications && alertHandler.isAlertActive()) {
            // Para o alerta e abre o chat se necessário
            alertHandler.stopAlert((chatInfo) => {
                if (chatInfo) {
                    openChat(chatInfo.id, chatInfo.name);
                } else {
                    markAllUserUrgentNotificationsAsRead();
                }
            });
        }
        updateChatListNotificationIndicators();
    });
}

// Função global para parar o alerta (mantida para compatibilidade com HTML)
window.stopAlert = function() {
    alertHandler.stopAlert((chatInfo) => {
        if (chatInfo) {
            openChat(chatInfo.id, chatInfo.name);
        } else {
            markAllUserUrgentNotificationsAsRead();
        }
    });
};
function markAllUserUrgentNotificationsAsRead() {
    if (!currentUser) return;
    remove(ref(db, `${basePath}/unreadUrgentNotifications/${currentUser}`));
}
function markUrgentNotificationAsReadForChat(chatId) {
    if (!currentUser || !chatId) return;
    remove(ref(db, `${basePath}/unreadUrgentNotifications/${currentUser}/${chatId}`));
}
function updateChatListNotificationIndicators() {
    if (!currentUser) return;
    get(ref(db, `${basePath}/unreadUrgentNotifications/${currentUser}`)).then(snapshot => {
        const unreadByChat = {};
        if (snapshot.exists()) {
            snapshot.forEach(child => {
                if (child.val()?.hasUnread) unreadByChat[child.key] = true;
            });
        }
        document.querySelectorAll('#chatListContainer .notification-container').forEach(container => {
            const chatId = container.id.replace('notif-', '');
            container.innerHTML = '';
            if (unreadByChat[chatId]) {
                const dot = document.createElement('span');
                dot.className = 'w-3 h-3 bg-red-500 rounded-full';
                container.appendChild(dot);
            }
        });
    });
}
let unreadCountsListener = null;
function setupUnreadMessagesListener() {
    if (unreadCountsListener) unreadCountsListener();
    const userUnreadRef = ref(db, `${basePath}/unreadMessages/${currentUser}`);
    unreadCountsListener = onValue(userUnreadRef, (snapshot) => {
        updateUnreadCountIndicators(snapshot.val());
    });
}
function updateUnreadCountIndicators(unreadData) {
    document.querySelectorAll('#chatListContainer [id^="unread-"]').forEach(container => container.innerHTML = '');
    if (unreadData) {
        for (const chatId in unreadData) {
            const count = unreadData[chatId];
            const container = document.getElementById(`unread-${chatId}`);
            if (container && count > 0) {
                const badge = document.createElement('span');
                badge.className = 'unread-badge';
                badge.textContent = count;
                container.appendChild(badge);
            }
        }
    }
}
function incrementUnreadCount(chatId) {
    get(ref(db, `${basePath}/users`)).then(snapshot => {
        const allUsers = Object.keys(snapshot.val() || {});
        allUsers.forEach(user => {
            if (user !== currentUser) {
                const userUnreadRef = ref(db, `${basePath}/unreadMessages/${user}/${chatId}`);
                runTransaction(userUnreadRef, (currentCount) => (currentCount || 0) + 1);
            }
        });
    });
}
function markMessagesAsRead(chatId) {
    const userUnreadRef = ref(db, `${basePath}/unreadMessages/${currentUser}/${chatId}`);
    set(userUnreadRef, 0);
}
let typingTimeout = null;
function updateTypingStatus(isTyping) {
    if (!currentChatId || !currentUser) return;
    const typingUserRef = ref(db, `${basePath}/typing/${currentChatId}/${currentUser}`);
    if (isTyping) {
        set(typingUserRef, currentUser);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => updateTypingStatus(false), 3000);
    } else {
        clearTimeout(typingTimeout);
        remove(typingUserRef);
    }
}
let activeTypingListenerUnsubscribe = null;
function listenForTyping(chatId) {
    const typingChatRef = ref(db, `${basePath}/typing/${chatId}`);
    if (activeTypingListenerUnsubscribe) activeTypingListenerUnsubscribe();
    activeTypingListenerUnsubscribe = onValue(typingChatRef, (snapshot) => {
        const typingUsers = [];
        snapshot.forEach(childSnapshot => {
            if (childSnapshot.key !== currentUser) {
                typingUsers.push(childSnapshot.val());
            }
        });
        updateTypingIndicator(typingUsers);
    });
}
function updateTypingIndicator(typingUsers) {
    if (!typingUsers || typingUsers.length === 0) {
        typingIndicator.classList.add('hidden');
        typingIndicator.textContent = '';
    } else {
        typingIndicator.classList.remove('hidden');
        typingIndicator.textContent = typingUsers.length === 1
            ? `${typingUsers[0]} está digitando...`
            : `${typingUsers.join(', ')} estão digitando...`;
    }
}

// --- EVENTOS DE UI ---
usernameInput?.addEventListener("keydown", function(e) {
    if (e.key === "Enter") handleLogin();
});
loginButton?.addEventListener("click", handleLogin);

// Listener para o novo botão
openStockQueryBtn?.addEventListener('click', () => {
    console.log("[DEBUG] Botão de consulta de estoque clicado.");
    window.electronAPI.openStockWindow();
});

// Listener para o botão de gerenciamento
openManagementBtn?.addEventListener('click', () => {
    console.log("[DEBUG] Botão de gerenciamento de tabelas clicado.");
    window.electronAPI.openManagementWindow();
});

// --- ÁUDIO DE ALERTA ---
window.onload = async () => {
    // O carregamento de áudio agora é gerenciado pelo alertHandler
    const lastUsername = localStorage.getItem('lastUsername');
    if (lastUsername && lastUsername.trim() && lastUsername.toLowerCase() !== "null") {
        usernameInput.value = lastUsername;
        handleLogin();
    } else {
        showScreen('loginScreen');
    }
};

messageInput?.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        window.sendMessage();
        e.preventDefault();
    }
});
