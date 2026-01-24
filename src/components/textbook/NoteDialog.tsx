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
  { name: 'yellow', class: 'bg-yellow-300' },
  { name: 'green', class: 'bg-green-300' },
  { name: 'blue', class: 'bg-blue-300' },
  { name: 'pink', class: 'bg-pink-300' },
  { name: 'purple', class: 'bg-purple-300' },
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Selected text preview */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Selected text:</p>
            <p className="text-sm font-medium line-clamp-3">"{selectedText}"</p>
          </div>

          {/* Color selection */}
          <div className="space-y-2">
            <Label>Highlight color</Label>
            <div className="flex gap-2">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    c.class,
                    color === c.name && "ring-2 ring-foreground ring-offset-2 scale-110"
                  )}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Note input */}
          <div className="space-y-2">
            <Label htmlFor="note">Your note (optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add your thoughts, questions, or insights..."
              className="min-h-[100px]"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Highlight
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
