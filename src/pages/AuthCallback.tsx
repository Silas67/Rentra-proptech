import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.error("Auth callback error:", error);
        navigate("/login");
        return;
      }

      const user = data.session.user;

      // Check if profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        // New Google user — create profile and send to onboarding
        await supabase.from("profiles").upsert({
          id: user.id,
          name: user.user_metadata?.full_name ?? user.email,
          email: user.email,
        });
        navigate("/onboarding");
      } else if (!profile.role) {
        // Profile exists but no role set — send to onboarding
        navigate("/onboarding");
      } else {
        // Existing user with role — send to home
        navigate("/");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center text-muted-foreground">
        <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin opacity-40" />
        <p className="text-sm">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;