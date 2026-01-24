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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access settings.</p>
            <Button asChild>
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          <div className="space-y-6">
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize how the app looks on your device
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>Theme</Label>
                  <RadioGroup
                    value={theme}
                    onValueChange={setTheme}
                    className="grid grid-cols-3 gap-4"
                  >
                    <Label
                      htmlFor="light"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                    >
                      <RadioGroupItem value="light" id="light" className="sr-only" />
                      <Sun className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Light</span>
                    </Label>
                    <Label
                      htmlFor="dark"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                    >
                      <RadioGroupItem value="dark" id="dark" className="sr-only" />
                      <Moon className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">Dark</span>
                    </Label>
                    <Label
                      htmlFor="system"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
                    >
                      <RadioGroupItem value="system" id="system" className="sr-only" />
                      <Monitor className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">System</span>
                    </Label>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Manage your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
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
                  />
                </div>

                <div className="flex items-center justify-between">
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
                  />
                </div>

                <div className="flex items-center justify-between">
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
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account & Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account & Security
                </CardTitle>
                <CardDescription>
                  Manage your account settings and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <Button
                    variant="outline"
                    onClick={handlePasswordReset}
                    disabled={isResettingPassword}
                    className="w-full sm:w-auto"
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
