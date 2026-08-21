import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import authService from '../services/authService'
import { getStoredUser, setStoredUser, setToken } from '../services/apiClient'
import { ROLES } from '../utils/constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())

  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('ecoroute:unauthorized', onUnauthorized)
    return () => window.removeEventListener('ecoroute:unauthorized', onUnauthorized)
  }, [])

  const login = async (credentials) => {
    const result = await authService.login(credentials)
    setToken(result.token)
    setStoredUser(result.user)
    setUser(result.user)
    return result.user
  }

  const register = async (data) => {
    const result = await authService.register(data)
    setToken(result.token)
    setStoredUser(result.user)
    setUser(result.user)
    return result.user
  }

  const logout = () => {
    setToken(null)
    setStoredUser(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === ROLES.ADMIN,
      isDriver: user?.role === ROLES.DRIVER,
      isCommunity: user?.role === ROLES.COMMUNITY,
      homePath: user ? `/${user.role}` : '/login',
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
