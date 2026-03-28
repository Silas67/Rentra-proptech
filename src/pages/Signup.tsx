import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Loader2, Eye, EyeOff, Check, X } from "lucide-react";
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validate = (fields = { name, email, phone, password }): FormErrors => {
    const newErrors: FormErrors = {};

    if (!fields.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (fields.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!fields.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!fields.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-()]{7,15}$/.test(fields.phone)) {
      newErrors.phone = "Enter a valid phone number";
    }

    if (!fields.password) {
      newErrors.password = "Password is required";
    } else if (!passwordRules.every((r) => r.test(fields.password))) {
      newErrors.password = "Password does not meet requirements";
    }

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
      toast({
        title: "Signup failed",
        description: "This email may already be in use. Try logging in instead.",
        variant: "destructive",
      });
    }
  };

  const passwordStrength = passwordRules.filter((r) => r.test(password)).length;
  const strengthColors = ["bg-destructive", "bg-destructive", "bg-yellow-500", "bg-green-500"];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full min-w-[500px] max-w-[700px]">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold">Rentra</span>
          </Link>
          <h1 className="font-sans text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join Rentra today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Full Name */}
          <div className="space-y-1">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (touched.name) setErrors(validate({ name: e.target.value, email, phone, password }));
              }}
              onBlur={() => handleBlur("name")}
              placeholder="John Doe"
              className={touched.name && errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {touched.name && errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) setErrors(validate({ name, email: e.target.value, phone, password }));
              }}
              onBlur={() => handleBlur("email")}
              placeholder="you@example.com"
              className={touched.email && errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {touched.email && errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (touched.phone) setErrors(validate({ name, email, phone: e.target.value, password }));
              }}
              onBlur={() => handleBlur("phone")}
              placeholder="+234 000 000 0000"
              className={touched.phone && errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {touched.phone && errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) setErrors(validate({ name, email, phone, password: e.target.value }));
                }}
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

            {/* Password strength indicator */}
            {password && (
              <div className="space-y-2 mt-4">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 mt-4 ${i <= passwordStrength ? strengthColors[passwordStrength] : "bg-muted"
                        }`}
                    />
                  ))}
                </div>
                {passwordStrength > 0 && (
                  <p className={`text-xs font-medium ${passwordStrength === 3 ? "text-green-500" : "text-yellow-500"
                    }`}>
                    {strengthLabels[passwordStrength]}
                  </p>
                )}
                <div className="space-y-1">
                  {passwordRules.map((rule) => (
                    <div key={rule.label} className="flex items-center gap-1.5">
                      {rule.test(password)
                        ? <Check className="h-3 w-3 text-green-500" />
                        : <X className="h-3 w-3 text-muted-foreground" />
                      }
                      <span className={`text-xs ${rule.test(password) ? "text-green-500" : "text-muted-foreground"
                        }`}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {touched.password && errors.password && !password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <Button className="w-full" disabled={loading}>
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
              : "Sign up"
            }
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
