import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Home, Search, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { heroConfig } from "@/config";

const Navbar = () => {
  const { user, loading, logout, role } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false); 

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAuthenticated = !!user;

  const goToDashboard = () => {
    if (!user) return navigate("/login");

    if (role === "agent") return navigate("/agent-dashboard");
    if (role === "landlord") return navigate("/landlord-dashboard");
    if (role === "tenant") return navigate("/tenant-dashboard");

    return navigate("/onboarding");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-16 bg-forest-dark">
        Loading...
      </div>
    );

  return (
    <nav
  className={`fixed top-0 left-0 right-0 z-40 px-6 py-2 flex items-center justify-between transition-all duration-500
    ${scrolled
      ? "backdrop-blur-md bg-black/30 border-b border-white/10 shadow-sm"
      : "bg-transparent border-transparent"
    }`}
>
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="text-white font-sans font-bold text-lg tracking-tight">
            {heroConfig.brandName}
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {heroConfig.navLinks.length > 0 && (
            <div className="hidden md:flex items-center gap-8 text-white/80 text-sm font-body">
              {heroConfig.navLinks.map((link) => (
                <div key={link.label} className="relative group">
                  <a
                    href={link.href}
                    className="hover:text-white transition-colors duration-300 group"
                  >
                    <div className="flex gap-1">
                      {link.label}
                      {link.submenu && <span className="arrow"></span>}
                    </div>

                    <p className="w-full scale-x-0 group-hover:scale-x-100 border transition-all origin-left duration-300 border-white"></p>
                  </a>

                  {/* Dropdown */}
                  {link.submenu && (
                    <div className="absolute left-0 mt-2 w-40 bg-white text-black rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {link.submenu.map((sub) => (
                        <a
                          key={sub.label}
                          href={sub.href}
                          className="block px-4 py-2 hover:bg-forest-dark hover:text-white transition-colors duration-300"
                        >
                          {sub.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <Link
            to="/listings"
            className="flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* Auth Section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Button onClick={goToDashboard}>Dashboard</Button>

              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-6 w-4 text-white/80" />
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
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
{mobileOpen && (
  <div
    className={`md:hidden absolute w-full left-0 top-16 border-t border-white/10 p-4
      ${scrolled ? "bg-black/60 backdrop-blur-md" : "bg-black/40 backdrop-blur-sm"}`}
  >
    <div className="flex flex-col gap-1">

      {/* Nav Links from heroConfig */}
      {heroConfig.navLinks.map((link) => (
        <div key={link.label}>
          <a
            href={link.href}
            className="flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </a>

          {/* Submenu items if any */}
          {link.submenu && (
            <div className="ml-4 flex flex-col gap-1 border-l border-white/10 pl-3 mt-1 mb-1">
              {link.submenu.map((sub) => (
                <a
                  key={sub.label}
                  href={sub.href}
                  className="rounded-md px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {sub.label}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Divider */}
      <div className="my-2 h-px bg-white/10" />

      {/* Browse Properties */}
      <Link
        to="/listings"
        className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        onClick={() => setMobileOpen(false)}
      >
        <Search className="h-4 w-4" />
        Browse Properties
      </Link>

      {/* Auth */}
      {isAuthenticated ? (
        <>
          <button
            onClick={() => { goToDashboard(); setMobileOpen(false); }}
            className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => { logout(); setMobileOpen(false); }}
            className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-2 mt-1">
          <Link
            to="/login"
            className="rounded-md px-3 py-2.5 text-center text-sm font-medium text-white/80 border border-white/20 hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-md bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Sign up
          </Link>
        </div>
      )}

    </div>
  </div>
)}
    </nav>
  );
};

export default Navbar;
