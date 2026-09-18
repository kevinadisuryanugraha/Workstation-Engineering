import { create } from 'zustand';
import { AuthSession, User } from '../types.ts';
import { authManager } from '../lib/auth.ts';

interface AuthState {
  session: AuthSession | null;
  currentUser: User | null;
  setSession: (session: AuthSession | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: authManager.getSession(),
  currentUser: authManager.getUser(),
  setSession: (session) => set({ session, currentUser: session?.user || null }),
  logout: async () => {
    await authManager.logout();
    set({ session: null, currentUser: null });
  },
}));
