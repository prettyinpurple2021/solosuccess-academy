import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UnsavedChangesIndicatorProps {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export function UnsavedChangesIndicator({
  hasChanges,
  isSaving,
  onSave,
}: UnsavedChangesIndicatorProps) {
  if (!hasChanges && !isSaving) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-background/95 backdrop-blur-md border shadow-lg",
        "animate-in slide-in-from-bottom-4 fade-in duration-300",
        hasChanges
          ? "border-warning/50 shadow-[0_0_20px_hsl(var(--warning)/0.2)]"
          : "border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
      )}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <span className="text-sm font-medium text-foreground">Saving changes...</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-5 w-5 text-warning" />
          <span className="text-sm font-medium text-foreground">You have unsaved changes</span>
          <Button
            variant="neon"
            size="sm"
            onClick={onSave}
            className="ml-2"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Now
          </Button>
        </>
      )}
    </div>
  );
}
