import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RotateCcw, 
  Check, 
  X, 
  Brain,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trophy
} from 'lucide-react';
import { Flashcard, useReviewFlashcard, useDueFlashcards } from '@/hooks/useFlashcards';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FlashcardViewerProps {
  courseId: string;
  onClose: () => void;
}

export function FlashcardViewer({ courseId, onClose }: FlashcardViewerProps) {
  const { data: dueCards = [], isLoading, refetch } = useDueFlashcards(courseId);
  const reviewFlashcard = useReviewFlashcard();
  const { toast } = useToast();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    if (dueCards.length > 0 && sessionCards.length === 0) {
      setSessionCards([...dueCards]);
    }
  }, [dueCards]);

  const currentCard = sessionCards[currentIndex];
  const totalCards = sessionCards.length;
  const progress = totalCards > 0 ? (reviewedCount / totalCards) * 100 : 0;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = async (quality: number) => {
    if (!currentCard) return;

    try {
      await reviewFlashcard.mutateAsync({
        flashcardId: currentCard.id,
        courseId,
        quality,
      });

      setReviewedCount(prev => prev + 1);
      
      // Move to next card
      if (currentIndex < sessionCards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        // Session complete
        toast({
          title: '🎉 Session Complete!',
          description: `You reviewed ${sessionCards.length} cards. Great job!`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed to save review',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < sessionCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Brain className="h-8 w-8 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  if (sessionCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <Trophy className="h-16 w-16 text-yellow-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
        <p className="text-muted-foreground mb-4">
          No flashcards due for review. Check back later!
        </p>
        <Button onClick={onClose}>Close</Button>
      </div>
    );
  }

  const isSessionComplete = reviewedCount >= totalCards;

  if (isSessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <div className="relative">
          <Trophy className="h-20 w-20 text-yellow-500 mb-4" />
          <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Session Complete! 🎉</h3>
        <p className="text-muted-foreground mb-6">
          You reviewed {totalCards} flashcard{totalCards !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {
            setSessionCards([]);
            setCurrentIndex(0);
            setReviewedCount(0);
            setIsFlipped(false);
            refetch();
          }}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Start New Session
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Card {currentIndex + 1} of {totalCards}
          </span>
          <span className="font-medium">
            {reviewedCount} reviewed
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div 
        className="perspective-1000 cursor-pointer"
        onClick={handleFlip}
      >
        <div 
          className={cn(
            "relative w-full h-[300px] transition-transform duration-500 transform-style-preserve-3d",
            isFlipped && "rotate-y-180"
          )}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <Card 
            className={cn(
              "absolute inset-0 backface-hidden flex items-center justify-center p-6",
              "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="text-center">
              <Badge variant="secondary" className="mb-4">Question</Badge>
              <p className="text-xl font-medium leading-relaxed">
                {currentCard?.front_text}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Click to reveal answer
              </p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card 
            className={cn(
              "absolute inset-0 backface-hidden flex items-center justify-center p-6",
              "bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20"
            )}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <CardContent className="text-center">
              <Badge variant="secondary" className="mb-4 bg-green-500/20 text-green-700">
                Answer
              </Badge>
              <p className="text-xl font-medium leading-relaxed">
                {currentCard?.back_text}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground px-4">
          {currentIndex + 1} / {totalCards}
        </span>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={goToNext}
          disabled={currentIndex === sessionCards.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Rating buttons - only show when flipped */}
      {isFlipped && (
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            How well did you remember?
          </p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              className="flex-1 max-w-[100px] border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => handleRate(1)}
              disabled={reviewFlashcard.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Again
            </Button>
            <Button
              variant="outline"
              className="flex-1 max-w-[100px] border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              onClick={() => handleRate(3)}
              disabled={reviewFlashcard.isPending}
            >
              Hard
            </Button>
            <Button
              variant="outline"
              className="flex-1 max-w-[100px] border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => handleRate(4)}
              disabled={reviewFlashcard.isPending}
            >
              Good
            </Button>
            <Button
              variant="outline"
              className="flex-1 max-w-[100px] border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => handleRate(5)}
              disabled={reviewFlashcard.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Easy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
