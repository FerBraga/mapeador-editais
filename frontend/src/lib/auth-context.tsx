import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchMe, loginUser, registerUser } from '@/lib/api'
import type { AuthUser, LoginPayload, RegisterPayload } from '@/types/api'

const TOKEN_STORAGE_KEY = 'mapeador-editais:token'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // localStorage unavailable (private mode, blocked storage, etc.) - session
    // just won't persist across reloads, rest of the flow still works.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() => readStoredToken() !== null)

  // Restores the session from a persisted token (e.g. on page reload) by
  // asking the backend who it belongs to; clears it if the token no longer
  // validates (expired, tampered, or the account is gone).
  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }
    let cancelled = false
    setIsLoading(true)
    fetchMe(token)
      .then((fetchedUser) => {
        if (cancelled) return
        if (fetchedUser) {
          setUser(fetchedUser)
        } else {
          setToken(null)
          storeToken(null)
        }
      })
      .catch(() => {
        if (cancelled) return
        setToken(null)
        storeToken(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function login(payload: LoginPayload) {
    const result = await loginUser(payload)
    setToken(result.accessToken)
    storeToken(result.accessToken)
    setUser(result.user)
  }

  async function register(payload: RegisterPayload) {
    const result = await registerUser(payload)
    setToken(result.accessToken)
    storeToken(result.accessToken)
    setUser(result.user)
  }

  function logout() {
    setToken(null)
    storeToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
