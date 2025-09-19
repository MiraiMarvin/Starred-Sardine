import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Instance Axios avec configuration
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si le token est expiré, essayer de le rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await api.post('/auth/refresh-token');
        return api(originalRequest);
      } catch (refreshError) {
        // Si le refresh échoue, rediriger vers la page de connexion
        Cookies.remove('token');
        Cookies.remove('refreshToken');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // Afficher les erreurs avec toast
    const message = error.response?.data?.message || 'Une erreur est survenue';
    toast.error(message);

    return Promise.reject(error);
  }
);

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string; // Pour compatibilité
  avatar?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

// Services API
export const authAPI = {
  login: (credentials: LoginCredentials) => 
    api.post<ApiResponse<{ user: User; tokens: { accessToken: string; refreshToken: string } }>>('/auth/login', credentials),
  
  register: (data: RegisterData) => 
    api.post<ApiResponse<User>>('/auth/register', data),
  
  logout: () => 
    api.post<ApiResponse>('/auth/logout'),
  
  getCurrentUser: () => 
    api.get<ApiResponse<User>>('/auth/me'),
  
  refreshToken: () => 
    api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh-token'),
};

export const userAPI = {
  getProfile: () => 
    api.get<ApiResponse<User>>('/users/profile'),
  
  updateProfile: (data: Partial<User>) => 
    api.put<ApiResponse<User>>('/users/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) => 
    api.put<ApiResponse>('/users/password', data),
  
  getDashboard: () => 
    api.get<ApiResponse>('/users/dashboard'),
  
  getSubscription: () => 
    api.get<ApiResponse>('/users/subscription'),
  
  deleteAccount: () => 
    api.delete<ApiResponse>('/users/account'),
};

export const adminAPI = {
  getAllUsers: () => 
    api.get<ApiResponse<User[]>>('/admin/users'),
  
  updateUserRole: (userId: string, role: string) => 
    api.put<ApiResponse<User>>(`/admin/users/${userId}/role`, { role }),
  
  getStats: () => 
    api.get<ApiResponse<{ totalUsers: number; adminUsers: number; premiumUsers: number; regularUsers: number }>>('/admin/stats'),
};
