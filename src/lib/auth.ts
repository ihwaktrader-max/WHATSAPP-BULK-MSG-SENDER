import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginTime: number | null;
}

const STORAGE_KEY = 'whatsapp_sync_auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const authService = {
  getAuth: (): AuthState => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { user: null, isAuthenticated: false, loginTime: null };
    
    const state: AuthState = JSON.parse(stored);
    
    // Check session expiry
    if (state.loginTime && Date.now() - state.loginTime > SESSION_DURATION) {
      localStorage.removeItem(STORAGE_KEY);
      return { user: null, isAuthenticated: false, loginTime: null };
    }
    
    return state;
  },

  login: (email: string, role: 'admin' | 'user', name: string) => {
    const state: AuthState = {
      user: { email, role, name },
      isAuthenticated: true,
      loginTime: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  register: (user: any) => {
    const users = JSON.parse(localStorage.getItem('whatsapp_sync_users') || '[]');
    users.push({
      ...user,
      status: 'active',
      messagesSent: 0,
      history: []
    });
    localStorage.setItem('whatsapp_sync_users', JSON.stringify(users));
  },

  updateUserStatus: (email: string, status: 'active' | 'blocked') => {
    const users = JSON.parse(localStorage.getItem('whatsapp_sync_users') || '[]');
    const updated = users.map((u: any) => u.email === email ? { ...u, status } : u);
    localStorage.setItem('whatsapp_sync_users', JSON.stringify(updated));
  },

  getAllUsers: () => {
    return JSON.parse(localStorage.getItem('whatsapp_sync_users') || '[]');
  },

  getSettings: () => {
    const defaultSettings = { appName: 'WPSync Pro', maxMessagesPerUser: 1000 };
    const stored = localStorage.getItem('whatsapp_sync_settings');
    return stored ? JSON.parse(stored) : defaultSettings;
  },

  saveSettings: (settings: any) => {
    localStorage.setItem('whatsapp_sync_settings', JSON.stringify(settings));
  },

  verifyAdmin: (password: string) => {
    const settings = JSON.parse(localStorage.getItem('whatsapp_sync_settings') || '{}');
    const storedPassword = settings.adminPassword;
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    
    // Check stored password first, then fallback to env
    return password === (storedPassword || envPassword);
  },

  incrementUserMessages: (email: string, count: number) => {
    const users = JSON.parse(localStorage.getItem('whatsapp_sync_users') || '[]');
    const updated = users.map((u: any) => {
      if (u.email === email) {
        return { 
          ...u, 
          messagesSent: (u.messagesSent || 0) + count,
          history: [
            { timestamp: new Date().toISOString(), recipientCount: count, status: 'success' },
            ...(u.history || [])
          ]
        };
      }
      return u;
    });
    localStorage.setItem('whatsapp_sync_users', JSON.stringify(updated));
  },

  findUserByEmail: (email: string) => {
    const users = JSON.parse(localStorage.getItem('whatsapp_sync_users') || '[]');
    return users.find((u: any) => u.email === email);
  }
};
