/**
 * @file Auth.tsx — Authentication Page (Sign In / Sign Up)
 * 
 * Handles both sign-in and sign-up in a tabbed interface.
 * 
 * KEY BEHAVIORS:
 * - Default tab can be set via URL param: /auth?mode=signup
 * - After successful auth, redirects to the page the user came from
 *   (stored in location.state.from by ProtectedRoute/AppLayout)
 * - Falls back to /dashboard if no return URL
 * - Shows password visibility toggle
 * - Toast notifications for success/error feedback
 * 
 * SECURITY NOTE:
 * - Email verification is enabled by default in production
 * - Password minimum length is 6 characters (enforced by Supabase)
 * 
 * PRODUCTION TODO:
 * - Add "Forgot Password" flow with resetPassword() from useAuth
 * - Add OAuth buttons (Google, GitHub) for social login
 * - Add password strength indicator
 * - Add rate limiting feedback for too many failed attempts
 * - Add CAPTCHA for sign-up to prevent bot registrations
 */
import { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Sparkles, MailCheck } from 'lucide-react';
import { PageMeta } from '@/components/layout/PageMeta';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const defaultTab = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const fromRaw = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
  const from = fromRaw && fromRaw !== '/auth' ? fromRaw : '/dashboard';

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form State
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(signInEmail, signInPassword);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      navigate(from, { replace: true });
    } catch (error: any) {
      toast({
        title: 'Error signing in',
        description: error.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Track whether we just signed up and need email confirmation
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await signUp(signUpEmail, signUpPassword, signUpName);

      // If the user's email is NOT confirmed yet, Supabase returns a user
      // but session will be null (email verification required)
      if (data.user && !data.session) {
        // Email confirmation is required — show the verification message
        setShowEmailConfirmation(true);
      } else {
        // Auto-confirm is on (dev mode) — go straight to dashboard
        toast({
          title: 'Account created!',
          description: 'Welcome to SoloSuccess Academy.',
        });
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      toast({
        title: 'Error creating account',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If the user just signed up and needs to verify, show a dedicated screen
  if (showEmailConfirmation) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4 relative">
        <PageMeta title="Verify Your Email" description="Check your email to verify your SoloSuccess Academy account." path="/auth" noIndex />
        <div className="cyber-grid" />
        <div className="w-full max-w-md relative z-10">
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl animate-orb-glow-primary" />
          <Card className="glass-card border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.2)] text-center p-8">
            {/* Animated mail icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 border border-primary/30 shadow-[0_0_25px_hsl(var(--primary)/0.4)]">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3 neon-text">Check Your Email</h2>
            <p className="text-muted-foreground mb-6">
              We sent a verification link to <span className="text-foreground font-medium">{signUpEmail}</span>. Click the link in your email to activate your account.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Didn't receive it? Check your spam folder or try signing up again.
            </p>
            <Button variant="neon" className="w-full" onClick={() => setShowEmailConfirmation(false)}>
              Back to Sign In
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 relative">
      <PageMeta
        title="Sign In"
        description="Sign in or create your SoloSuccess Academy account to access courses and track your progress."
        path="/auth"
        noIndex
      />
      {/* Cyber grid overlay */}
      <div className="cyber-grid" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Animated glow orbs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl animate-orb-glow-primary" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl animate-orb-glow-secondary" style={{ animationDelay: '1s' }} />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium mb-4 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
            <Sparkles className="h-4 w-4" />
            Be among the first founders to join
          </div>
          <h1 className="text-3xl font-display font-bold mb-2 neon-text">
            Start Your Journey
          </h1>
          <p className="text-muted-foreground">
            Access AI-powered courses designed for solo founders
          </p>
        </div>

        <Card className="glass-card border-primary/30 shadow-[0_0_40px_hsl(var(--primary)/0.2)]">
          <Tabs defaultValue={defaultTab} className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-muted border border-primary/20 p-1">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_hsl(var(--primary)/0.4)] transition-all duration-300"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_15px_hsl(var(--primary)/0.4)] transition-all duration-300"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-foreground/80 font-medium">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="neon-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-foreground/80 font-medium">Password</Label>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={async () => {
                          if (!signInEmail) {
                            toast({ title: 'Enter your email first', description: 'Please enter your email address above to receive a password reset link.', variant: 'destructive' });
                            return;
                          }
                          setIsLoading(true);
                          try {
                            await resetPassword(signInEmail);
                            toast({ title: 'Reset email sent', description: 'Check your email for a password reset link.' });
                          } catch (err: any) {
                            toast({ title: 'Error', description: err.message || 'Failed to send reset email.', variant: 'destructive' });
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        className="text-xs text-primary hover:underline disabled:opacity-50"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="neon-input pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" variant="neon" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-foreground/80 font-medium">Display Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your name"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      disabled={isLoading}
                      className="neon-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-foreground/80 font-medium">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="neon-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-foreground/80 font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        minLength={6}
                        disabled={isLoading}
                        className="neon-input pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters
                    </p>
                  </div>
                  <Button type="submit" variant="neon" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-0">
              {/* Divider */}
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-primary/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                </div>
              </div>

              {/* Google Sign-In Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const { error } = await lovable.auth.signInWithOAuth('google', {
                      redirect_uri: window.location.origin,
                    });
                    if (error) throw error;
                  } catch (err: any) {
                    toast({
                      title: 'Google sign-in failed',
                      description: err.message || 'Please try again.',
                      variant: 'destructive',
                    });
                    setIsLoading(false);
                  }
                }}
              >
                {/* Google "G" icon (inline SVG for zero-dependency) */}
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
