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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { PageMeta } from '@/components/layout/PageMeta';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signUp(signUpEmail, signUpPassword, signUpName);
      toast({
        title: 'Account created!',
        description: 'Welcome to SoloSuccess Academy. You can now access your dashboard.',
      });
      navigate(from, { replace: true });
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
            Join 10,000+ Solo Founders
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
              <TabsList className="grid w-full grid-cols-2 bg-black/60 border border-primary/20 p-1">
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
                    <Label htmlFor="signin-password" className="text-foreground/80 font-medium">Password</Label>
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
              <p className="text-xs text-center text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
