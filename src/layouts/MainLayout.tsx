import { Outlet } from "react-router-dom"
import Navbar from "@/components/layout/Navbar"

export default function MainLayout() {
    return (
        <>
            <Navbar />
            <main>
                <Outlet />
            </main>
        </>
    )
}