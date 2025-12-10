/**
 * Auth Service - Mock authentication (real auth not implemented in backend yet)
 * 
 * TODO: Replace with real API calls when Auth Service is implemented
 */

// Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'mentor' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Mock users for testing
const MOCK_USERS: Record<string, User> = {
  'student@test.com': {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'student@test.com',
    first_name: 'John',
    last_name: 'Student',
    role: 'student',
  },
  'mentor@test.com': {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'mentor@test.com',
    first_name: 'Jane',
    last_name: 'Mentor',
    role: 'mentor',
  },
  'admin@test.com': {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'admin@test.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
  },
};

// Mock Auth API
export const authApi = {
  /**
   * Mock login - accepts any password for mock users
   * TODO: Replace with real API call when backend is ready
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = MOCK_USERS[credentials.email];
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Generate mock tokens
    const response: AuthResponse = {
      access_token: `mock-jwt-token-${user.id}`,
      refresh_token: `mock-refresh-token-${user.id}`,
      user,
    };

    // Store in localStorage
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  },

  /**
   * Logout - clear stored tokens
   */
  logout: async (): Promise<void> => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
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
    return !!localStorage.getItem('access_token');
  },

  /**
   * Get stored access token
   */
  getToken: (): string | null => {
    return localStorage.getItem('access_token');
  },
};

// Export mock user IDs for testing
export const MOCK_USER_IDS = {
  STUDENT: '550e8400-e29b-41d4-a716-446655440001',
  MENTOR: '550e8400-e29b-41d4-a716-446655440002',
  ADMIN: '550e8400-e29b-41d4-a716-446655440003',
};
