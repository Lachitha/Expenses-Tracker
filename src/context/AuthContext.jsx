import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('personal_auth')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed.user)
        setToken(parsed.token)
      } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const login = (userData, tokenStr) => {
    setUser(userData)
    setToken(tokenStr)
    localStorage.setItem('personal_auth', JSON.stringify({ user: userData, token: tokenStr }))
  }

  const register = (userData, tokenStr) => {
    setUser(userData)
    setToken(tokenStr)
    localStorage.setItem('personal_auth', JSON.stringify({ user: userData, token: tokenStr }))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('personal_auth')
  }

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  )
}
