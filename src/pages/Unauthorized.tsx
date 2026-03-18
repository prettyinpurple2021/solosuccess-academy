/**
 * @file Unauthorized.tsx — Access Denied Page
 *
 * PURPOSE: Shown when a non-admin user attempts to access an admin route.
 * Provides a clear message and navigation back to the student dashboard.
 * Previously, non-admin users were silently redirected to /dashboard.
 */
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full glass-card border-destructive/30">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access admin features.
              This area is restricted to authorized administrators only.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            <p className="text-xs text-muted-foreground">
              If you believe this is an error, please contact the site administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
