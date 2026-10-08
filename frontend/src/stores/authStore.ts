import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user: User, token: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  setUser: (user: User) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    authService.logout().catch(() => {});
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  initAuth: async () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });

        // Verify with backend
        try {
          const res = await authService.getMe();
          if (res.success && res.data) {
            set({ user: res.data, isAuthenticated: true, isLoading: false });
            localStorage.setItem('auth_user', JSON.stringify(res.data));
            return;
          }
        } catch {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          return;
        }
        return;
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));
