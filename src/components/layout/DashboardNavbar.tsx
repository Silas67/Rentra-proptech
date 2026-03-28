import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, Search, LogOut, Menu, X } from "lucide-react";
import { LuLayoutDashboard } from "react-icons/lu";
import { useState } from "react";
import { heroConfig } from "@/config";

const Navbar = () => {
    const { user, loading, logout, role } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isAuthenticated = !!user;

    const goToDashboard = () => {
        if (!user) return navigate("/login");

        if (role === "agent") return navigate("/agent-dashboard");
        if (role === "landlord") return navigate("/landlord-dashboard");
        if (role === "tenant") return navigate("/tenant-dashboard");

        // fallback if role not set
        return navigate("/onboarding");
    };

    if (loading) return null;

    return (
        <nav className="absolute top-0 left-0 right-0 z-40 px-6 md:px-6 py-2 flex items-center justify-between">
            <div className="container flex h-16 items-center justify-between">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                        <Home className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="text-forest-dark font-sans font-bold text-lg tracking-tight">
                        {heroConfig.brandName}
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-6 md:flex">



                    {/* Search */}
                    <Link
                        to="/listings"
                        className="flex items-center gap-1.5 text-sm font-medium text-forest-dark/80 transition-colors hover:text-forest-dark"
                    >
                        <Search className="h-4 w-4" />
                    </Link>

                    {/* Auth Section */}
                    {isAuthenticated ? (
                        <div className="flex items-center gap-3">

                            <Button onClick={goToDashboard} variant="outline" size="sm" className="hidden md:flex">
                                Dashboard
                            </Button>

                            <Button variant="outline" size="sm" onClick={logout}>
                                <LogOut className="h-6 w-4" />
                            </Button>

                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button size="sm" asChild>
                                <Link to="/signup">SignUp / Login</Link>
                            </Button>
                        </div>
                    )}

                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="border-t bg-card p-4 md:hidden absolute w-full left-0 top-16">
                    <div className="flex flex-col gap-3">

                        <Link
                            to="/search"
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                            onClick={() => setMobileOpen(false)}
                        >
                            <Search className="h-4 w-4" />
                            Browse Properties
                        </Link>

                        {isAuthenticated ? (
                            <>
                                <button
                                    onClick={() => {
                                        logout();
                                        setMobileOpen(false);
                                    }}
                                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-muted"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Log out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Log in
                                </Link>

                                <Link
                                    to="/signup"
                                    className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Sign up
                                </Link>
                            </>
                        )}

                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;