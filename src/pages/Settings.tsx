import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateNotificationPreferences } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Lock, 
  Loader2, 
  Moon, 
  Sun, 
  Monitor,
  Mail,
  Bell,
  Shield,
  KeyRound
} from 'lucide-react';
import { NeonSpinner, InlineSpinner } from '@/components/ui/neon-spinner';

export default function Settings() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const updateNotifications = useUpdateNotificationPreferences();

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Password reset email sent',
        description: 'Check your email for a link to reset your password.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send reset email',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleNotificationChange = async (
    field: 'emailNotifications' | 'courseUpdates' | 'discussionReplies',
    value: boolean
  ) => {
    if (!user?.id) return;
    
    try {
      await updateNotifications.mutateAsync({
        userId: user.id,
        [field]: value,
      });
      toast({ title: 'Preferences saved' });
    } catch (error: any) {
      toast({
        title: 'Failed to save',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // Auth check
  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="cyber-grid" />
          <div className="text-center glass-card p-8 rounded-lg relative z-10">
            <Lock className="h-12 w-12 text-primary mx-auto mb-4 drop-shadow-[0_0_15px_hsl(var(--primary)/0.5)]" />
            <h1 className="text-2xl font-display font-bold mb-2 neon-text">Sign In Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access settings.</p>
            <Button variant="neon" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex flex-col cyber-bg">
        <Header />
        <main className="flex-1 flex items-center justify-center relative">
          <div className="cyber-grid" />
          <NeonSpinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col cyber-bg">
      <Header />

      <main className="flex-1 py-8 relative">
        <div className="cyber-grid" />
        
        {/* Animated glow orbs */}
        <div className="absolute top-20 left-1/4 w-80 h-80 rounded-full blur-3xl animate-orb-glow-primary" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl animate-orb-glow-secondary" style={{ animationDelay: '1.5s' }} />
        
        <div className="container max-w-3xl relative z-10">
          <h1 className="text-3xl font-display font-bold mb-8 neon-text">Settings</h1>

          <div className="space-y-6">
            {/* Appearance */}
            <Card className="glass-card border-primary/30 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Monitor className="h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how the app looks on your device
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label className="text-foreground/80">Theme</Label>
                  <RadioGroup
                    value={theme}
                    onValueChange={setTheme}
                    className="grid grid-cols-3 gap-4"
                  >
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-primary/20 bg-black/40 backdrop-blur-sm p-4 hover:bg-primary/10 hover:border-primary/40 cursor-pointer transition-all duration-300 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                    >
                      <RadioGroupItem value="light" id="light" className="sr-only" />
                      <Sun className="h-6 w-6 mb-2 text-amber-400" />
                      <span className="text-sm font-medium">Light</span>
                    </Label>
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-primary/20 bg-black/40 backdrop-blur-sm p-4 hover:bg-primary/10 hover:border-primary/40 cursor-pointer transition-all duration-300 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                    >
                      <RadioGroupItem value="dark" id="dark" className="sr-only" />
                      <Moon className="h-6 w-6 mb-2 text-primary" />
                      <span className="text-sm font-medium">Dark</span>
                    </Label>
                    <Label
                      htmlFor="system"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-primary/20 bg-black/40 backdrop-blur-sm p-4 hover:bg-primary/10 hover:border-primary/40 cursor-pointer transition-all duration-300 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                    >
                      <RadioGroupItem value="system" id="system" className="sr-only" />
                      <Monitor className="h-6 w-6 mb-2 text-secondary" />
                      <span className="text-sm font-medium">System</span>
                    </Label>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="glass-card border-secondary/30 hover:border-secondary/50 hover:shadow-[0_0_30px_hsl(var(--secondary)/0.15)] transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Bell className="h-5 w-5 text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary)/0.5)]" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Manage your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-secondary/10 hover:border-secondary/30 transition-all duration-300">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications" className="text-base">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={profile?.email_notifications ?? true}
                    onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                    disabled={updateNotifications.isPending}
                    className="data-[state=checked]:bg-secondary data-[state=checked]:shadow-[0_0_10px_hsl(var(--secondary)/0.5)]"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-secondary/10 hover:border-secondary/30 transition-all duration-300">
                  <div className="space-y-0.5">
                    <Label htmlFor="course-updates" className="text-base">
                      Course Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new lessons and course content
                    </p>
                  </div>
                  <Switch
                    id="course-updates"
                    checked={profile?.course_updates ?? true}
                    onCheckedChange={(checked) => handleNotificationChange('courseUpdates', checked)}
                    disabled={updateNotifications.isPending}
                    className="data-[state=checked]:bg-secondary data-[state=checked]:shadow-[0_0_10px_hsl(var(--secondary)/0.5)]"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-secondary/10 hover:border-secondary/30 transition-all duration-300">
                  <div className="space-y-0.5">
                    <Label htmlFor="discussion-replies" className="text-base">
                      Discussion Replies
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone replies to your discussions
                    </p>
                  </div>
                  <Switch
                    id="discussion-replies"
                    checked={profile?.discussion_replies ?? true}
                    onCheckedChange={(checked) => handleNotificationChange('discussionReplies', checked)}
                    disabled={updateNotifications.isPending}
                    className="data-[state=checked]:bg-secondary data-[state=checked]:shadow-[0_0_10px_hsl(var(--secondary)/0.5)]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account & Security */}
            <Card className="glass-card border-accent/30 hover:border-accent/50 hover:shadow-[0_0_30px_hsl(var(--accent)/0.15)] transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Shield className="h-5 w-5 text-accent drop-shadow-[0_0_8px_hsl(var(--accent)/0.5)]" />
                  Account & Security
                </CardTitle>
                <CardDescription>
                  Manage your account settings and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-foreground/80">Email Address</Label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-black/40 border border-accent/20">
                    <Mail className="h-4 w-4 text-accent" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground/80">Password</Label>
                  <Button
                    variant="outline"
                    onClick={handlePasswordReset}
                    disabled={isResettingPassword}
                    className="w-full sm:w-auto border-accent/30 hover:bg-accent/10 hover:border-accent/50 hover:shadow-[0_0_15px_hsl(var(--accent)/0.3)] transition-all duration-300"
                  >
                    {isResettingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    We'll send a password reset link to your email
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
