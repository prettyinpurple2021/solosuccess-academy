/**
 * @file AccessibilityCard.tsx — Settings → Accessibility preferences
 *
 * Currently exposes the **motion preference**:
 *   - System (follow OS prefers-reduced-motion)  ← default
 *   - Reduce (force motion off — disables nebula, stars, scan-lines)
 *   - Full   (force motion on — overrides OS even if it prefers reduced)
 *
 * The actual application of the preference is handled by `useReducedMotion()`
 * which sets `data-reduce-motion="true|false"` on <html>. CSS rules in
 * index.css disable decorative animations when that attribute is true.
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accessibility, Sparkles, Pause, Settings as SettingsIcon } from 'lucide-react';
import { useMotionPreference } from '@/hooks/useReducedMotion';
import { toast } from 'sonner';

export function AccessibilityCard() {
  const { preference, setPreference } = useMotionPreference();

  const handleChange = (value: string) => {
    if (value !== 'system' && value !== 'reduce' && value !== 'full') return;
    setPreference(value);
    toast.success('Motion preference saved', {
      description:
        value === 'reduce'
          ? 'Decorative animations are now disabled.'
          : value === 'full'
            ? 'All decorative animations are enabled.'
            : 'Following your operating system setting.',
    });
  };

  return (
    <Card className="glass-card border-info/30 hover:border-info/50 hover:shadow-[0_0_30px_hsl(var(--info)/0.15)] transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Accessibility className="h-5 w-5 text-info drop-shadow-[0_0_8px_hsl(var(--info)/0.5)]" />
          Accessibility
        </CardTitle>
        <CardDescription>
          Control motion, visual effects, and how the app responds to your accessibility settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-foreground/80 mb-1 block">Motion & visual effects</Label>
            <p className="text-xs text-muted-foreground mb-4">
              The cyberpunk theme uses ambient nebula clouds, twinkling stars, and subtle scan
              lines. If you find this distracting or have motion sensitivity, you can disable it.
            </p>
          </div>

          <RadioGroup value={preference} onValueChange={handleChange} className="grid gap-3">
            <Label
              htmlFor="motion-system"
              className="flex items-start gap-3 rounded-md border-2 border-info/20 bg-black/40 backdrop-blur-sm p-4 hover:bg-info/10 hover:border-info/40 cursor-pointer transition-all duration-300 [&:has([data-state=checked])]:border-info [&:has([data-state=checked])]:shadow-[0_0_20px_hsl(var(--info)/0.3)]"
            >
              <RadioGroupItem value="system" id="motion-system" className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium">
                  <SettingsIcon className="h-4 w-4 text-info" />
                  Follow system preference
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended. Uses your operating system's "reduce motion" setting.
                </p>
              </div>
            </Label>

            <Label
              htmlFor="motion-reduce"
              className="flex items-start gap-3 rounded-md border-2 border-info/20 bg-black/40 backdrop-blur-sm p-4 hover:bg-info/10 hover:border-info/40 cursor-pointer transition-all duration-300 [&:has([data-state=checked])]:border-info [&:has([data-state=checked])]:shadow-[0_0_20px_hsl(var(--info)/0.3)]"
            >
              <RadioGroupItem value="reduce" id="motion-reduce" className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium">
                  <Pause className="h-4 w-4 text-warning" />
                  Reduce motion
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hide nebula, starfield, and scan-line animations. Shorten transitions.
                </p>
              </div>
            </Label>

            <Label
              htmlFor="motion-full"
              className="flex items-start gap-3 rounded-md border-2 border-info/20 bg-black/40 backdrop-blur-sm p-4 hover:bg-info/10 hover:border-info/40 cursor-pointer transition-all duration-300 [&:has([data-state=checked])]:border-info [&:has([data-state=checked])]:shadow-[0_0_20px_hsl(var(--info)/0.3)]"
            >
              <RadioGroupItem value="full" id="motion-full" className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Full motion
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Show all ambient effects, even if your system prefers reduced motion.
                </p>
              </div>
            </Label>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
