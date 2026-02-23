/**
 * @file ResetPassword.tsx — Password Reset Page
 * 
 * This page handles the final step of the password reset flow:
 * 1. User clicks "Forgot Password" on the Auth page
 * 2. They receive an email with a magic link
 * 3. Clicking the link brings them HERE with a recovery token in the URL
 * 4. They enter a new password and submit
 * 5. Supabase updates their password via `updateUser()`
 * 
 * IMPORTANT: This must be a PUBLIC route (not behind ProtectedRoute),
 * because the user arrives here from an email link before being fully
 * authenticated. Supabase auto-signs them in via the recovery token.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { PageMeta } from "@/components/layout/PageMeta";

export default function ResetPassword() {
  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  // Tracks whether the recovery session is valid
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const navigate = useNavigate();
  const { toast } = useToast();

  /**
   * On mount, listen for the PASSWORD_RECOVERY auth event.
   * Supabase fires this when the user arrives via a recovery link,
   * which auto-signs them in with a temporary session.
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          // Recovery token is valid — show the form
          setIsValidSession(true);
          setIsCheckingSession(false);
        }
      }
    );

    // Also check if there's already an active session (user may have
    // already been signed in by the recovery token before this effect ran)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      }
      setIsCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Handle the password update submission.
   * Validates passwords match, then calls Supabase to update.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the password using Supabase Auth
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Password updated! 🎉",
        description: "Your password has been reset successfully.",
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset password";
      toast({
        title: "Reset failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking the recovery session
  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center cyber-bg">
        <PageMeta title="Reset Password" description="Reset your SoloSuccess Academy password" />
        <p className="text-muted-foreground font-mono">Verifying reset link...</p>
      </div>
    );
  }

  // Invalid or expired recovery link
  if (!isValidSession) {
    return (
      <div className="flex min-h-screen items-center justify-center cyber-bg p-4">
        <PageMeta title="Reset Password" description="Reset your SoloSuccess Academy password" />
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invalid or Expired Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center cyber-bg p-4">
        <PageMeta title="Password Reset" description="Your password has been reset" />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-primary mb-2" />
            <CardTitle>Password Updated!</CardTitle>
            <CardDescription>
              Redirecting you to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Main reset form
  return (
    <div className="flex min-h-screen items-center justify-center cyber-bg p-4">
      <PageMeta title="Reset Password" description="Set a new password for your SoloSuccess Academy account" />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Set New Password</CardTitle>
          <CardDescription>
            Enter your new password below. Make it strong and memorable!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New password field */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Confirm password field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !password || !confirmPassword}
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
