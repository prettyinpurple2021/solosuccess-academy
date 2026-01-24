import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { useUpdateProfile, Profile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [hasChanges, setHasChanges] = useState(false);
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  useEffect(() => {
    const nameChanged = displayName !== (profile.display_name || '');
    const bioChanged = bio !== (profile.bio || '');
    setHasChanges(nameChanged || bioChanged);
  }, [displayName, bio, profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        userId: profile.id,
        displayName,
        bio,
      });
      toast({ title: 'Profile updated!' });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your public profile details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">
            This is how other students will see you
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself, your business, or what you're learning..."
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            {bio.length}/500 characters
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateProfile.isPending}
          className="w-full sm:w-auto"
        >
          {updateProfile.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
