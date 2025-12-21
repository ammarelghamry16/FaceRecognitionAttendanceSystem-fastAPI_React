/**
 * Auth Service - Real authentication using backend API
 */
import api from './api';

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  role: 'student' | 'mentor' | 'admin';
  student_id?: string;
  group?: string;
  is_active: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: 'student' | 'mentor' | 'admin';
  student_id?: string;
  group?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

// Storage helper - uses localStorage for "remember me", sessionStorage otherwise
const getStorage = (): Storage => {
  const rememberMe = localStorage.getItem('remember_me') === 'true';
  return rememberMe ? localStorage : sessionStorage;
};

// Auth API
export const authApi = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/api/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      // Determine storage based on rememberMe
      // Admin accounts NEVER use remember me for security reasons
      const isAdmin = response.data.user.role === 'admin';
      const rememberMe = isAdmin ? false : (credentials.rememberMe ?? false);

      // Store the remember me preference in localStorage (always persists)
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remember_me');
      }

      // Get the appropriate storage (admins always use sessionStorage)
      const storage = rememberMe ? localStorage : sessionStorage;

      // Store tokens in the appropriate storage
      storage.setItem('access_token', response.data.access_token);
      storage.setItem('refresh_token', response.data.refresh_token);
      storage.setItem('user', JSON.stringify(response.data.user));

      return response.data;
    } catch (error: unknown) {
      // Extract error message from API response
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        const message = axiosError.response?.data?.detail || 'Invalid email or password';
        throw new Error(message);
      }
      throw new Error('Network error. Please try again.');
    }
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<AuthResponse> => {
    const storage = getStorage();
    const refreshToken = storage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<AuthResponse>('/api/auth/refresh', {
      refresh_token: refreshToken
    });

    storage.setItem('access_token', response.data.access_token);
    storage.setItem('refresh_token', response.data.refresh_token);

    return response.data;
  },

  /**
   * Logout - clear stored tokens
   */
  logout: async (): Promise<void> => {
    // Clear from both storages to be safe
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/api/auth/me', data);
    const storage = getStorage();
    storage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await api.post('/api/auth/me/change-password', data);
  },

  /**
   * Validate current token
   */
  validateToken: async (): Promise<{ valid: boolean; user_id: string }> => {
    const response = await api.post('/api/auth/validate');
    return response.data;
  },

  /**
   * Get current user from localStorage or sessionStorage
   */
  getCurrentUser: (): User | null => {
    // Check localStorage first (remember me), then sessionStorage
    let userStr = localStorage.getItem('user');
    if (!userStr) {
      userStr = sessionStorage.getItem('user');
    }
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
  },

  /**
   * Get stored access token
   */
  getToken: (): string | null => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  },

  /**
   * Search users by name or student ID
   */
  searchUsers: async (query: string, role?: string, limit = 20): Promise<User[]> => {
    const params: Record<string, string | number> = { q: query, limit };
    if (role) params.role = role;
    const response = await api.get<User[]>('/api/auth/users/search', { params });
    return response.data;
  },

  /**
   * Get all users (admin only)
   */
  getAllUsers: async (skip = 0, limit = 100, role?: string): Promise<User[]> => {
    const params: Record<string, string | number> = { skip, limit };
    if (role) params.role = role;
    const response = await api.get<User[]>('/api/auth/users', { params });
    return response.data;
  },

  /**
   * Get all mentors
   */
  getMentors: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/api/auth/users', { params: { role: 'mentor' } });
    return response.data;
  },

  /**
   * Update a user (admin only)
   */
  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/api/auth/users/${userId}`, data);
    return response.data;
  },

  /**
   * Deactivate a user (admin only)
   */
  deactivateUser: async (userId: string): Promise<User> => {
    const response = await api.post<User>(`/api/auth/users/${userId}/deactivate`);
    return response.data;
  },

  /**
   * Activate a user (admin only)
   */
  activateUser: async (userId: string): Promise<User> => {
    const response = await api.post<User>(`/api/auth/users/${userId}/activate`);
    return response.data;
  },
};


export default authApi;
