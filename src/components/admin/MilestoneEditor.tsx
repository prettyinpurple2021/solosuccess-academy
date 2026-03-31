/**
 * @file MilestoneEditor.tsx — Admin Milestone & Rubric Manager
 *
 * Allows admins to view, add, edit, and delete project milestones
 * and rubric categories for a specific course. Uses inline editing
 * with save/cancel actions for a smooth workflow.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Target,
  Plus,
  Trash2,
  Save,
  GripVertical,
  ClipboardList,
  Pencil,
  X,
} from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

/* ─── Types ─── */
interface Milestone {
  id: string;
  course_id: string;
  title: string;
  description: string;
  deliverable_prompt: string;
  order_number: number;
}

interface RubricCategory {
  id: string;
  course_id: string;
  name: string;
  description: string;
  max_points: number;
  order_number: number;
}

/* ─── Props ─── */
interface MilestoneEditorProps {
  courseId: string;
  courseTitle?: string;
}

export function MilestoneEditor({ courseId, courseTitle }: MilestoneEditorProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  /* ─── Data Fetching ─── */
  const { data: milestones = [], isLoading: milestonesLoading } = useQuery({
    queryKey: ['admin-milestones', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number', { ascending: true });
      if (error) throw error;
      return data as Milestone[];
    },
  });

  const { data: rubricCategories = [], isLoading: rubricLoading } = useQuery({
    queryKey: ['admin-rubric-categories', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_rubric_categories')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number', { ascending: true });
      if (error) throw error;
      return data as RubricCategory[];
    },
  });

  /* ─── Milestone Mutations ─── */
  const addMilestone = useMutation({
    mutationFn: async () => {
      const nextOrder = (milestones.length || 0) + 1;
      const { error } = await supabase.from('project_milestones').insert({
        course_id: courseId,
        title: `Milestone ${nextOrder}`,
        description: '',
        deliverable_prompt: '',
        order_number: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-milestones', courseId] });
      toast({ title: 'Milestone added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMilestone = useMutation({
    mutationFn: async (milestone: Partial<Milestone> & { id: string }) => {
      const { id, ...updates } = milestone;
      const { error } = await supabase.from('project_milestones').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-milestones', courseId] });
      toast({ title: 'Milestone saved' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('project_milestones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-milestones', courseId] });
      toast({ title: 'Milestone deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  /* ─── Rubric Mutations ─── */
  const addRubricCategory = useMutation({
    mutationFn: async () => {
      const nextOrder = (rubricCategories.length || 0) + 1;
      const { error } = await supabase.from('project_rubric_categories').insert({
        course_id: courseId,
        name: `Category ${nextOrder}`,
        description: '',
        max_points: 10,
        order_number: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rubric-categories', courseId] });
      toast({ title: 'Rubric category added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateRubricCategory = useMutation({
    mutationFn: async (cat: Partial<RubricCategory> & { id: string }) => {
      const { id, ...updates } = cat;
      const { error } = await supabase.from('project_rubric_categories').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rubric-categories', courseId] });
      toast({ title: 'Rubric category saved' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteRubricCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('project_rubric_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rubric-categories', courseId] });
      toast({ title: 'Rubric category deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  if (milestonesLoading || rubricLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <NeonSpinner size="lg" />
      </div>
    );
  }

  const totalRubricPoints = rubricCategories.reduce((sum, c) => sum + c.max_points, 0);

  return (
    <div className="space-y-8">
      {/* ─── MILESTONES SECTION ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Target className="h-5 w-5 text-primary" />
            Project Milestones
            <Badge variant="outline" className="ml-2 border-primary/50 text-primary">
              {milestones.length}
            </Badge>
          </h3>
          <Button
            variant="neon"
            size="sm"
            onClick={() => addMilestone.mutate()}
            disabled={addMilestone.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Milestone
          </Button>
        </div>

        {milestones.length === 0 ? (
          <div className="glass-card border-primary/20 p-8 text-center">
            <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No milestones yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((m) => (
              <MilestoneEditRow
                key={m.id}
                milestone={m}
                onSave={(updates) => updateMilestone.mutate({ id: m.id, ...updates })}
                onDelete={() => deleteMilestone.mutate(m.id)}
                isSaving={updateMilestone.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── RUBRIC CATEGORIES SECTION ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <ClipboardList className="h-5 w-5 text-accent" />
            Rubric Categories
            <Badge variant="outline" className="ml-2 border-accent/50 text-accent">
              {totalRubricPoints} pts total
            </Badge>
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addRubricCategory.mutate()}
            disabled={addRubricCategory.isPending}
            className="border-accent/50 hover:border-accent hover:bg-accent/10 hover:text-accent"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Category
          </Button>
        </div>

        {rubricCategories.length === 0 ? (
          <div className="glass-card border-accent/20 p-8 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No rubric categories yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rubricCategories.map((cat) => (
              <RubricCategoryRow
                key={cat.id}
                category={cat}
                onSave={(updates) => updateRubricCategory.mutate({ id: cat.id, ...updates })}
                onDelete={() => deleteRubricCategory.mutate(cat.id)}
                isSaving={updateRubricCategory.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Milestone Edit Row — inline editing for one milestone
   ═══════════════════════════════════════════════════ */
function MilestoneEditRow({
  milestone,
  onSave,
  onDelete,
  isSaving,
}: {
  milestone: Milestone;
  onSave: (updates: Partial<Milestone>) => void;
  onDelete: () => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(milestone.title);
  const [description, setDescription] = useState(milestone.description);
  const [prompt, setPrompt] = useState(milestone.deliverable_prompt);

  const handleSave = () => {
    onSave({ title, description, deliverable_prompt: prompt });
    setEditing(false);
  };

  const handleCancel = () => {
    setTitle(milestone.title);
    setDescription(milestone.description);
    setPrompt(milestone.deliverable_prompt);
    setEditing(false);
  };

  return (
    <Card className="border-primary/20 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        {editing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
                #{milestone.order_number}
              </Badge>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Milestone title"
                className="border-primary/30 focus:border-primary"
              />
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of what the student will do..."
              rows={2}
              className="border-primary/20"
            />
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Detailed deliverable prompt (what to submit)..."
              rows={4}
              className="border-primary/20"
            />
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button variant="neon" size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <Badge className="bg-primary/20 text-primary border-primary/30">
                #{milestone.order_number}
              </Badge>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground">{milestone.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {milestone.description || 'No description'}
              </p>
              {milestone.deliverable_prompt && (
                <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-1 italic">
                  Prompt: {milestone.deliverable_prompt}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setEditing(true)} className="h-8 w-8 hover:text-primary">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════
   Rubric Category Row — inline editing for one rubric category
   ═══════════════════════════════════════════════════ */
function RubricCategoryRow({
  category,
  onSave,
  onDelete,
  isSaving,
}: {
  category: RubricCategory;
  onSave: (updates: Partial<RubricCategory>) => void;
  onDelete: () => void;
  isSaving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);
  const [maxPoints, setMaxPoints] = useState(category.max_points);

  const handleSave = () => {
    onSave({ name, description, max_points: maxPoints });
    setEditing(false);
  };

  const handleCancel = () => {
    setName(category.name);
    setDescription(category.description);
    setMaxPoints(category.max_points);
    setEditing(false);
  };

  return (
    <Card className="border-accent/20 hover:border-accent/30 transition-all">
      <CardContent className="p-4">
        {editing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category name"
                className="border-accent/30 focus:border-accent"
              />
              <Input
                type="number"
                value={maxPoints}
                onChange={(e) => setMaxPoints(Number(e.target.value))}
                className="w-24 border-accent/30 focus:border-accent"
                min={1}
                max={100}
              />
              <span className="text-sm text-muted-foreground shrink-0">pts</span>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this category evaluates..."
              rows={2}
              className="border-accent/20"
            />
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-accent/20 text-accent border-accent/30 hover:bg-accent/30">
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-accent/50 text-accent shrink-0">
              {category.max_points} pts
            </Badge>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground">{category.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-1">{category.description || 'No description'}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setEditing(true)} className="h-8 w-8 hover:text-accent">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
