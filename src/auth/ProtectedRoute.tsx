import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

type Props = {
    children: React.ReactNode
    allowedRoles?: ("tenant" | "agent" | "landlord")[]
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
    const { user, role, loading } = useAuth()

    if (loading) {
        return <div className="p-6">Loading...</div>
    }

    // Not logged in
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Logged in but role not allowed
    if (allowedRoles && (!role || !allowedRoles.includes(role))) {
        if (role === "agent") return <Navigate to="/agent-dashboard" replace />
        if (role === "landlord") return <Navigate to="/landlord-dashboard" replace />
        if (role === "tenant") return <Navigate to="/search" replace />
    }

    return <>{children}</>
}

export default ProtectedRoute