/**
 * @file LearningObjectives.tsx — Chapter Learning Objectives Tracker
 *
 * PURPOSE: Displays 3-5 learning objectives at the start of each chapter.
 * Students can check off objectives as they feel confident, with a visual
 * mastery meter showing their progress.
 *
 * DATA FLOW:
 *   textbook_chapter_objectives → objectives list
 *   user_objective_progress → student's checkoffs
 *   Auto-generates objectives from chapter content when none exist in DB.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Target, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LearningObjectivesProps {
  /** Current chapter ID */
  chapterId: string;
  /** Chapter title for display */
  chapterTitle: string;
  /** Chapter content to auto-generate objectives from */
  chapterContent?: string;
}

/**
 * Auto-generates learning objectives from chapter content
 * by extracting key headings and bold terms.
 */
function generateObjectivesFromContent(content: string): string[] {
  const objectives: string[] = [];

  // Extract from ## headings — these represent key topics
  const headings = content.match(/^## .+$/gm) || [];
  for (const h of headings.slice(0, 3)) {
    const topic = h.replace('## ', '').trim();
    objectives.push(`Understand ${topic.toLowerCase()}`);
  }

  // Extract from **bold** key terms
  const boldTerms = content.match(/\*\*([^*]+)\*\*/g) || [];
  const uniqueTerms = [...new Set(boldTerms.map(t => t.replace(/\*\*/g, '').trim()))];
  for (const term of uniqueTerms.slice(0, 5 - objectives.length)) {
    if (term.length > 3 && term.length < 40) {
      objectives.push(`Define and apply the concept of "${term}"`);
    }
  }

  // Fallback objectives if not enough extracted
  while (objectives.length < 3) {
    const fallbacks = [
      'Identify the key concepts covered in this chapter',
      'Apply the strategies discussed to your own business',
      'Explain the main ideas in your own words',
    ];
    objectives.push(fallbacks[objectives.length] || 'Complete all exercises in this chapter');
  }

  return objectives.slice(0, 5);
}

export function LearningObjectives({ chapterId, chapterTitle, chapterContent }: LearningObjectivesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch objectives from DB
  const { data: dbObjectives = [] } = useQuery({
    queryKey: ['chapter-objectives', chapterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('textbook_chapter_objectives')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('order_number');
      if (error) throw error;
      return data || [];
    },
    enabled: !!chapterId,
  });

  // Generate objectives from content if none in DB
  const objectives = useMemo(() => {
    if (dbObjectives.length > 0) {
      return dbObjectives.map(o => ({ id: o.id, text: o.objective_text }));
    }
    // Auto-generate from content
    const generated = generateObjectivesFromContent(chapterContent || '');
    return generated.map((text, idx) => ({ id: `auto-${chapterId}-${idx}`, text }));
  }, [dbObjectives, chapterContent, chapterId]);

  // Fetch user's objective progress
  const { data: progressData = [] } = useQuery({
    queryKey: ['objective-progress', user?.id, chapterId],
    queryFn: async () => {
      if (!user?.id) return [];
      const objectiveIds = objectives.filter(o => !o.id.startsWith('auto-')).map(o => o.id);
      if (objectiveIds.length === 0) return [];

      const { data, error } = await supabase
        .from('user_objective_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('objective_id', objectiveIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && objectives.some(o => !o.id.startsWith('auto-')),
  });

  // Local state for auto-generated objectives (not persisted)
  const [localProgress, setLocalProgress] = useState<Set<string>>(new Set());

  // Combined completion status
  const completedObjectives = useMemo(() => {
    const completed = new Set<string>();
    // From DB
    progressData.filter(p => p.completed).forEach(p => completed.add(p.objective_id));
    // From local state (for auto-generated)
    localProgress.forEach(id => completed.add(id));
    return completed;
  }, [progressData, localProgress]);

  const completionPercent = objectives.length > 0
    ? Math.round((completedObjectives.size / objectives.length) * 100)
    : 0;

  // Toggle objective completion
  const toggleMutation = useMutation({
    mutationFn: async ({ objectiveId, completed }: { objectiveId: string; completed: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_objective_progress')
        .upsert({
          user_id: user.id,
          objective_id: objectiveId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        }, { onConflict: 'user_id,objective_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objective-progress', user?.id, chapterId] });
    },
  });

  const handleToggle = (objectiveId: string) => {
    const isCompleted = completedObjectives.has(objectiveId);

    if (objectiveId.startsWith('auto-')) {
      // For auto-generated objectives, use local state
      setLocalProgress(prev => {
        const next = new Set(prev);
        if (isCompleted) next.delete(objectiveId);
        else next.add(objectiveId);
        return next;
      });
    } else {
      // For DB objectives, persist
      toggleMutation.mutate({ objectiveId, completed: !isCompleted });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 bg-black/40 border border-primary/20 rounded-lg overflow-hidden"
    >
      {/* Header with mastery meter */}
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between p-3 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-secondary" />
          <span className="text-sm font-display font-semibold text-secondary">Learning Objectives</span>
          {completionPercent === 100 && (
            <Trophy className="h-4 w-4 text-accent" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 w-24">
            <Progress value={completionPercent} className="h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{completionPercent}%</span>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Objectives list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {objectives.map((obj, idx) => {
                const isCompleted = completedObjectives.has(obj.id);
                return (
                  <motion.label
                    key={obj.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-md cursor-pointer transition-all hover:bg-primary/10",
                      isCompleted && "opacity-70"
                    )}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => handleToggle(obj.id)}
                      className="mt-0.5 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className={cn(
                      "text-sm text-foreground/80 leading-snug",
                      isCompleted && "line-through text-muted-foreground"
                    )}>
                      {obj.text}
                    </span>
                  </motion.label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
