import { Outlet } from "react-router-dom"
import Navbar from "@/components/layout/Navbar"
import DashboardNavbar from "@/components/layout/DashboardNavbar"

export default function DashboardLayout() {
    return (
        <div className="min-h-screen">
            <DashboardNavbar />
            <div className="p-6">
                <Outlet />
            </div>
        </div>
    )
}