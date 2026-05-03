/**
 * TestimonialForm — student-facing submission form.
 * Renders inline (e.g., on /profile or after course completion).
 */
import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSubmitTestimonial, useMyTestimonials } from '@/hooks/useTestimonials';
import { cn } from '@/lib/utils';

export function TestimonialForm({ defaultName, courseId }: { defaultName?: string; courseId?: string }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState<number | null>(null);
  const [quote, setQuote] = useState('');
  const [authorName, setAuthorName] = useState(defaultName ?? '');
  const [authorRole, setAuthorRole] = useState('');
  const submit = useSubmitTestimonial();
  const { data: mine } = useMyTestimonials();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quote.trim().length < 20) return;
    await submit.mutateAsync({
      rating,
      quote: quote.trim(),
      author_name: authorName.trim() || 'Anonymous',
      author_role: authorRole.trim() || null,
      course_id: courseId ?? null,
    });
    setQuote('');
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="font-display text-xl font-bold">Share your experience</h3>
        <p className="text-sm text-muted-foreground">
          Help other solo founders decide. Approved testimonials appear on our public site.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label>Rating</Label>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(null)}
                className="p-1 rounded hover:bg-muted/50"
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors',
                    (hover ?? rating) >= n
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground',
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="t-name">Display name</Label>
          <Input id="t-name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={80} required />
        </div>
        <div>
          <Label htmlFor="t-role">Role / title (optional)</Label>
          <Input id="t-role" placeholder="Indie hacker, Designer, Side hustler…" value={authorRole} onChange={(e) => setAuthorRole(e.target.value)} maxLength={80} />
        </div>
        <div>
          <Label htmlFor="t-quote">Your testimonial</Label>
          <Textarea
            id="t-quote"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={5}
            minLength={20}
            maxLength={1000}
            placeholder="What did the academy actually change for you?"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            {quote.length}/1000 — minimum 20 characters
          </p>
        </div>
        <Button type="submit" disabled={submit.isPending || quote.trim().length < 20}>
          {submit.isPending ? 'Submitting…' : 'Submit testimonial'}
        </Button>
      </form>

      {mine && mine.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-semibold mb-2">Your previous submissions</h4>
          <ul className="space-y-2">
            {mine.map((t) => (
              <li key={t.id} className="text-sm flex items-center justify-between gap-2">
                <span className="line-clamp-1 flex-1">{t.quote}</span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-mono',
                  t.status === 'approved' && 'bg-success/20 text-success',
                  t.status === 'pending' && 'bg-warning/20 text-warning',
                  t.status === 'rejected' && 'bg-destructive/20 text-destructive',
                )}>
                  {t.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}