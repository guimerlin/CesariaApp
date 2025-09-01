"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "../utils/firebase"
import { useAuth } from "./AuthContext"
import { useChat } from "./ChatContext"

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification deve ser usado dentro de um NotificationProvider")
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const { activeChat } = useChat()

  const [unreadCounts, setUnreadCounts] = useState({})
  const [urgentNotifications, setUrgentNotifications] = useState({})
  const [inAppNotifications, setInAppNotifications] = useState([])
  const [processedMessages, setProcessedMessages] = useState(new Set())


  const loadUnreadCounts = useCallback((userId) => {
    const metadataQuery = query(collection(db, "users", userId, "chat_metadata"))
    return onSnapshot(metadataQuery, (snapshot) => {
      const counts = {}
      snapshot.forEach((doc) => {
        counts[doc.id] = doc.data().unreadCount || 0
      })
      setUnreadCounts(counts)
    })
  }, [])

  const loadUrgentNotifications = useCallback((userId) => {
    const notificationsQuery = query(collection(db, "users", userId, "user_notifications"))
    return onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = {}
      snapshot.forEach((doc) => {
        if (doc.data().hasUnreadUrgent) {
          notifications[doc.id] = doc.data()
        }
      })
      setUrgentNotifications(notifications)
    })
  }, [])

  useEffect(() => {
    let unsubUnread = () => {}
    let unsubUrgent = () => {}

    if (user) {
      unsubUnread = loadUnreadCounts(user.uid)
      unsubUrgent = loadUrgentNotifications(user.uid)
    } else {
      setUnreadCounts({})
      setUrgentNotifications({})
    }

    return () => {
      unsubUnread()
      unsubUrgent()
    }
  }, [user, loadUnreadCounts, loadUrgentNotifications])


  const markChatAsRead = async (chatId) => {
    if (!user || !chatId) return
    try {
      const metadataRef = doc(db, "users", user.uid, "chat_metadata", chatId)
      await setDoc(metadataRef, { unreadCount: 0 }, { merge: true })
    } catch (error) {
      console.error("[NotificationContext] Error marking chat as read:", error)
    }
  }

  const clearUrgentNotification = async (chatId) => {
    if (!user || !chatId) return
    try {
      const notificationRef = doc(db, "users", user.uid, "user_notifications", chatId)
      await deleteDoc(notificationRef)
    } catch (error) {
      if (error.code !== "not-found") {
        console.error("[NotificationContext] Error clearing urgent notification:", error)
      }
    }
  }

  useEffect(() => {
    if (activeChat) {
      markChatAsRead(activeChat)
      clearUrgentNotification(activeChat)
      setInAppNotifications((prev) => prev.filter((n) => n.chatId !== activeChat))
    }
    setProcessedMessages(new Set())
  }, [activeChat, user])

  const addInAppNotification = (notification) => {
    setInAppNotifications((prev) => [notification, ...prev.slice(0, 9)])
  }

  const removeInAppNotification = (notificationId) => {
    setInAppNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }


  const value = {
    unreadCounts,
    urgentNotifications,
    inAppNotifications,
    addInAppNotification,
    removeInAppNotification,
    processedMessages,
    setProcessedMessages
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
