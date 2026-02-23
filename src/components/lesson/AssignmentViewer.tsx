/**
 * @file AssignmentViewer.tsx — Student-facing assignment submission area
 *
 * Shows a submission textarea beneath the assignment instructions.
 * The response is saved via `onSave`, which the caller persists to
 * user_progress.notes via useUpdateLessonNotes.
 */
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, CheckCircle2, PenLine } from 'lucide-react';

interface AssignmentViewerProps {
  /** Previously saved response text from user_progress.notes */
  savedResponse?: string | null;
  /** Called with the current text when the student saves */
  onSave: (response: string) => void;
}

export function AssignmentViewer({ savedResponse, onSave }: AssignmentViewerProps) {
  const [response, setResponse] = useState(savedResponse ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(response);
    setSaved(true);
  };

  return (
    <div className="space-y-4">
      {/* Submission prompt */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <PenLine className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Your Submission</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Complete the assignment described above and write your response below.
          You can save your work at any time and return to edit it later.
        </p>
      </div>

      {/* Response textarea */}
      <Textarea
        value={response}
        onChange={(e) => {
          setResponse(e.target.value);
          setSaved(false);
        }}
        placeholder="Write your assignment response here…"
        rows={8}
        className="bg-background/50"
      />

      {/* Save controls */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Response
        </Button>
        {saved && (
          <Badge variant="outline" className="gap-1 border-success/30 text-success">
            <CheckCircle2 className="h-3 w-3" />
            Saved
          </Badge>
        )}
      </div>
    </div>
  );
}
