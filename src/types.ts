export interface User {
  name: string;
  email: string;
  role: 'admin' | 'user';
  phone?: string;
  status?: 'active' | 'blocked';
  messagesSent?: number;
  createdAt?: string;
}

export interface UserHistoryItem {
  timestamp: string;
  recipientCount: number;
  status: string;
}

export interface AppSettings {
  appName: string;
  maxMessagesPerUser: number;
  adminPassword?: string;
}
