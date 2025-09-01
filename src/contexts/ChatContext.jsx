"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
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
  writeBatch,
  increment,
  deleteDoc,
} from "firebase/firestore"
import { db } from "../utils/firebase"
import { useAuth } from "./AuthContext"

const ChatContext = createContext()

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat deve ser usado dentro de um ChatProvider")
  }
  return context
}

export const ChatProvider = ({ children }) => {
  const { user } = useAuth()
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState({})
  const [activeChat, setActiveChat] = useState(null)
  const [loadingChats, setLoadingChats] = useState(true)

  useEffect(() => {
    let unsubscribe = () => {}
    if (user) {
      setLoadingChats(true)
      const chatsQuery = query(collection(db, "chats"), where("participants", "array-contains", user.uid))
      unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
        const userChats = []
        snapshot.forEach((doc) => {
          userChats.push({ id: doc.id, ...doc.data() })
        })
        userChats.sort((a, b) => (b.lastMessageAt?.toDate?.() || 0) - (a.lastMessageAt?.toDate?.() || 0))
        setChats(userChats)
        setLoadingChats(false)
      })
    } else {
      setChats([])
      setMessages({})
      setActiveChat(null)
      setLoadingChats(false)
    }
    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    const unsubscribers = {}
    if (chats.length > 0) {
      chats.forEach((chat) => {
        const messagesQuery = query(collection(db, "chats", chat.id, "messages"), orderBy("createdAt", "asc"))
        unsubscribers[chat.id] = onSnapshot(messagesQuery, (snapshot) => {
          const chatMessages = []
          snapshot.forEach((doc) => {
            chatMessages.push({ id: doc.id, ...doc.data() })
          })
          setMessages((prev) => ({ ...prev, [chat.id]: chatMessages }))
        })
      })
    }
    return () => {
      Object.values(unsubscribers).forEach((unsubscribe) => unsubscribe())
    }
  }, [chats])

  const createPrivateChat = async (targetUserId) => {
    if (!user || targetUserId === user.uid) return

    try {
      const existingChatQuery = query(
        collection(db, "chats"),
        where("type", "==", "private"),
        where("participants", "array-contains", user.uid)
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
        setActiveChat(existingChat.id)
        return { success: true, chatId: existingChat.id }
      }

      const targetUserDoc = await getDoc(doc(db, "users", targetUserId))
      const targetUserData = targetUserDoc.data()

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

  const sendMessage = async (chatId, content, isUrgent = false) => {
    if (!user || !content.trim()) return

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        content: content.trim(),
        senderId: user.uid,
        senderName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        isUrgent: isUrgent,
      })

      const batch = writeBatch(db)
      const chatRef = doc(db, "chats", chatId)
      batch.update(chatRef, {
        lastMessageAt: serverTimestamp(),
        lastMessage: content.trim(),
      })

      const chatDoc = await getDoc(chatRef)
      if (chatDoc.exists()) {
        const participants = chatDoc.data().participants || []
        participants.forEach((participantId) => {
          if (participantId !== user.uid) {
            const metadataRef = doc(db, "users", participantId, "chat_metadata", chatId)
            batch.set(metadataRef, { unreadCount: increment(1) }, { merge: true })

            if (isUrgent) {
              const notificationRef = doc(db, "users", participantId, "user_notifications", chatId)
              batch.set(notificationRef, {
                hasUnreadUrgent: true,
                from: user.displayName || user.email,
                timestamp: serverTimestamp(),
              })
            }
          }
        })
      }
      await batch.commit()
      return { success: true }
    } catch (error) {
      console.error("[ChatContext] Error sending message:", error)
      return { success: false, error: error.message }
    }
  }

  const getChatName = (chatId) => {
    const chat = chats.find((c) => c.id === chatId)
    if (chat?.type === 'private' && user) {
        const otherParticipantId = chat.participants.find(p => p !== user.uid);
        // This part needs access to allUsers, which will be in UserContext.
        // For now, returning a placeholder. This highlights the need for context composition.
        return chat.name || "Chat Privado"
    }
    return chat?.name || "Chat"
  }

  const value = {
    chats,
    messages,
    activeChat,
    setActiveChat,
    loadingChats,
    sendMessage,
    createPrivateChat,
    getChatName,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
