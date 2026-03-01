/**
 * @file CourseEditor.tsx — Admin Course Create/Edit Form
 *
 * PURPOSE: Form for creating new courses or editing existing ones.
 * Fields: title, description, discussion question, project details, plug-and-play asset.
 * Uses useCreateCourse / useUpdateCourse mutations from useAdmin.ts.
 *
 * PRODUCTION TODO:
 * - Add course cover image upload
 * - Add rich text editor for description
 * - Add course prerequisite selection
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateCourse } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X } from 'lucide-react';

interface CourseEditorProps {
  onClose: () => void;
}

type CoursePhase = 'initialization' | 'orchestration' | 'launch';

export function CourseEditor({ onClose }: CourseEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState<CoursePhase>('initialization');
  const [price, setPrice] = useState('49.00');

  const createCourse = useCreateCourse();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    try {
      await createCourse.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        phase,
        price_cents: Math.round(parseFloat(price) * 100) || 4900,
      });
      toast({ title: 'Course created!' });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Failed to create course',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>New Course</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter course title"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter course description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase">Phase</Label>
            <Select value={phase} onValueChange={(v) => setPhase(v as CoursePhase)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initialization">Initialization</SelectItem>
                <SelectItem value="orchestration">Orchestration</SelectItem>
                <SelectItem value="launch">Launch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="49.00"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={createCourse.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={createCourse.isPending}>
            {createCourse.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Course
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
