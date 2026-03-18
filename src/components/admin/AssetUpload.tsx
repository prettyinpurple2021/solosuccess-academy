/**
 * @file AssetUpload.tsx — Plug-and-Play Asset Upload Widget
 * 
 * Allows admins to upload a downloadable asset file for a course.
 * Files are stored in the `course-assets` storage bucket at path `{courseId}/{filename}`.
 * The filename is saved to the course's `plug_and_play_asset` column.
 * 
 * Shows current asset status and allows replacing the file.
 */
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateCourse } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileDown, Loader2, Trash2, FileCheck } from 'lucide-react';

interface AssetUploadProps {
  /** The course ID to upload an asset for */
  courseId: string;
  /** Current asset filename stored in the database (null if none) */
  currentAsset: string | null;
}

export function AssetUpload({ courseId, currentAsset }: AssetUploadProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateCourse = useUpdateCourse();
  const { toast } = useToast();

  /**
   * Handle file selection and upload.
   * Steps:
   * 1. Upload to storage bucket at `course-assets/{courseId}/{filename}`
   * 2. Update the course's `plug_and_play_asset` column with the filename
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Sanitize filename — replace spaces with hyphens, keep extension
      const sanitized = file.name.replace(/\s+/g, '-');
      const storagePath = `${courseId}/${sanitized}`;

      // If there's an existing asset, remove it from storage first
      if (currentAsset) {
        await supabase.storage
          .from('course-assets')
          .remove([`${courseId}/${currentAsset}`]);
      }

      // Upload the new file
      const { error: uploadError } = await supabase.storage
        .from('course-assets')
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Save the filename to the course record
      await updateCourse.mutateAsync({
        courseId,
        updates: { plug_and_play_asset: sanitized },
      });

      toast({ title: 'Asset uploaded!', description: `"${sanitized}" is now available for students.` });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset the file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /**
   * Remove the current asset from both storage and the database.
   */
  const handleRemoveAsset = async () => {
    if (!currentAsset) return;

    setRemoving(true);
    try {
      // Delete from storage
      const { error: removeError } = await supabase.storage
        .from('course-assets')
        .remove([`${courseId}/${currentAsset}`]);

      if (removeError) throw removeError;

      // Clear the database field
      await updateCourse.mutateAsync({
        courseId,
        updates: { plug_and_play_asset: null },
      });

      toast({ title: 'Asset removed' });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Failed to remove asset',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      {/* Trigger button — shown in the course card action bar */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={
          currentAsset
            ? 'border-success/50 text-success hover:border-success hover:bg-success/10'
            : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/10 hover:text-primary'
        }
        title={currentAsset ? `Asset: ${currentAsset}` : 'Upload plug-and-play asset'}
      >
        {currentAsset ? (
          <>
            <FileCheck className="h-4 w-4" />
            <span className="hidden xl:inline ml-2">Asset ✓</span>
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4" />
            <span className="hidden xl:inline ml-2">Asset</span>
          </>
        )}
      </Button>

      {/* Upload dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-display neon-text">Plug & Play Asset</DialogTitle>
            <DialogDescription>
              Upload a downloadable bonus resource for this course (e.g., templates, checklists, spreadsheets).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Current asset status */}
            {currentAsset ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/30">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck className="h-5 w-5 text-success shrink-0" />
                  <span className="text-sm font-mono text-success truncate">{currentAsset}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAsset}
                  disabled={removing}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  {removing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/20 text-center">
                <p className="text-sm text-muted-foreground">No asset uploaded yet.</p>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.pptx,.zip,.png,.jpg,.jpeg,.svg,.txt,.md"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
              Close
            </Button>
            <Button
              variant="neon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {currentAsset ? 'Replace Asset' : 'Upload Asset'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
