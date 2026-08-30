'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { RoleUser } from '@/lib/rbac'
import { apiFetch, ApiError, setTokens, clearTokens, getAccessToken } from '@/lib/api'

interface AuthContextType {
  isAuthenticated: boolean
  user: RoleUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_CACHE_KEY = 'mdmis_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<RoleUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Rehydrate session from a stored access token + cached profile, then
  // confirm against the backend (GET /api/auth/me/) in case the role or
  // profile changed since the last visit.
  useEffect(() => {
    async function rehydrate() {
      const token = getAccessToken()
      const cached = localStorage.getItem(USER_CACHE_KEY)
      if (!token || !cached) {
        setIsLoading(false)
        return
      }
      try {
        const cachedUser = JSON.parse(cached) as RoleUser
        setUser(cachedUser)
        setIsAuthenticated(true)
      } catch {
        localStorage.removeItem(USER_CACHE_KEY)
      }

      try {
        const freshUser = await apiFetch<RoleUser>('/auth/me/')
        setUser(freshUser)
        setIsAuthenticated(true)
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(freshUser))
      } catch {
        // Refresh token also expired/invalid — clear the stale session.
        clearTokens()
        localStorage.removeItem(USER_CACHE_KEY)
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    rehydrate()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const data = await apiFetch<{ access: string; refresh: string; user: RoleUser }>(
        '/auth/login/',
        { method: 'POST', body: JSON.stringify({ email, password }) },
        { auth: false },
      )
      setTokens(data.access, data.refresh)
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user))
      setUser(data.user)
      setIsAuthenticated(true)
    } catch (err) {
      if (err instanceof ApiError) throw new Error(err.message)
      throw err
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    clearTokens()
    localStorage.removeItem(USER_CACHE_KEY)
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
