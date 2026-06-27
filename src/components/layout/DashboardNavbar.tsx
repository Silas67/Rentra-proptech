import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Menu, X, Bell, Home, Search, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { heroConfig } from "@/config";
import { messagingService } from "@/services/messagingService";

const DashboardNavbar = () => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get initials from name
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  const displayName = user?.name || user?.email?.split("@")[0] || "User";

  const roleLabel = role === "agent" ? "Agent" : role === "landlord" ? "Landlord" : "Tenant";

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const count = await messagingService.getUnreadCount(user.id);
      setUnreadCount(count);
    };
    fetchUnread();
    // Poll every 30 seconds for new messages
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b bg-card/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-sans font-bold text-lg tracking-tight hidden sm:block">
            {heroConfig.brandName}
          </span>
        </Link>

        {/* Center — role badge */}
        <div className="hidden md:flex items-center gap-2">
          <span className="rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground capitalize">
            {roleLabel} Dashboard
          </span>
        </div>

        {/* Right — user info + actions */}
        <div className="hidden md:flex items-center gap-3">

          {/* Browse listings */}
          <Link
            to="/listings"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:block">Browse</span>
          </Link>

          {/* Messages */}
          <Link
            to="/messages"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            title="Messages"
          >
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Notifications — placeholder */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* User info */}
          <div className="flex items-center gap-2.5 rounded-xl border bg-muted/50 px-3 py-1.5">
            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shrink-0">
              {initials}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{roleLabel}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4">
          <div className="flex flex-col gap-2">

            {/* User info */}
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-3 mb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">{roleLabel}</p>
              </div>
            </div>

            <Link
              to="/listings"
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <Search className="h-4 w-4" />
              Browse Properties
            </Link>

            <Link
              to="/messages"
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </div>
              {unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default DashboardNavbar;