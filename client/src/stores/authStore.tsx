import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api/authApi';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  total_points: number;
  level: number;
  status: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
  updateUserPoints: (points: number) => void;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.login({ email, password });
          
          if (response.success) {
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed. Please try again.',
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authApi.register(userData);
          
          if (response.success) {
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Registration failed. Please try again.',
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      loadUser: async () => {
        const { isAuthenticated } = get();
        
        if (!isAuthenticated) {
          return;
        }

        set({ isLoading: true });
        
        try {
          const response = await authApi.getProfile();
          
          if (response.profile) {
            set({
              user: response.profile,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Token might be invalid
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error: any) {
          console.error('Load user error:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      updateUserPoints: (points: number) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              total_points: user.total_points + points,
            },
          });
        }
      },
    }),
    {
      name: 't4g-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth state on app start
export const initializeAuth = async () => {
  try {
    const { loadUser } = useAuthStore.getState();
    await loadUser();
  } catch (error) {
    console.log('Auth initialization skipped:', error);
    // Don't crash the app if auth initialization fails
  }
};