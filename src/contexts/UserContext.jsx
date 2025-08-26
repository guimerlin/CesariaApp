import React, { createContext, useReducer, useContext, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { firebaseAuth } from '../utils/firebaseConfig';
import { firestoreService } from '../utils/firestoreService';

const UserContext = createContext(null);

const userReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload, isLoading: false, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...state, currentUser: null, isLoading: false, error: null };
    default:
      return state;
  }
};

const initialState = {
  currentUser: null,
  isLoading: true,
  error: null,
};

export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  useEffect(() => {
    // Monitora o estado de autenticação do Firebase
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        // Usuário está logado
        const userProfile = await firestoreService.getUser(user.uid);
        if (userProfile) {
          dispatch({ type: 'SET_USER', payload: { uid: user.uid, ...userProfile } });
        } else {
          // Caso de usuário no Auth mas não no Firestore (raro, mas possível)
          dispatch({ type: 'SET_ERROR', payload: 'Perfil de usuário não encontrado no banco de dados.' });
        }
      } else {
        // Usuário está deslogado
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => unsubscribe();
  }, []);

  const signUpWithEmail = async (name, email, password, apiLink, config) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const { user } = userCredential;
      const userData = {
        name,
        email,
        apiLink,
        config,
      };
      await firestoreService.createUser(user.uid, userData);
      dispatch({ type: 'SET_USER', payload: { uid: user.uid, ...userData } });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const signInWithEmail = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      // O listener onAuthStateChanged vai cuidar de atualizar o estado
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const { user } = result;

      // Verifica se o usuário já existe no Firestore
      const userProfile = await firestoreService.getUser(user.uid);
      if (!userProfile) {
        // Se não existe, cria um perfil básico
        const userData = {
          name: user.displayName,
          email: user.email,
          apiLink: '', // Requer que o usuário preencha depois
          config: {}, // Requer que o usuário preencha depois
        };
        await firestoreService.createUser(user.uid, userData);
        dispatch({ type: 'SET_USER', payload: { uid: user.uid, ...userData } });
      }
      // Se já existe, o listener onAuthStateChanged vai cuidar de atualizar
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await signOut(firebaseAuth);
      // O listener onAuthStateChanged vai cuidar de atualizar o estado para LOGOUT
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const value = {
    ...state,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
