/**
 * TextbookKeyboardHelp - Modal showing available keyboard shortcuts
 * 
 * Displays a styled dialog with all keyboard navigation shortcuts
 * for the textbook viewer. Matches the cyberpunk design aesthetic.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextbookKeyboardHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

const shortcuts: ShortcutItem[] = [
  { keys: ['←'], description: 'Previous page' },
  { keys: ['→'], description: 'Next page' },
  { keys: ['Home'], description: 'First page' },
  { keys: ['End'], description: 'Last page' },
  { keys: ['B'], description: 'Bookmark current page' },
  { keys: ['?'], description: 'Toggle this help dialog' },
];

const mobileGestures: { gesture: string; description: string }[] = [
  { gesture: 'Swipe Left', description: 'Next page' },
  { gesture: 'Swipe Right', description: 'Previous page' },
  { gesture: 'Tap edges', description: 'Flip page corners' },
];

export function TextbookKeyboardHelp({ open, onOpenChange }: TextbookKeyboardHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-primary/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Keyboard className="h-5 w-5 text-primary" />
            <span className="neon-text">Keyboard Shortcuts</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Keyboard shortcuts */}
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <span className="text-sm text-foreground/90">{shortcut.description}</span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <kbd
                      key={keyIndex}
                      className={cn(
                        "px-2 py-1 text-xs font-mono rounded",
                        "bg-black/50 border border-primary/40",
                        "text-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]"
                      )}
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile gestures */}
          <div className="border-t border-primary/20 pt-4">
            <h4 className="text-sm font-medium text-secondary mb-3">Touch Gestures</h4>
            <div className="space-y-2">
              {mobileGestures.map((gesture, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <span className="text-sm text-foreground/90">{gesture.description}</span>
                  <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                    {gesture.gesture}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hint */}
          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-primary/20">
            Press <kbd className="px-1.5 py-0.5 text-xs font-mono rounded bg-black/50 border border-primary/40 text-primary">?</kbd> anytime to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
