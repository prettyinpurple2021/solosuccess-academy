/**
 * @file TextToSpeech.tsx — Read-Along Text-to-Speech Control
 *
 * PURPOSE: Uses the Web Speech API to narrate textbook page content.
 * Highlights text as it's being read aloud for a read-along experience.
 *
 * FEATURES:
 * - Play/Pause/Stop controls
 * - Speed adjustment (0.5x to 2x)
 * - Voice selection from available system voices
 * - Fires onHighlightWord callback for synchronized text highlighting
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TextToSpeechProps {
  /** The raw content text to read (stripped of markdown) */
  text: string;
  /** Called with the current word index being spoken */
  onSpeakingWord?: (wordIndex: number | null) => void;
}

/**
 * Strips markdown formatting to get clean readable text.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,3}\s/g, '')        // Remove heading markers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold markers
    .replace(/\[SCRAMBLE:.*?\]/gi, '') // Remove game tags
    .replace(/\[FILLBLANK:.*?\]/gi, '')
    .replace(/- /g, '• ')            // Bullets
    .replace(/\n{2,}/g, '. ')        // Double newlines to pauses
    .replace(/\n/g, ' ')             // Single newlines to spaces
    .trim();
}

export function TextToSpeech({ text, onSpeakingWord }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if Speech API is available
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const available = speechSynthesis.getVoices();
      // Filter to English voices for this EdTech platform
      const englishVoices = available.filter(v => v.lang.startsWith('en'));
      setVoices(englishVoices.length > 0 ? englishVoices : available.slice(0, 10));
      if (englishVoices.length > 0 && !selectedVoice) {
        // Prefer a natural-sounding voice
        const preferred = englishVoices.find(v => v.name.includes('Google') || v.name.includes('Samantha')) || englishVoices[0];
        setSelectedVoice(preferred.name);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const handlePlay = useCallback(() => {
    if (!isSupported) return;

    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    // Cancel any existing speech
    speechSynthesis.cancel();

    const cleanText = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Set voice
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.rate = speed;
    utterance.pitch = 1;

    // Track word boundaries for highlighting
    const words = cleanText.split(/\s+/);
    let wordIndex = 0;

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        // Estimate word index from char offset
        const spoken = cleanText.substring(0, event.charIndex);
        wordIndex = spoken.split(/\s+/).length - 1;
        onSpeakingWord?.(wordIndex);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      onSpeakingWord?.(null);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      onSpeakingWord?.(null);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }, [isSupported, isPaused, text, voices, selectedVoice, speed, onSpeakingWord]);

  const handlePause = useCallback(() => {
    if (!isSupported) return;
    speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, [isSupported]);

  const handleStop = useCallback(() => {
    if (!isSupported) return;
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    onSpeakingWord?.(null);
  }, [isSupported, onSpeakingWord]);

  if (!isSupported) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Play / Pause */}
      <Tooltip>
        <TooltipTrigger asChild>
          {isPlaying ? (
            <Button variant="ghost" size="icon" onClick={handlePause} className="h-8 w-8 hover:bg-primary/20">
              <Pause className="h-4 w-4 text-primary" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={handlePlay} className="h-8 w-8 hover:bg-primary/20">
              <Play className="h-4 w-4" />
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-black/90 border-primary/30">
          <p className="text-xs">{isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Read Aloud'}</p>
        </TooltipContent>
      </Tooltip>

      {/* Stop */}
      {(isPlaying || isPaused) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleStop} className="h-8 w-8 hover:bg-destructive/20">
              <Square className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-black/90 border-primary/30">
            <p className="text-xs">Stop</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Speed control */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
              const currentIdx = speeds.indexOf(speed);
              const nextIdx = (currentIdx + 1) % speeds.length;
              setSpeed(speeds[nextIdx]);
            }}
            className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-primary/20 hover:border-primary/40 transition-colors"
          >
            {speed}x
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-black/90 border-primary/30">
          <p className="text-xs">Click to change speed</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
