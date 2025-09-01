"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import { auth, db } from "../utils/firebase"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await ensureUserInDatabase(user)
        setUser(user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const ensureUserInDatabase = async (user) => {
    try {
      const userDocRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc.exists()) {
        const userData = {
          name: user.displayName || user.email?.split("@")[0] || "Usuário",
          email: user.email,
          createdAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          status: "online",
        }
        await setDoc(userDocRef, userData)
      } else {
        await updateDoc(userDocRef, {
          lastSeen: serverTimestamp(),
          status: "online",
        })
      }
    } catch (error) {
      console.error("[AuthContext] Erro ao garantir usuário no banco:", error)
    }
  }

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const register = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(doc(db, "users", userCredential.user.uid), {
        ...userData,
        email,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        status: "online",
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid)
        await updateDoc(userDocRef, {
          status: "offline",
          lastSeen: serverTimestamp(),
        })
      }
      await signOut(auth)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
