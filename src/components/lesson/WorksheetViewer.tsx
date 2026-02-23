/**
 * @file WorksheetViewer.tsx — Student-facing worksheet with response text areas
 *
 * Renders a structured worksheet (sections + prompts) and lets the student
 * type responses. Responses are serialised as JSON and saved via `onSave`.
 *
 * Caller is responsible for persisting the JSON string (e.g. to
 * user_progress.notes via useUpdateLessonNotes).
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Save, CheckCircle2 } from 'lucide-react';
import type { WorksheetData } from '@/lib/courseData';

interface WorksheetViewerProps {
  worksheetData: WorksheetData;
  /** Serialised JSON string previously saved in user_progress.notes */
  savedResponses?: string | null;
  /** Called with a JSON string of all responses when the student saves */
  onSave: (responsesJson: string) => void;
}

export function WorksheetViewer({
  worksheetData,
  savedResponses,
  onSave,
}: WorksheetViewerProps) {
  const worksheets = worksheetData.worksheets ?? [];

  // Rehydrate saved responses from JSON, or start empty
  const parseInitial = (): Record<string, string> => {
    if (!savedResponses) return {};
    try {
      return JSON.parse(savedResponses) as Record<string, string>;
    } catch {
      return {};
    }
  };

  const [responses, setResponses] = useState<Record<string, string>>(parseInitial);
  const [saved, setSaved] = useState(false);

  const updateResponse = (key: string, value: string) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    onSave(JSON.stringify(responses));
    setSaved(true);
  };

  return (
    <div className="space-y-8">
      {worksheets.map((ws) => (
        <div key={ws.id} className="space-y-6">
          {/* Worksheet instructions */}
          {ws.instructions && (
            <p className="text-muted-foreground leading-relaxed">{ws.instructions}</p>
          )}

          {/* Sections */}
          {ws.sections.map((section) => (
            <Card key={section.id} className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {section.prompts.map((prompt, pIdx) => {
                  // Key uses section.id + index. Prompts are admin-authored and
                  // rarely reordered, so index-based keys are stable in practice.
                  const key = `${section.id}-${pIdx}`;
                  return (
                    <div key={pIdx} className="space-y-2">
                      <Label className="text-sm text-muted-foreground leading-snug">
                        {pIdx + 1}. {prompt}
                      </Label>
                      <Textarea
                        value={responses[key] ?? ''}
                        onChange={(e) => updateResponse(key, e.target.value)}
                        placeholder="Write your response here…"
                        rows={3}
                        className="bg-background/50"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {/* Save controls */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Responses
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
