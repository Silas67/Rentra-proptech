/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { authService } from "@/services/authService"

type User = {
  id: string
  email?: string
  name?: string
  phone?: string
}

type UserRole = "tenant" | "agent" | "landlord"

type AuthContextType = {
  user: User | null
  role: UserRole
  loading: boolean
  signup: (email: string, password: string, name: string, phone: number) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  setRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, name, phone")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching profile:", error)
      return
    }

    if (data) {
      setRole(data.role)
      setUser((prev) =>
        prev
          ? { ...prev, name: data.name, phone: data.phone }
          : prev
      )
    }
  }


  useEffect(() => {
    const init = async () => {
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        await fetchProfile(currentUser.id)
      }
      setLoading(false)
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const u: User = {
            id: session.user.id,
            email: session.user.email,
          }
          setUser(u)
          setLoading(false)
          await fetchProfile(u.id)

        } else {
          setUser(null)
          setRole(null)
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const signup = async (
    email: string,
    password: string,
    name: string,
    phone: number
  ) => {
    const user = await authService.signup(email, password, name)

    if (!user) return false

    setUser(user)

    // Optional: store name/phone immediately
    await supabase.from("profiles").update({
      name,
      phone: String(phone),
    }).eq("id", user.id)

    return true
  }

  const login = async (email: string, password: string) => {
    const user = await authService.login(email, password)

    if (!user) return false

    setUser(user)
    await fetchProfile(user.id)

    return true
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, role, loading, signup, login, logout, setRole }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}