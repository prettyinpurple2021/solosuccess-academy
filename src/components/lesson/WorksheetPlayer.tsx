/**
 * @file WorksheetPlayer.tsx — Student-Facing Worksheet Player
 * 
 * Renders guided worksheet exercises with:
 * - Section-by-section progression
 * - Text input fields for each prompt/question
 * - Self-assessment checkboxes per section
 * - Progress tracking across all sections
 * - Local state persistence (answers survive tab switching)
 * 
 * Data format expected: WorksheetData { worksheets: SingleWorksheet[] }
 * Each SingleWorksheet has { title, instructions, sections[] }
 * Each section has { title, prompts[] }
 */
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { migrateWorksheetData } from '@/hooks/useAdmin';
import { useLoadWorksheetAnswers, useAutoSaveWorksheetAnswers } from '@/hooks/useWorksheetAnswers';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ListChecks,
  Sparkles,
} from 'lucide-react';

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

/** Normalised section after migration */
interface NormalisedSection {
  id: string;
  title: string;
  prompts: string[];
}

/** Normalised single worksheet */
interface NormalisedWorksheet {
  id: string;
  title: string;
  instructions: string;
  sections: NormalisedSection[];
}

interface WorksheetPlayerProps {
  /** Raw worksheet_data JSONB from the lesson record */
  worksheetData: any;
  /** Current user ID — enables persistence when provided */
  userId?: string;
  /** Current lesson ID — enables persistence when provided */
  lessonId?: string;
}

// ──────────────────────────────────────────────
// NORMALISE — handle all data shapes via migrateWorksheetData
// ──────────────────────────────────────────────

function normaliseWorksheets(raw: any): NormalisedWorksheet[] {
  // Use the existing migration helper to normalise legacy formats
  const migrated = migrateWorksheetData(raw);
  if (!migrated || !migrated.worksheets?.length) {
    // AI-generated flat format: { title, instructions, sections }
    if (raw?.title && Array.isArray(raw?.sections)) {
      return [{
        id: 'ws-0',
        title: raw.title,
        instructions: raw.instructions || raw.description || '',
        sections: raw.sections.map((s: any, i: number) => ({
          id: s.id || `section-${i}`,
          title: s.title || `Section ${i + 1}`,
          prompts: Array.isArray(s.prompts)
            ? s.prompts
            : Array.isArray(s.exercises)
              ? s.exercises.map((ex: any) => (typeof ex === 'string' ? ex : ex.prompt || ex.question || ''))
              : [''],
        })),
      }];
    }
    return [];
  }

  return migrated.worksheets.map((ws, i) => ({
    id: ws.id || `ws-${i}`,
    title: ws.title || `Worksheet ${i + 1}`,
    instructions: ws.instructions || '',
    sections: (ws.sections || []).map((s, j) => ({
      id: s.id || `section-${j}`,
      title: s.title || `Section ${j + 1}`,
      prompts: s.prompts?.length ? s.prompts : [''],
    })),
  }));
}

// ──────────────────────────────────────────────
// COMPONENT
// ──────────────────────────────────────────────

