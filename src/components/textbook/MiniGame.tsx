/**
 * MiniGame.tsx
 * 
 * Interactive mini games that can be embedded in textbook pages.
 * Currently supports:
 * - Word Scramble: unscramble a key term
 * - Fill in the Blank: complete a sentence with the right word
 * 
 * These games reinforce vocabulary and key concepts from the textbook.
 */
import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Shuffle, Lightbulb, Trophy, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * WordScramble game data — the admin provides a word and hint.
 */
export interface WordScrambleGame {
  type: 'word_scramble';
  word: string;
  hint: string;
}

/**
 * FillInTheBlank game data — a sentence with a blank and the correct answer.
 */
export interface FillBlankGame {
  type: 'fill_blank';
  sentence: string;       // Use ___ for the blank
  answer: string;
  hint?: string;
}

export type MiniGameData = WordScrambleGame | FillBlankGame;

interface MiniGameProps {
  game: MiniGameData;
  /** Called when the student completes the game correctly */
  onComplete?: () => void;
}

/**
 * Scramble a word's letters randomly.
 */
function scrambleWord(word: string): string {
  const letters = word.split('');
  // Keep scrambling until it's different from the original
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  const result = letters.join('');
  // If the scramble is the same as the original, swap first two
  if (result === word && word.length > 1) {
    [letters[0], letters[1]] = [letters[1], letters[0]];
    return letters.join('');
  }
  return result;
}

/**
 * MiniGame component — renders the appropriate game based on the type field.
 */
export function MiniGame({ game, onComplete }: MiniGameProps) {
  if (game.type === 'word_scramble') {
    return <WordScrambleWidget game={game} onComplete={onComplete} />;
  }
  if (game.type === 'fill_blank') {
    return <FillBlankWidget game={game} onComplete={onComplete} />;
  }
  return null;
}

/**
 * WordScrambleWidget
 * ---
 * Shows scrambled letters of a key term.
 * Student types the unscrambled word.
 * Includes a hint button and re-scramble button.
 */
function WordScrambleWidget({ game, onComplete }: { game: WordScrambleGame; onComplete?: () => void }) {
  const [guess, setGuess] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);

  // Scramble letters once and allow re-scramble
  const [scrambled, setScrambled] = useState(() => scrambleWord(game.word.toUpperCase()));

  const handleCheck = useCallback(() => {
    if (guess.trim().toLowerCase() === game.word.toLowerCase()) {
      setResult('correct');
      onComplete?.();
    } else {
      setResult('wrong');
    }
  }, [guess, game.word, onComplete]);

  const handleReshuffle = () => {
    setScrambled(scrambleWord(game.word.toUpperCase()));
    setResult(null);
    setGuess('');
  };

  return (
    <div className="p-4 bg-black/40 rounded-lg border border-secondary/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Shuffle className="h-4 w-4 text-secondary" />
        <h4 className="font-display font-semibold text-secondary">Word Scramble</h4>
      </div>

      {/* Scrambled letters displayed as tiles */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {scrambled.split('').map((letter, idx) => (
          <motion.span
            key={`${letter}-${idx}`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: idx * 0.05, type: 'spring' }}
            className="h-10 w-10 flex items-center justify-center bg-secondary/20 border border-secondary/40 rounded-lg text-lg font-bold font-mono text-foreground"
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Hint */}
      <AnimatePresence>
        {showHint && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-muted-foreground mb-3 px-2 py-1 bg-secondary/10 rounded border border-secondary/20"
          >
            💡 Hint: {game.hint}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Input + buttons */}
      {result !== 'correct' ? (
        <div className="flex gap-2">
          <Input
            value={guess}
            onChange={(e) => { setGuess(e.target.value); setResult(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            placeholder="Type the word..."
            className="bg-black/30 border-secondary/30 focus:border-secondary"
          />
          <Button onClick={handleCheck} size="sm" variant="neon" disabled={!guess.trim()}>
            Check
          </Button>
          <Button onClick={() => setShowHint(true)} size="icon" variant="ghost" className="hover:bg-secondary/20" title="Show hint">
            <Lightbulb className="h-4 w-4" />
          </Button>
          <Button onClick={handleReshuffle} size="icon" variant="ghost" className="hover:bg-secondary/20" title="Re-shuffle">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 text-green-400"
        >
          <Trophy className="h-5 w-5" />
          <span className="font-semibold">Correct! 🎉</span>
        </motion.div>
      )}

      {/* Wrong answer feedback */}
      {result === 'wrong' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-400 mt-2 flex items-center gap-1"
        >
          <XCircle className="h-4 w-4" /> Not quite — try again!
        </motion.p>
      )}
    </div>
  );
}

/**
 * FillBlankWidget
 * ---
 * Shows a sentence with a blank (___).
 * Student fills in the missing word.
 */
function FillBlankWidget({ game, onComplete }: { game: FillBlankGame; onComplete?: () => void }) {
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Split sentence around the blank
  const parts = game.sentence.split('___');

  const handleCheck = useCallback(() => {
    if (guess.trim().toLowerCase() === game.answer.toLowerCase()) {
      setResult('correct');
      onComplete?.();
    } else {
      setResult('wrong');
    }
  }, [guess, game.answer, onComplete]);

  return (
    <div className="p-4 bg-black/40 rounded-lg border border-accent/30 shadow-[0_0_20px_rgba(236,72,153,0.1)]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-accent" />
        <h4 className="font-display font-semibold text-accent">Fill in the Blank</h4>
      </div>

      {/* Sentence with inline input */}
      <p className="text-foreground/90 mb-4 leading-relaxed">
        {parts[0]}
        {result === 'correct' ? (
          <span className="font-bold text-green-400 border-b-2 border-green-400 px-1">
            {game.answer}
          </span>
        ) : (
          <Input
            value={guess}
            onChange={(e) => { setGuess(e.target.value); setResult(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            className="inline-block w-32 mx-1 bg-black/30 border-accent/30 focus:border-accent text-center"
            placeholder="?"
          />
        )}
        {parts[1]}
      </p>

      {/* Hint */}
      <AnimatePresence>
        {showHint && game.hint && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-muted-foreground mb-3 px-2 py-1 bg-accent/10 rounded border border-accent/20"
          >
            💡 Hint: {game.hint}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Buttons */}
      {result !== 'correct' ? (
        <div className="flex gap-2">
          <Button onClick={handleCheck} size="sm" variant="neon" disabled={!guess.trim()}>
            Check Answer
          </Button>
          {game.hint && (
            <Button onClick={() => setShowHint(true)} size="icon" variant="ghost" className="hover:bg-accent/20" title="Show hint">
              <Lightbulb className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 text-green-400"
        >
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold">Perfect! 🎉</span>
        </motion.div>
      )}

      {result === 'wrong' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-400 mt-2 flex items-center gap-1"
        >
          <XCircle className="h-4 w-4" /> Not quite — try again!
        </motion.p>
      )}
    </div>
  );
}
