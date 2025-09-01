"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../utils/firebase"
import { useAuth } from "./AuthContext"

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser deve ser usado dentro de um UserProvider")
  }
  return context
}

export const UserProvider = ({ children }) => {
  const { user } = useAuth()
  const [allUsers, setAllUsers] = useState([])

  const loadAllUsers = useCallback(() => {
    const usersQuery = query(collection(db, "users"), orderBy("name", "asc"))
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const users = []
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() })
      })
      setAllUsers(users)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    let unsubscribe = () => {}
    if (user) {
      unsubscribe = loadAllUsers()
    } else {
      setAllUsers([])
    }
    return () => unsubscribe()
  }, [user, loadAllUsers])

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid)
        await updateDoc(userDocRef, {
          status: "offline",
          lastSeen: serverTimestamp(),
        })
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [user])

  const value = {
    allUsers,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
