import { create } from 'zustand';
import { authAPI } from '../services/api';
import { socketService } from '../services/socket';

const useAuthStore = create((set, get) => ({
  // State
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: !!token });
  },

  clearAuth: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    socketService.disconnect();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  // Auth actions
  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.signup(userData);
      const { user, token } = response.data.data;
      
      get().setUser(user);
      get().setToken(token);
      
      // Connect socket
      socketService.connect(user.userId, user.role);
      
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Signup failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data.data;
      
      get().setUser(user);
      get().setToken(token);
      
      // Connect socket
      socketService.connect(user.userId, user.role);
      
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  logout: () => {
    get().clearAuth();
  },

  refreshUser: async () => {
    try {
      const response = await authAPI.getMe();
      const { user, profile } = response.data.data;
      get().setUser({ ...user, profile });
      return { success: true };
    } catch (error) {
      get().clearAuth();
      return { success: false };
    }
  },

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.updateProfile(profileData);
      const updatedUser = response.data.data.user;
      
      const currentUser = get().user;
      get().setUser({ ...currentUser, ...updatedUser });
      
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Update failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Check if user is tutor
  isTutor: () => get().user?.role === 'tutor',

  // Check if user is learner
  isLearner: () => get().user?.role === 'learner',

  // Check if user is admin
  isAdmin: () => get().user?.role === 'admin',
}));

export default useAuthStore;
