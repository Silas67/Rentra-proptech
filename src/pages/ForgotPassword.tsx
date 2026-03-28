import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Loader2, ArrowLeft, MailCheck } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address"); return; }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setSent(true);
  };

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
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-green-100">
              <MailCheck className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="font-display text-2xl font-bold">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a reset link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Follow the instructions in the email.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn't receive it? Check your spam or{" "}
              <button onClick={() => setSent(false)} className="text-primary hover:underline">
                try again
              </button>.
            </p>
            <Button asChild variant="outline" className="w-full mt-2">
              <Link to="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Back to login</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="font-display text-2xl font-bold">Forgot password?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                  placeholder="you@example.com"
                  className={error ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>

              <Button className="w-full" disabled={loading}>
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  : "Send reset link"
                }
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
