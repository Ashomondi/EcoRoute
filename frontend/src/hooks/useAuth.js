import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from '../services/authService'

const USER_KEY = 'ecoroute_user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY))
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const persist = useCallback((u) => {
    setUser(u)
    if (u) {
      localStorage.setItem(USER_KEY, JSON.stringify(u))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  }, [])

  const login = useCallback(
    async (email, password) => {
      const u = await apiLogin(email, password)
      persist(u)
      return u
    },
    [persist],
  )

  const register = useCallback(
    async (input) => {
      const u = await apiRegister(input)
      persist(u)
      return u
    },
    [persist],
  )

  const logout = useCallback(() => {
    apiLogout()
    persist(null)
  }, [persist])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
