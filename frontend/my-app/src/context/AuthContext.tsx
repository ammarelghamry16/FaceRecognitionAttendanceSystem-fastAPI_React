/**
 * Authentication Context
 * Provides auth state and methods throughout the app
 */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/services/authService';
import type { User, LoginCredentials } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithFace: (base64Image: string) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: 'student' | 'mentor' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check if demo mode is enabled (for development without backend)
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Demo users for testing without backend (only used when DEMO_MODE is true)
const demoUsers: Record<string, User> = {
  'student@test.com': {
    id: '1',
    email: 'student@test.com',
    full_name: 'John Smith',
    first_name: 'John',
    last_name: 'Smith',
    role: 'student',
    student_id: 'STU001',
    is_active: true,
  },
  'mentor@test.com': {
    id: '2',
    email: 'mentor@test.com',
    full_name: 'Dr. Sarah Chen',
    first_name: 'Sarah',
    last_name: 'Chen',
    role: 'mentor',
    is_active: true,
  },
  'admin@test.com': {
    id: '3',
    email: 'admin@test.com',
    full_name: 'Admin User',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true,
  },
};

// Helper to parse full_name into first/last
function parseUser(user: User): User {
  if (!user.first_name || !user.last_name) {
    const parts = user.full_name?.split(' ') || ['User'];
    return {
      ...user,
      first_name: parts[0],
      last_name: parts.slice(1).join(' ') || '',
    };
  }
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (currentUser) {
      setUser(parseUser(currentUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    // Demo mode: use demo users (only for development)
    if (DEMO_MODE) {
      const demoUser = demoUsers[credentials.email];
      if (demoUser) {
        localStorage.setItem('user', JSON.stringify(demoUser));
        localStorage.setItem('access_token', 'demo_token');
        setUser(demoUser);
        return;
      }
    }

    // Production: use real API
    try {
      const response = await authApi.login(credentials);
      setUser(parseUser(response.user));
    } catch (error) {
      // Re-throw the error for the login form to handle
      throw error;
    }
  };

  const loginWithFace = async (base64Image: string) => {
    try {
      const response = await authApi.loginWithFaceBase64(base64Image);
      setUser(parseUser(response.user));
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  // For demo: switch between roles (only works in demo mode)
  const setRole = (role: 'student' | 'mentor' | 'admin') => {
    if (!DEMO_MODE) return;

    const roleEmails = {
      student: 'student@test.com',
      mentor: 'mentor@test.com',
      admin: 'admin@test.com',
    };
    const demoUser = demoUsers[roleEmails[role]];
    if (demoUser) {
      localStorage.setItem('user', JSON.stringify(demoUser));
      setUser(demoUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithFace,
        logout,
        setRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
