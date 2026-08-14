'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { RoleUser, ROLE_USERS } from '@/lib/rbac'

interface AuthContextType {
  isAuthenticated: boolean
  user: RoleUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<RoleUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('mdmis_auth')
    if (storedAuth) {
      try {
        const { isAuthenticated: storedIsAuth, user: storedUser } = JSON.parse(storedAuth)
        setIsAuthenticated(storedIsAuth)
        setUser(storedUser)
      } catch (error) {
        console.error('Failed to parse stored auth:', error)
        localStorage.removeItem('mdmis_auth')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Get user from RBAC mapping
    const roleUser = ROLE_USERS[email]
    
    if (!roleUser) {
      throw new Error('Invalid credentials')
    }
    
    const authData = {
      isAuthenticated: true,
      user: roleUser
    }
    
    setIsAuthenticated(true)
    setUser(roleUser)
    
    // Persist to localStorage
    localStorage.setItem('mdmis_auth', JSON.stringify(authData))
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    
    // Clear from localStorage
    localStorage.removeItem('mdmis_auth')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {isLoading ? null : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
