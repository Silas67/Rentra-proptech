import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/contexts/AuthContext";
import { Home, Users, Building2, Loader2, ArrowRight } from "lucide-react";

const roles: {
  role: UserRole;
  title: string;
  desc: string;
  bullets: string[];
  icon: React.ElementType;
}[] = [
  {
    role: "tenant",
    title: "I'm looking for a home",
    desc: "Browse verified listings and book inspections",
    bullets: ["Search properties across Abuja", "Book inspections securely", "Save and track your favourites"],
    icon: Home,
  },
  {
    role: "agent",
    title: "I'm a real estate agent",
    desc: "Build your storefront and manage leads",
    bullets: ["Get a personal storefront link", "Track leads with built-in CRM", "Earn attribution on every deal you refer"],
    icon: Users,
  },
  {
    role: "landlord",
    title: "I'm a landlord",
    desc: "List your properties and manage bookings",
    bullets: ["Add and manage your properties", "Review inspection requests", "Verify tenants before approving"],
    icon: Building2,
  },
];

const Onboarding = () => {
  const { user, setRole } = useAuth();
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState<UserRole | null>(null);

  const handleSelect = async (role: UserRole) => {
    if (!user || selecting) return;
    setSelecting(role);

    await setRole(role);

    if (role === "agent") navigate("/agent-dashboard");
    else if (role === "landlord") navigate("/landlord-dashboard");
    else navigate("/listings");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex justify-center">
            <img src="/Logo.png" alt="Rentra" className="h-10 w-auto" />
          </div>
          <h1 className="font-display text-3xl font-bold">How will you use Rentra?</h1>
          <p className="mt-2 text-muted-foreground">
            Pick your role — you can always change this later in settings
          </p>
        </div>

        {/* Role cards */}
        <div className="grid gap-4">
          {roles.map((r) => {
            const isLoading = selecting === r.role;
            const isDisabled = selecting !== null && !isLoading;

            return (
              <button
                key={r.role}
                onClick={() => handleSelect(r.role)}
                disabled={selecting !== null}
                className={`group relative flex items-start gap-4 rounded-2xl border-2 bg-card p-6 text-left transition-all ${
                  isLoading
                    ? "border-primary bg-primary/5"
                    : isDisabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:border-primary hover:shadow-md cursor-pointer"
                }`}
              >
                {/* Icon */}
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isLoading ? "bg-primary" : "bg-primary/10 group-hover:bg-primary/20"
                }`}>
                  {isLoading
                    ? <Loader2 className="h-7 w-7 text-white animate-spin" />
                    : <r.icon className="h-7 w-7 text-primary" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base">{r.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{r.desc}</p>
                  <ul className="mt-3 space-y-1">
                    {r.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow */}
                {!isLoading && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default Onboarding;