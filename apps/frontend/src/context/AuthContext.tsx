'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { authAPI, User, LoginCredentials, RegisterData } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authAPI.getCurrentUser();
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      // Ne pas afficher d'erreur ici car c'est normal si l'utilisateur n'est pas connecté
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      if (response.data.success && response.data.data) {
        const { user: userData } = response.data.data;
        setUser(userData);
        
        toast.success('Connexion réussie !');
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      const message = error.response?.data?.message || 'Erreur de connexion';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(data);
      
      if (response.data.success) {
        toast.success('Compte créé avec succès !');
        router.push('/auth/login');
      }
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      toast.success('Déconnexion réussie');
      router.push('/');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      // Même en cas d'erreur, on déconnecte l'utilisateur côté client
      setUser(null);
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      router.push('/');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
