/**
 * @file WorksheetViewer.tsx — Student-facing worksheet with response text areas
 *
 * Renders a structured worksheet (sections + prompts) with decorative gradient
 * borders, section frames, and polished save controls.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Save, CheckCircle2, FileQuestion, PenLine } from 'lucide-react';
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

  // Count total prompts and answered prompts for progress display
  const totalPrompts = worksheets.reduce(
    (sum, ws) => sum + ws.sections.reduce((s, sec) => s + sec.prompts.length, 0),
    0
  );
  const answeredPrompts = Object.values(responses).filter((v) => v.trim().length > 0).length;

  return (
    <div className="space-y-8">
      {/* Worksheet header — HUD-framed */}
      <div className="lesson-section-frame">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shadow-[0_0_12px_hsl(var(--accent)/0.15)]">
              <FileQuestion className="h-4 w-4 text-accent" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Worksheet</span>
          </div>
          <Badge variant="outline" className="font-mono text-xs border-primary/30 bg-primary/5">
            {answeredPrompts}/{totalPrompts} answered
          </Badge>
        </div>
      </div>

      {worksheets.map((ws) => (
        <div key={ws.id} className="space-y-6">
          {/* Worksheet instructions — callout style */}
          {ws.instructions && (
            <div className="bg-muted/30 border border-border/50 rounded-lg p-4 text-muted-foreground leading-relaxed text-sm">
              <span className="font-semibold text-foreground/80 mr-1">📋 Instructions:</span>
              {ws.instructions}
            </div>
          )}

          {/* Sections — with gradient top border */}
          {ws.sections.map((section, sIdx) => (
            <Card key={section.id} className="worksheet-section-card border-border/50 overflow-hidden">
              <CardHeader className="pb-3 pt-5">
                <div className="flex items-center gap-3">
                  <div className="activity-step-number">
                    {sIdx + 1}
                  </div>
                  <CardTitle className="text-base font-semibold">
                    {section.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {section.prompts.map((prompt, pIdx) => {
                  const key = `${section.id}-${pIdx}`;
                  const hasResponse = (responses[key] ?? '').trim().length > 0;
                  return (
                    <div key={pIdx} className="space-y-2">
                      <Label className="text-sm leading-snug flex items-start gap-2">
                        <span className="text-primary font-mono font-bold text-xs mt-0.5">
                          Q{pIdx + 1}
                        </span>
                        <span className="text-muted-foreground">{prompt}</span>
                      </Label>
                      <div className="relative">
                        <Textarea
                          value={responses[key] ?? ''}
                          onChange={(e) => updateResponse(key, e.target.value)}
                          placeholder="Write your response here…"
                          rows={3}
                          className="bg-background/50 border-border/50 focus:border-primary/40 transition-colors"
                        />
                        {hasResponse && (
                          <div className="absolute top-2 right-2">
                            <PenLine className="h-3.5 w-3.5 text-primary/40" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      {/* Save controls — styled button with status */}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" onClick={handleSave} className="gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5">
          <Save className="h-4 w-4" />
          Save Responses
        </Button>
        {saved && (
          <Badge variant="outline" className="gap-1 border-success/30 text-success bg-success/5 animate-fade-in">
            <CheckCircle2 className="h-3 w-3" />
            Saved
          </Badge>
        )}
      </div>
    </div>
  );
}
