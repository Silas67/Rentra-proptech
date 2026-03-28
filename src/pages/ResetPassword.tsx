import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains a number", test: (p: string) => /\d/.test(p) },
  { label: "Contains a letter", test: (p: string) => /[a-zA-Z]/.test(p) },
];

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const navigate = useNavigate();
  const { toast } = useToast();

  const validate = () => {
    const newErrors: { password?: string; confirm?: string } = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!passwordRules.every((r) => r.test(password))) {
      newErrors.password = "Password does not meet requirements";
    }

    if (!confirm) {
      newErrors.confirm = "Please confirm your password";
    } else if (password !== confirm) {
      newErrors.confirm = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Password updated successfully!" });
    navigate("/login");
  };

  const passwordStrength = passwordRules.filter((r) => r.test(password)).length;
  const strengthColors = ["bg-destructive", "bg-destructive", "bg-yellow-500", "bg-green-500"];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold">Rentra</span>
          </Link>
          <h1 className="font-display text-2xl font-bold">Set new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* New Password */}
          <div className="space-y-1">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                className={errors.password ? "border-destructive focus-visible:ring-destructive pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength indicator */}
            {password && (
              <div className="space-y-2 mt-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i < passwordStrength ? strengthColors[passwordStrength] : "bg-muted"
                      }`}
                    />
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
                      {rule.test(password)
                        ? <Check className="h-3 w-3 text-green-500" />
                        : <X className="h-3 w-3 text-muted-foreground" />
                      }
                      <span className={`text-xs ${rule.test(password) ? "text-green-500" : "text-muted-foreground"}`}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.password && !password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
              placeholder="••••••••"
              className={errors.confirm ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
          </div>

          <Button className="w-full" disabled={loading}>
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
              : "Update password"
            }
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
