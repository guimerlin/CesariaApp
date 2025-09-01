"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  getDocs,
  getDoc,
} from "firebase/firestore"
import { auth, db } from "../utils/firebase"

const FirestoreContext = createContext()

export const useFirestore = () => {
  const context = useContext(FirestoreContext)
  if (!context) {
    throw new Error("useFirestore deve ser usado dentro de FirestoreProvider")
  }
  return context
}

export const FirestoreProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState({})
  const [activeChat, setActiveChat] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [processedMessages, setProcessedMessages] = useState(new Set())

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        await ensureUserInDatabase(user)
        await loadUserChats(user.uid)
        const unsubscribeUsers = await loadAllUsers()
        await ensureGeneralChatExists(user)

        // Cleanup function para o listener de usuários
        return () => {
          if (unsubscribeUsers) unsubscribeUsers()
        }
      } else {
        setUser(null)
        setChats([])
        setMessages({})
        setActiveChat(null)
        setAllUsers([])
        setProcessedMessages(new Set()) // Limpar mensagens processadas ao deslogar
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const ensureUserInDatabase = async (user) => {
    try {
      console.log("[v0] Verificando usuário na base de dados:", user.email)
      const userDocRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc.exists()) {
        // Se o usuário não existe na coleção, criar o documento
        const userData = {
          name: user.displayName || user.email?.split("@")[0] || "Usuário",
          email: user.email,
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        }
        await setDoc(userDocRef, userData)
        console.log("[v0] Usuário adicionado à coleção users:", user.email, userData)
      } else {
        // Se existe, apenas atualizar o lastSeen
        await updateDoc(userDocRef, {
          lastSeen: serverTimestamp(),
        })
        console.log("[v0] LastSeen atualizado para:", user.email)
      }
    } catch (error) {
      console.error("[v0] Erro ao garantir usuário no banco:", error)
    }
  }

  const loadAllUsers = useCallback(async () => {
    try {
      console.log("[v0] Iniciando carregamento de usuários...")
      const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"))

      const unsubscribe = onSnapshot(
        usersQuery,
        (snapshot) => {
          const users = []
          snapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() })
          })
          console.log("[v0] Usuários carregados:", users.length, users)
          setAllUsers(users)
        },
        (error) => {
          console.error("[v0] Erro ao carregar usuários:", error)
        },
      )

      return unsubscribe
    } catch (error) {
      console.error("[v0] Erro na função loadAllUsers:", error)
      return null
    }
  }, [])

  const ensureGeneralChatExists = useCallback(async (currentUser) => {
    if (!currentUser || !currentUser.uid) {
      console.log("User not available for general chat creation")
      return
    }

    try {
      // Verificar se já existe um chat geral
      const generalChatQuery = query(collection(db, "chats"), where("isGeneral", "==", true))

      const generalChatSnapshot = await getDocs(generalChatQuery)

      if (generalChatSnapshot.empty) {
        // Criar o chat geral se não existir
        await addDoc(collection(db, "chats"), {
          name: "Chat Geral",
          type: "public",
          isGeneral: true,
          participants: [currentUser.uid],
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
          createdBy: currentUser.uid,
          description: "Chat público para todos os usuários",
        })
      } else {
        // Adicionar o usuário atual ao chat geral se não estiver
        const generalChat = generalChatSnapshot.docs[0]
        const chatData = generalChat.data()

        if (!chatData.participants.includes(currentUser.uid)) {
          await updateDoc(doc(db, "chats", generalChat.id), {
            participants: arrayUnion(currentUser.uid),
          })
        }
      }
    } catch (error) {
      console.error("Erro ao criar/verificar Chat Geral:", error)
    }
  }, [])

  const createPrivateChat = async (targetUserId) => {
    if (!user || targetUserId === user.uid) return

    try {
      const existingChatQuery = query(
        collection(db, "chats"),
        where("type", "==", "private"),
        where("participants", "array-contains", user.uid),
      )

      const existingChats = await getDocs(existingChatQuery)
      let existingChat = null

      existingChats.forEach((doc) => {
        const chatData = doc.data()
        if (chatData.participants.includes(targetUserId) && chatData.participants.length === 2) {
          existingChat = { id: doc.id, ...chatData }
        }
      })

      if (existingChat) {
        // Se já existe, apenas ativar o chat
        setActiveChat(existingChat.id)
        return { success: true, chatId: existingChat.id }
      }

      // Buscar dados do usuário alvo
      const targetUserDoc = await getDoc(doc(db, "users", targetUserId))
      const targetUserData = targetUserDoc.data()

      // Criar novo chat privado
      const chatDoc = await addDoc(collection(db, "chats"), {
        name: `${targetUserData?.name || targetUserData?.email || "Usuário"}`,
        type: "private",
        participants: [user.uid, targetUserId],
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        createdBy: user.uid,
      })

      setActiveChat(chatDoc.id)
      return { success: true, chatId: chatDoc.id }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Login function
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Register function
  const register = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Save additional user data
      await setDoc(doc(db, "users", userCredential.user.uid), {
        ...userData,
        email,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Load user chats (optimized to minimize reads)
  const loadUserChats = useCallback(async (userId) => {
    // First get chats where user is participant
    const chatsQuery = query(collection(db, "chats"), where("participants", "array-contains", userId))

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const userChats = []
      snapshot.forEach((doc) => {
        userChats.push({ id: doc.id, ...doc.data() })
      })

      userChats.sort((a, b) => {
        const aTime = a.lastMessageAt?.toDate?.() || new Date(0)
        const bTime = b.lastMessageAt?.toDate?.() || new Date(0)
        return bTime - aTime
      })

      setChats(userChats)

      // Load messages for each chat
      userChats.forEach((chat) => {
        loadChatMessages(chat.id)
      })
    })

    return unsubscribe
  }, [])

  // Load messages for a specific chat (optimized)
  const loadChatMessages = useCallback(
    (chatId) => {
      const messagesQuery = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"))

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const chatMessages = []
        snapshot.forEach((doc) => {
          chatMessages.push({ id: doc.id, ...doc.data() })
        })

        setMessages((prev) => ({
          ...prev,
          [chatId]: chatMessages,
        }))

        // Processar apenas mensagens novas que não foram processadas antes
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const messageData = { id: change.doc.id, ...change.doc.data() }
            const messageKey = `${chatId}-${messageData.id}`

            // Verificar se a mensagem já foi processada
            if (!processedMessages.has(messageKey)) {
              setProcessedMessages((prev) => new Set([...prev, messageKey]))

              // Só criar notificação se:
              // 1. A mensagem não é do usuário atual
              // 2. O chat não está ativo
              // 3. O usuário está logado
              if (messageData.senderId !== user?.uid && activeChat !== chatId && user?.uid) {
                console.log(
                  "[v0] Criando notificação para mensagem:",
                  messageData.content,
                  "de:",
                  messageData.senderName,
                )
                addNotification({
                  id: `${chatId}-${messageData.id}-${Date.now()}`,
                  chatId,
                  message: `${messageData.senderName}: ${messageData.content.substring(0, 50)}${messageData.content.length > 50 ? "..." : ""}`,
                  timestamp: new Date(),
                })
              }
            }
          }
        })
      })

      return unsubscribe
    },
    [user, activeChat, processedMessages],
  )

  // Send message
  const sendMessage = async (chatId, content) => {
    if (!user || !content.trim()) return

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        content: content.trim(),
        senderId: user.uid,
        senderName: user.displayName || user.email,
        createdAt: serverTimestamp(),
      })

      // Update chat's last message timestamp
      await updateDoc(doc(db, "chats", chatId), {
        lastMessageAt: serverTimestamp(),
        lastMessage: content.trim(),
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Create new chat
  const createChat = async (chatData) => {
    if (!user) return

    try {
      const chatDoc = await addDoc(collection(db, "chats"), {
        ...chatData,
        participants: [user.uid, ...chatData.participants],
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        createdBy: user.uid,
      })

      return { success: true, chatId: chatDoc.id }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Join public chat
  const joinPublicChat = async (chatId) => {
    if (!user) return

    try {
      await updateDoc(doc(db, "chats", chatId), {
        participants: arrayUnion(user.uid),
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Leave chat
  const leaveChat = async (chatId) => {
    if (!user) return

    try {
      await updateDoc(doc(db, "chats", chatId), {
        participants: arrayRemove(user.uid),
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Helper functions
  const getChatName = (chatId) => {
    const chat = chats.find((c) => c.id === chatId)
    return chat?.name || "Chat"
  }

  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev.slice(0, 9)]) // Keep only 10 notifications
  }

  const removeNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }

  useEffect(() => {
    // Limpar notificações do chat ativo quando ele muda
    if (activeChat) {
      setNotifications((prev) => prev.filter((n) => n.chatId !== activeChat))
    }
    // Limpar mensagens processadas ao mudar de chat ativo
    setProcessedMessages(new Set())
  }, [activeChat])

  const value = {
    // Auth
    user,
    loading,
    login,
    register,
    logout,

    // Chats
    chats,
    messages,
    activeChat,
    setActiveChat,
    sendMessage,
    createChat,
    joinPublicChat,
    leaveChat,
    createPrivateChat,

    allUsers,

    // Notifications
    notifications,
    removeNotification,

    // Helpers
    getChatName,
  }

  return <FirestoreContext.Provider value={value}>{children}</FirestoreContext.Provider>
}
