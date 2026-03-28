import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { Home, Users, Building2 } from "lucide-react";

const roles: {
  role: UserRole
  title: string
  desc: string
  icon: React.ElementType
}[] = [
    { role: "tenant", title: "I'm a Tenant", desc: "Looking for a place to live", icon: Home },
    { role: "agent", title: "I'm an Agent", desc: "Helping tenants find their perfect home", icon: Users },
    { role: "landlord", title: "I'm a Landlord", desc: "Managing my rental properties", icon: Building2 },
  ]

const Onboarding = () => {
  const { user, setRole } = useAuth();
  const navigate = useNavigate();

  const handleSelect = async (role: UserRole) => {
    if (!user) return;


    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    setRole(role);


    if (role === "agent") navigate("/agent-dashboard");
    else if (role === "landlord") navigate("/landlord-dashboard");
    else navigate("/tenant-dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <h1 className="mb-2 text-3xl font-bold">How will you use Rentra?</h1>
        <p className="mb-8 text-muted-foreground">
          Select your role to personalize your experience
        </p>

        <div className="grid gap-4">
          {roles.map((r) => (
            <button
              key={r.role}
              onClick={() => handleSelect(r.role)}
              className="flex items-center gap-4 rounded-xl border-2 bg-card p-6 text-left hover:border-primary"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <r.icon className="h-7 w-7 text-primary" />
              </div>

              <div>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm text-muted-foreground">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;