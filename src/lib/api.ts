// API client for backend development (when VITE_USE_BACKEND_API=true)
import { Tournament, User, Match, WalletTransaction, KycDocument, Notification } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Generic API request handler
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (phoneNumber: string, countryCode: string) => {
    return apiRequest<{ message: string; otpSent: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, countryCode }),
    });
  },

  verifyOtp: async (phoneNumber: string, countryCode: string, otp: string) => {
    return apiRequest<{ message: string; user: User; token: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, countryCode, otp }),
    });
  },

  register: async (userData: {
    phoneNumber: string;
    countryCode: string;
    otp: string;
    username: string;
    email?: string;
  }) => {
    return apiRequest<{ message: string; user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

// Users API
export const usersAPI = {
  getUser: async (id: string) => {
    return apiRequest<User>(`/users/${id}`);
  },

  updateUser: async (id: string, data: Partial<User>) => {
    return apiRequest<{ message: string; user: User }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// Tournaments API
export const tournamentsAPI = {
  getAllTournaments: async () => {
    return apiRequest<Tournament[]>('/tournaments');
  },

  getTournament: async (id: string) => {
    return apiRequest<Tournament>(`/tournaments/${id}`);
  },

  createTournament: async (data: Omit<Tournament, 'id' | 'createdAt'>) => {
    return apiRequest<{ message: string; tournament: Tournament }>('/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Matches API
export const matchesAPI = {
  getUserMatches: async (userId: string) => {
    return apiRequest<Match[]>(`/users/${userId}/matches`);
  },

  createMatch: async (data: Omit<Match, 'id' | 'createdAt'>) => {
    return apiRequest<{ message: string; match: Match }>('/matches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Wallet API
export const walletAPI = {
  getUserTransactions: async (userId: string) => {
    return apiRequest<WalletTransaction[]>(`/users/${userId}/wallet/transactions`);
  },

  createTransaction: async (data: Omit<WalletTransaction, 'id' | 'createdAt'>) => {
    return apiRequest<{ message: string; transaction: WalletTransaction }>('/wallet/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// KYC API
export const kycAPI = {
  getUserKycDocuments: async (userId: string) => {
    return apiRequest<KycDocument[]>(`/users/${userId}/kyc`);
  },

  submitKycDocument: async (data: Omit<KycDocument, 'id' | 'createdAt'>) => {
    return apiRequest<{ message: string; document: KycDocument }>('/kyc', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Notifications API
export const notificationsAPI = {
  getUserNotifications: async (userId: string) => {
    return apiRequest<Notification[]>(`/users/${userId}/notifications`);
  },

  markAsRead: async (id: string) => {
    return apiRequest<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },
};

const api = {
  auth: authAPI,
  users: usersAPI,
  tournaments: tournamentsAPI,
  matches: matchesAPI,
  wallet: walletAPI,
  kyc: kycAPI,
  notifications: notificationsAPI,
};

export default api;
