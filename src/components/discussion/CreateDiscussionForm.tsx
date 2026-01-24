import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCreateDiscussion } from '@/hooks/useDiscussions';
import { Loader2, X, MessageSquarePlus } from 'lucide-react';
import { z } from 'zod';

const discussionSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  content: z.string().trim().min(20, 'Content must be at least 20 characters').max(5000, 'Content must be less than 5000 characters'),
});

interface CreateDiscussionFormProps {
  courseId: string;
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateDiscussionForm({ courseId, userId, onSuccess, onCancel }: CreateDiscussionFormProps) {
  const { toast } = useToast();
  const createDiscussion = useCreateDiscussion();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = discussionSchema.safeParse({ title, content });
    if (!result.success) {
      const fieldErrors: { title?: string; content?: string } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'title') fieldErrors.title = err.message;
        if (err.path[0] === 'content') fieldErrors.content = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await createDiscussion.mutateAsync({
        courseId,
        userId,
        title: result.data.title,
        content: result.data.content,
      });

      toast({
        title: 'Discussion created!',
        description: 'Your question has been posted.',
      });

      setTitle('');
      setContent('');
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Failed to create discussion',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            Start a Discussion
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Discussion title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-xs text-destructive mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <Textarea
              placeholder="Share your question, insight, or experience...

Tips for a great discussion:
• Be specific about what you're asking or sharing
• Provide context about your situation
• Ask open-ended questions to encourage responses"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              rows={5}
              className={errors.content ? 'border-destructive' : ''}
            />
            <div className="flex justify-between mt-1">
              {errors.content ? (
                <p className="text-xs text-destructive">{errors.content}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-muted-foreground">
                {content.length}/5000
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={createDiscussion.isPending}>
              {createDiscussion.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Post Discussion
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