export function WorksheetPlayer({ worksheetData, userId, lessonId }: WorksheetPlayerProps) {
  const worksheets = normaliseWorksheets(worksheetData);

  // ── Persistence: load saved answers from DB ──
  const { data: savedData } = useLoadWorksheetAnswers(userId, lessonId);
  const { save: autoSave } = useAutoSaveWorksheetAnswers(userId, lessonId);

  // Track which worksheet is active (for multi-worksheet support)
  const [activeWsIndex, setActiveWsIndex] = useState(0);

  // Track current section index within the active worksheet
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  // Answers: keyed by `${wsIndex}-${sectionIndex}-${promptIndex}`
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Self-assessment: keyed by `${wsIndex}-${sectionIndex}`
  const [selfChecked, setSelfChecked] = useState<Record<string, boolean>>({});

  // Track whether we've hydrated from DB to avoid overwriting saved data
  const [hydrated, setHydrated] = useState(false);

  // Hydrate state from DB once loaded
  useEffect(() => {
    if (savedData && !hydrated) {
      setAnswers(savedData.answers);
      setSelfChecked(savedData.selfChecked);
      setHydrated(true);
    }
  }, [savedData, hydrated]);

  // Handlers defined before any early returns to satisfy Rules of Hooks
  const answerKey = useCallback((sIdx: number, pIdx: number) => `${activeWsIndex}-${sIdx}-${pIdx}`, [activeWsIndex]);

  const handleAnswerChange = useCallback((sIdx: number, pIdx: number, value: string) => {
    setAnswers(prev => {
      const next = { ...prev, [`${activeWsIndex}-${sIdx}-${pIdx}`]: value };
      // Trigger debounced auto-save
      autoSave(next, selfChecked);
      return next;
    });
  }, [activeWsIndex, autoSave, selfChecked]);

  const handleSelfCheck = useCallback((sIdx: number, checked: boolean) => {
    setSelfChecked(prev => {
      const next = { ...prev, [`${activeWsIndex}-${sIdx}`]: checked };
      // Trigger debounced auto-save
      autoSave(answers, next);
      return next;
    });
  }, [activeWsIndex, autoSave, answers]);

  const currentWs = worksheets[activeWsIndex];

  if (!currentWs || currentWs.sections.length === 0) {
    return (
      <div className="bg-black/30 border border-accent/20 border-dashed rounded-lg p-8 text-center">
        <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_hsl(var(--accent)/0.3)]">
          <BookOpen className="h-8 w-8 text-accent" />
        </div>
        <p className="text-muted-foreground">No worksheet exercises available yet.</p>
      </div>
    );
  }

  const totalSections = currentWs.sections.length;
  const currentSection = currentWs.sections[activeSectionIndex];

  // Calculate how many sections have been self-assessed
  const checkedCount = currentWs.sections.filter(
    (_, i) => selfChecked[`${activeWsIndex}-${i}`]
  ).length;
  const progressPercent = Math.round((checkedCount / totalSections) * 100);
  const allComplete = checkedCount === totalSections;

  const goNext = () => {
    if (activeSectionIndex < totalSections - 1) setActiveSectionIndex(i => i + 1);
  };

  const goPrev = () => {
    if (activeSectionIndex > 0) setActiveSectionIndex(i => i - 1);
  };

  return (
    <div className="space-y-5">
      {/* Worksheet Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center shadow-[0_0_15px_hsl(var(--accent)/0.3)]">
            <BookOpen className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">{currentWs.title}</h3>
            {worksheets.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Worksheet {activeWsIndex + 1} of {worksheets.length}
              </p>
            )}
          </div>
        </div>
        <Badge variant="outline" className="border-accent/40 text-accent">
          <ListChecks className="h-3.5 w-3.5 mr-1" />
          {checkedCount}/{totalSections} reviewed
        </Badge>
      </div>

      {/* Instructions */}
      {currentWs.instructions && (
        <p className="text-sm text-muted-foreground leading-relaxed bg-accent/5 border border-accent/20 rounded-lg p-3">
          {currentWs.instructions}
        </p>
      )}

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Section {activeSectionIndex + 1} of {totalSections}</span>
          <span>{progressPercent}% self-assessed</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Current Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeWsIndex}-${activeSectionIndex}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 space-y-4"
        >
          {/* Section title */}
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-7 w-7 rounded-full bg-accent/20 text-accent text-sm font-bold">
              {activeSectionIndex + 1}
            </span>
            <h4 className="font-display font-semibold text-base">
              {currentSection.title || `Section ${activeSectionIndex + 1}`}
            </h4>
          </div>

          {/* Prompts / Questions */}
          <div className="space-y-4">
            {currentSection.prompts.map((prompt, pIdx) => (
              <div key={pIdx} className="space-y-2">
                <label className="text-sm font-medium text-foreground/90 flex items-start gap-2">
                  <span className="text-accent font-mono text-xs mt-0.5">{pIdx + 1}.</span>
                  <span>{prompt}</span>
                </label>
                <Textarea
                  value={answers[answerKey(activeSectionIndex, pIdx)] || ''}
                  onChange={(e) => handleAnswerChange(activeSectionIndex, pIdx, e.target.value)}
                  placeholder="Type your answer here..."
                  rows={3}
                  className="bg-background/60 border-border/50 focus:border-accent/50 focus:shadow-[0_0_15px_hsl(var(--accent)/0.2)] transition-all"
                />
              </div>
            ))}
          </div>

          {/* Self-Assessment Checkbox */}
          <div className="flex items-center gap-3 pt-2 border-t border-border/30">
            <Checkbox
              id={`self-check-${activeWsIndex}-${activeSectionIndex}`}
              checked={selfChecked[`${activeWsIndex}-${activeSectionIndex}`] || false}
              onCheckedChange={(checked) => handleSelfCheck(activeSectionIndex, !!checked)}
              className="border-accent/50 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
            />
            <label
              htmlFor={`self-check-${activeWsIndex}-${activeSectionIndex}`}
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              I've reviewed my answers for this section
            </label>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={goPrev}
          disabled={activeSectionIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {/* Section dots */}
        <div className="flex gap-1.5">
          {currentWs.sections.map((_, i) => {
            const isChecked = selfChecked[`${activeWsIndex}-${i}`];
            const isCurrent = i === activeSectionIndex;
            return (
              <button
                key={i}
                onClick={() => setActiveSectionIndex(i)}
                className={`h-2.5 w-2.5 rounded-full transition-all ${
                  isCurrent
                    ? 'bg-accent scale-125 shadow-[0_0_8px_hsl(var(--accent)/0.5)]'
                    : isChecked
                      ? 'bg-accent/60'
                      : 'bg-muted-foreground/30'
                }`}
                aria-label={`Go to section ${i + 1}`}
              />
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goNext}
          disabled={activeSectionIndex === totalSections - 1}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Multi-worksheet navigation */}
      {worksheets.length > 1 && (
        <div className="flex gap-2 pt-2 border-t border-border/30">
          {worksheets.map((ws, i) => (
            <Button
              key={ws.id}
              variant={i === activeWsIndex ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setActiveWsIndex(i); setActiveSectionIndex(0); }}
              className="text-xs"
            >
              {ws.title}
            </Button>
          ))}
        </div>
      )}

      {/* Completion celebration */}
      <AnimatePresence>
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-accent/10 border border-accent/30 rounded-xl p-6 text-center"
          >
            <div className="flex justify-center mb-3">
              <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center shadow-[0_0_25px_hsl(var(--accent)/0.4)]">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
            </div>
            <h4 className="font-display font-bold text-lg">Worksheet Complete!</h4>
            <p className="text-sm text-muted-foreground mt-1">
              You've self-assessed all {totalSections} sections. Well done!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
