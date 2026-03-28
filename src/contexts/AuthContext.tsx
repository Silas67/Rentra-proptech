/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { authService } from "@/services/authService"
import { useNavigate } from "react-router-dom"


type User = {
  id: string
  email?: string
  name?: string
  phone?: string
}

export type UserRole = "tenant" | "agent" | "landlord"

type AuthContextType = {
  user: User | null
  role: UserRole | null
  loading: boolean
  signup: (email: string, password: string, name: string, phone: number) => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  setRole: (role: UserRole) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRoleState] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // 🔍 Fetch profile
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
      setRoleState(data.role)
      setUser((prev) =>
        prev
          ? { ...prev, name: data.name, phone: data.phone }
          : prev
      )
    }
  }

  // 🚀 INIT
  useEffect(() => {
    let initialLoad = true

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
        if (initialLoad) {
          initialLoad = false
          return
        }

        if (session?.user) {
          const u: User = { id: session.user.id, email: session.user.email }
          setUser(u)
          await fetchProfile(u.id)
        } else {
          setUser(null)
          setRoleState(null)
        }
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  // 📝 SIGNUP
  const signup = async (
    email: string,
    password: string,
    name: string,
    phone: number
  ) => {
    const user = await authService.signup(email, password, name)

    if (!user) return false

    setUser(user)

    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        phone: String(phone),
      })
      .eq("id", user.id)

    if (error) {
      console.error("Profile update error:", error)
    }

    await fetchProfile(user.id)

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
    await supabase.auth.signOut()
    setUser(null)
    setRoleState(null)
    navigate("/")
  }


  const setRole = async (role: UserRole) => {
    if (!user) return

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", user.id)

    if (error) {
      console.error("Error setting role:", error)
      return
    }

    setRoleState(role)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        signup,
        login,
        logout,
        setRole,
      }}
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