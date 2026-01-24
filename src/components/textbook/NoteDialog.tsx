import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const HIGHLIGHT_COLORS = [
  { name: 'yellow', class: 'bg-yellow-400', shadow: 'shadow-[0_0_10px_rgba(250,204,21,0.5)]' },
  { name: 'green', class: 'bg-green-400', shadow: 'shadow-[0_0_10px_rgba(74,222,128,0.5)]' },
  { name: 'blue', class: 'bg-blue-400', shadow: 'shadow-[0_0_10px_rgba(96,165,250,0.5)]' },
  { name: 'pink', class: 'bg-pink-400', shadow: 'shadow-[0_0_10px_rgba(244,114,182,0.5)]' },
  { name: 'purple', class: 'bg-purple-400', shadow: 'shadow-[0_0_10px_rgba(192,132,252,0.5)]' },
];

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
  onSave: (color: string, note: string) => void;
}

export function NoteDialog({ open, onOpenChange, selectedText, onSave }: NoteDialogProps) {
  const [color, setColor] = useState('yellow');
  const [note, setNote] = useState('');

  const handleSave = () => {
    onSave(color, note);
    setNote('');
    setColor('yellow');
    onOpenChange(false);
  };

  const handleClose = () => {
    setNote('');
    setColor('yellow');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-black/95 backdrop-blur-xl border-primary/30 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
        <DialogHeader>
          <DialogTitle className="font-display text-cyan-300">Add Note</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Selected text preview */}
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Selected text:</p>
            <p className="text-sm font-medium line-clamp-3 text-foreground">"{selectedText}"</p>
          </div>

          {/* Color selection */}
          <div className="space-y-2">
            <Label className="text-cyan-300">Highlight color</Label>
            <div className="flex gap-3">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all focus:outline-none",
                    c.class,
                    color === c.name && cn("ring-2 ring-white ring-offset-2 ring-offset-black scale-110", c.shadow)
                  )}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Note input */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-cyan-300">Your note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add your thoughts, questions, or insights..."
              className="min-h-[100px] bg-black/30 border-primary/30 focus:border-primary placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="border-primary/30 hover:bg-primary/20">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="neon">
            Save Highlight
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}