

import { supabase } from "@/lib/supabase"

export const authService = {

    async signup(email: string, password: string, name: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name
                }
            }
        })

        if (error) {
            console.error("Signup error:", error.message)
            return null
        }

        return data.user
    },

    async login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            console.error("Login error:", error.message)
            return null
        }

        return data.user
    },

    async logout() {
        const { error } = await supabase.auth.signOut()

        if (error) {
            console.error("Logout error:", error.message)
        }
    },

    async getCurrentUser() {
        const { data } = await supabase.auth.getUser()
        return data.user
    }

}  