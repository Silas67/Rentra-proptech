import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Check, X, Shield, Building2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FormErrors = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
};

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains a number", test: (p: string) => /\d/.test(p) },
  { label: "Contains a letter", test: (p: string) => /[a-zA-Z]/.test(p) },
];

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validate = (fields = { name, email, phone, password }): FormErrors => {
    const newErrors: FormErrors = {};
    if (!fields.name.trim()) newErrors.name = "Full name is required";
    else if (fields.name.trim().length < 2) newErrors.name = "Name must be at least 2 characters";
    if (!fields.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) newErrors.email = "Enter a valid email address";
    if (!fields.phone) newErrors.phone = "Phone number is required";
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(fields.phone)) newErrors.phone = "Enter a valid phone number";
    if (!fields.password) newErrors.password = "Password is required";
    else if (!passwordRules.every((r) => r.test(fields.password))) newErrors.password = "Password does not meet requirements";
    return newErrors;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true });
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setLoading(true);
    const success = await signup(email, password, name, Number(phone));
    setLoading(false);
    if (success) {
      toast({ title: "Account created! 🎉" });
      navigate("/onboarding");
    } else {
      toast({ title: "Signup failed", description: "This email may already be in use.", variant: "destructive" });
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast({ title: "Google signup failed", variant: "destructive" });
      setGoogleLoading(false);
    }
  };

  const passwordStrength = passwordRules.filter((r) => r.test(password)).length;
  const strengthColors = ["bg-destructive", "bg-destructive", "bg-yellow-500", "bg-green-500"];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  return (
    <div className="flex min-h-screen w-full">

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full border-2 border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white" />
        </div>

        <div className="relative z-10">
          <Link to="/">
            <img src="/Logo.png" alt="Rentra" className="h-10 w-auto brightness-0 invert" />
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-white font-display text-4xl font-bold leading-tight">
            Join thousands finding homes in Abuja
          </h2>
          <p className="text-white/70 text-lg">
            Whether you're a tenant, landlord, or agent — Rentra has the right tools for you.
          </p>
          <div className="space-y-3 pt-4">
            {[
              { icon: Shield, text: "Verified agents and listings" },
              { icon: Building2, text: "Properties across Abuja" },
              { icon: Star, text: "NIESV fee compliance guaranteed" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-white/80 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/40 text-xs">© 2025 Rentra. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/">
              <img src="/Logo.png" alt="Rentra" className="h-10 w-auto mx-auto" />
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Join Rentra today — it's free to start</p>
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 mb-6"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            <div className="space-y-1">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => { setName(e.target.value); if (touched.name) setErrors(validate({ name: e.target.value, email, phone, password })); }}
                onBlur={() => handleBlur("name")}
                placeholder="John Doe"
                className={touched.name && errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.name && errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors(validate({ name, email: e.target.value, phone, password })); }}
                onBlur={() => handleBlur("email")}
                placeholder="you@example.com"
                className={touched.email && errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.email && errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (touched.phone) setErrors(validate({ name, email, phone: e.target.value, password })); }}
                onBlur={() => handleBlur("phone")}
                placeholder="+234 000 000 0000"
                className={touched.phone && errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.phone && errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (touched.password) setErrors(validate({ name, email, phone, password: e.target.value })); }}
                  onBlur={() => handleBlur("password")}
                  placeholder="••••••••"
                  className={touched.password && errors.password ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {password && (
                <div className="space-y-2 mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < passwordStrength ? strengthColors[passwordStrength] : "bg-muted"}`} />
                    ))}
                  </div>
                  {passwordStrength > 0 && (
                    <p className={`text-xs font-medium ${passwordStrength === 3 ? "text-green-500" : "text-yellow-500"}`}>
                      {strengthLabels[passwordStrength]}
                    </p>
                  )}
                  <div className="space-y-1">
                    {passwordRules.map((rule) => (
                      <div key={rule.label} className="flex items-center gap-1.5">
                        {rule.test(password) ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
                        <span className={`text-xs ${rule.test(password) ? "text-green-500" : "text-muted-foreground"}`}>{rule.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {touched.password && errors.password && !password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button className="w-full h-11 text-sm" disabled={loading || googleLoading}>
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
                : "Create account"
              }
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;