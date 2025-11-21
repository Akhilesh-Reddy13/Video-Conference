import { create } from 'zustand';
import api from '../utils/api';
import { initializeSocket, disconnectSocket } from '../utils/socket';

export const useAuthStore = create((set, get) => {
  // Initialize state from localStorage
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  const storedUser = localStorage.getItem('user');
  
  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: token || null,
    refreshToken: refreshToken || null,
    isAuthenticated: !!token,
    isLoading: false,
    error: null,

    // Register
    register: async (userData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/register', userData);
        const { user, token, refreshToken } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // Initialize socket
        initializeSocket(token);

        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || 'Registration failed';
        set({ error: message, isLoading: false });
        return { success: false, error: message };
      }
    },

    // Login
    login: async (credentials) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post('/auth/login', credentials);
        const { user, token, refreshToken } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // Initialize socket
        initializeSocket(token);

        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || 'Login failed';
        set({ error: message, isLoading: false });
        return { success: false, error: message };
      }
    },

    // Logout
    logout: async () => {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.error('Logout error:', error);
      }

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      disconnectSocket();

      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    },

    // Get current user
    fetchCurrentUser: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        set({ isAuthenticated: false });
        return;
      }

      try {
        const response = await api.get('/auth/me');
        const { user } = response.data.data;

        localStorage.setItem('user', JSON.stringify(user));

        set({
          user,
          token,
          isAuthenticated: true,
        });

        // Initialize socket if not already connected
        initializeSocket(token);
      } catch (error) {
        console.error('Fetch user error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      }
    },

    // Update profile
    updateProfile: async (profileData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.put('/auth/profile', profileData);
        const { user } = response.data.data;

        localStorage.setItem('user', JSON.stringify(user));

        set({
          user,
          isLoading: false,
        });

        return { success: true };
      } catch (error) {
        const message = error.response?.data?.message || 'Update failed';
        set({ error: message, isLoading: false });
        return { success: false, error: message };
      }
    },

    // Clear error
    clearError: () => set({ error: null }),
  };
});
