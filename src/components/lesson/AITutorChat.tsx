import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Bot, Send, User, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AITutorChatProps {
  courseTitle: string;
  lessonTitle: string;
  lessonContent: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AITutorChat({ 
  courseTitle, 
  lessonTitle, 
  lessonContent,
  isOpen,
  onClose
}: AITutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      // Get user session for proper authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to use the AI Tutor');
      }

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          courseTitle,
          lessonTitle,
          lessonContent: lessonContent?.substring(0, 2000), // Limit context size
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                }
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('AI Tutor error:', error);
      toast({
        title: 'AI Tutor Error',
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: 'destructive',
      });
      // Remove the empty assistant message if there was an error
      setMessages(prev => prev.filter((_, i) => i < prev.length - 1 || prev[prev.length - 1].content));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 z-50 w-72 glass-card cursor-pointer shadow-[0_0_30px_rgba(168,85,247,0.3)] border-primary/30"
        onClick={() => setIsMinimized(false)}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center shadow-[0_0_15px_hsl(var(--secondary)/0.4)]">
              <Bot className="h-4 w-4 text-secondary" />
            </div>
            <span className="font-display font-medium text-secondary">AI Tutor</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/20">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 hover:bg-destructive/20"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px] glass-card shadow-[0_0_40px_rgba(168,85,247,0.3)] border-primary/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-primary/20 flex items-center justify-between flex-shrink-0 surface-overlay">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center shadow-[0_0_15px_hsl(var(--secondary)/0.4)]">
            <Bot className="h-4 w-4 text-secondary" />
          </div>
          <div>
            <h3 className="font-display font-medium text-secondary">AI Tutor</h3>
            <p className="text-xs text-muted-foreground">Ask me anything about this lesson</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-primary/20"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-destructive/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-display font-medium mb-2 text-secondary">Welcome to AI Tutor!</h4>
            <p className="text-sm text-muted-foreground">
              I'm here to help you understand this lesson. Ask me any questions about the material, concepts, or how to apply them to your business.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                    message.role === 'user'
                      ? 'bg-primary/30 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.4)]'
                      : 'bg-secondary/20 text-secondary shadow-[0_0_10px_hsl(var(--secondary)/0.3)]'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 max-w-[80%] text-sm',
                    message.role === 'user'
                      ? 'bg-primary/20 text-foreground border border-primary/30'
                      : 'bg-secondary/10 text-foreground border border-secondary/20'
                  )}
                >
                  {message.content || (
                    <span className="inline-flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-primary/20 flex-shrink-0 surface-overlay">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="min-h-[40px] max-h-[100px] resize-none bg-input border-primary/30 focus:border-primary placeholder:text-muted-foreground/50"
            rows={1}
          />
          <Button
            size="icon"
            variant="neon"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}