"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type UserRole = "student" | "mentor" | "admin"

export interface User {
  id: string
  full_name: string
  email: string
  role: UserRole
  student_id?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  setRole: (role: UserRole) => void
  updateProfile: (data: { full_name: string }) => Promise<{ success: boolean; error?: string }>
}

export interface RegisterData {
  full_name: string
  email: string
  password: string
  role: "student" | "mentor"
  student_id?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo users for each role
const demoUsers: Record<UserRole, User> = {
  student: {
    id: "1",
    full_name: "John Smith",
    email: "john.smith@university.edu",
    role: "student",
    student_id: "STU001",
    created_at: "2024-01-15T10:30:00Z",
  },
  mentor: {
    id: "2",
    full_name: "Dr. Sarah Chen",
    email: "sarah.chen@university.edu",
    role: "mentor",
    created_at: "2023-08-01T09:00:00Z",
  },
  admin: {
    id: "3",
    full_name: "Admin User",
    email: "admin@university.edu",
    role: "admin",
    created_at: "2023-01-01T00:00:00Z",
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (password === "password123") {
      const matchedUser = Object.values(demoUsers).find((u) => u.email === email)
      if (matchedUser) {
        setUser(matchedUser)
      } else {
        setUser({
          id: "4",
          full_name: "Demo User",
          email,
          role: "student",
          created_at: new Date().toISOString(),
        })
      }
      return { success: true }
    }

    return { success: false, error: "Invalid email or password" }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const existingUser = Object.values(demoUsers).find((u) => u.email === data.email)
    if (existingUser) {
      return { success: false, error: "An account with this email already exists" }
    }

    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      student_id: data.student_id,
      created_at: new Date().toISOString(),
    }
    setUser(newUser)
    return { success: true }
  }

  const logout = () => {
    setUser(null)
  }

  const setRole = (role: UserRole) => {
    setUser(demoUsers[role])
  }

  const updateProfile = async (data: { full_name: string }): Promise<{ success: boolean; error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    if (data.full_name.trim().length < 2) {
      return { success: false, error: "Name must be at least 2 characters" }
    }

    setUser({ ...user, full_name: data.full_name })
    return { success: true }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, setRole, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
