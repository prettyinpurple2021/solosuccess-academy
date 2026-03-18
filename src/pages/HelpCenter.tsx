/**
 * @file HelpCenter.tsx — Help Center & FAQ Page
 * 
 * Public page with searchable FAQ accordion and contact support form.
 * Categories: General, Learning Experience, Gamification, Account & Access, Legal & Permissions
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, HelpCircle, Send, BookOpen, Gamepad2, UserCog, Scale, Info, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PageMeta } from '@/components/layout/PageMeta';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/* ── FAQ Data ─────────────────────────────────────────── */

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  name: string;
  icon: React.ReactNode;
  items: FaqItem[];
}

const faqCategories: FaqCategory[] = [
  {
    name: 'General',
    icon: <Info className="h-5 w-5" />,
    items: [
      {
        question: 'What is SoloSuccess Academy?',
        answer:
          'SoloSuccess Academy is a private, AI-powered Learning Management System (LMS) designed specifically for solo founders and small business owners. It delivers a 10-course curriculum covering every aspect of launching and growing a one-person business — from mindset and branding to sales psychology and investor pitches.',
      },
      {
        question: 'Who is SoloSuccess Academy for?',
        answer:
          'The platform is built for aspiring entrepreneurs who want to launch a business without a co-founder or external funding, freelancers looking to productize their skills, side-project founders who want a structured path, and small business owners who want to fill knowledge gaps in marketing, automation, or strategy.',
      },
      {
        question: 'Is SoloSuccess Academy free?',
        answer:
          'Course access may require a purchase depending on the individual course. The platform supports paid enrollments processed securely through Stripe.',
      },
      {
        question: 'Is my data private?',
        answer:
          'Yes. All personal data and course progress are protected by Row Level Security (RLS) policies at the database level. Students can only access their own records. No data is sold or shared with third parties.',
      },
    ],
  },
  {
    name: 'Learning Experience',
    icon: <BookOpen className="h-5 w-5" />,
    items: [
      {
        question: 'How does the AI Tutor work?',
        answer:
          'The AI Tutor is a conversational assistant available on every lesson page. You can ask it to explain concepts, clarify assignments, give examples, or help you brainstorm. It maintains context within your session so the conversation flows naturally.',
      },
      {
        question: 'What is the Flashcard System?',
        answer:
          'The flashcard system uses the SM-2 spaced-repetition algorithm — the same method used by professional memory tools like Anki. Cards are shown to you at scientifically optimal intervals so you review material just before you\'re likely to forget it, maximizing retention with minimal study time.',
      },
      {
        question: 'How do quizzes work?',
        answer:
          'Each course includes at least one graded quiz. Quizzes are multiple-choice and provide instant feedback after each question. Your score is saved and contributes to your course completion status. A passing score is required to unlock your Certificate of Completion.',
      },
      {
        question: 'What is the Final Exam?',
        answer:
          'Course 10 ends with a comprehensive Final Exam — The Solo Founder Certification, which covers key concepts from all 10 courses. Passing this exam is a prerequisite for receiving the capstone Solo Founder Certificate.',
      },
      {
        question: 'How do I earn a Certificate?',
        answer:
          'To earn a Certificate of Completion for any course: (1) Complete all lessons in the course, (2) Pass the course quiz with a qualifying score. Your certificate is then automatically generated as a downloadable PDF with a unique verification code (SSA-XXXX-XXXX).',
      },
      {
        question: 'Can anyone verify my certificate?',
        answer:
          'Yes. Every certificate includes a unique verification code and a public verification URL. Employers, partners, or collaborators can visit that URL to confirm the certificate is genuine, who it was awarded to, and when.',
      },
    ],
  },
  {
    name: 'Gamification',
    icon: <Gamepad2 className="h-5 w-5" />,
    items: [
      {
        question: 'What is XP?',
        answer:
          'XP (Experience Points) is earned by completing lessons, passing quizzes, submitting assignments, and maintaining daily login streaks. Your total XP determines your position on the platform leaderboard.',
      },
      {
        question: 'What are Streaks?',
        answer:
          'A streak counts the number of consecutive days you\'ve been active on the platform. Keeping your streak alive is rewarded with bonus XP.',
      },
      {
        question: 'What are Badges?',
        answer:
          'Badges are visual achievements awarded for reaching specific milestones — for example, completing your first course, maintaining a 7-day streak, or earning your first certificate.',
      },
    ],
  },
  {
    name: 'Account & Access',
    icon: <UserCog className="h-5 w-5" />,
    items: [
      {
        question: 'How do I reset my password?',
        answer:
          'On the sign-in page, click "Forgot password?", enter your email address, and you\'ll receive a password reset email. Follow the link in the email to set a new password.',
      },
      {
        question: 'Can I use Google to sign in?',
        answer:
          'Google OAuth is planned for a future release. Currently, email/password authentication is the supported login method.',
      },
      {
        question: 'How do I update my profile?',
        answer:
          'Navigate to the Profile page from the sidebar. You can update your display name, avatar, and other account details from there.',
      },
    ],
  },
  {
    name: 'Legal & Permissions',
    icon: <Scale className="h-5 w-5" />,
    items: [
      {
        question: 'Can I share or reuse content from SoloSuccess Academy?',
        answer:
          'No. All content, code, design, ideas, curriculum, and assets within SoloSuccess Academy are proprietary and exclusively owned by the creator. No permission is granted for any form of reproduction, distribution, modification, or commercial use.',
      },
      {
        question: 'Is this an open-source project?',
        answer:
          'No. SoloSuccess Academy is a private, proprietary project. The source code, database schema, and all associated intellectual property are not available for public use or distribution under any circumstances.',
      },
    ],
  },
];

/* ── Component ─────────────────────────────────────────── */

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  /* Filter FAQ items by search query */
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return faqCategories;

    const q = searchQuery.toLowerCase();
    return faqCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  /* Handle contact form submission — sends to edge function */
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields before submitting.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-contact', {
        body: { ...contactForm, source: 'help-center' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Message sent!', description: "Thank you for reaching out. We'll get back to you as soon as possible." });
      setContactForm({ name: '', email: '', message: '' });
    } catch (err: any) {
      toast({ title: 'Something went wrong', description: err.message || 'Please try again later.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Help Center — SoloSuccess Academy"
        description="Find answers to frequently asked questions and get support for SoloSuccess Academy."
      />

      <div className="container py-12 md:py-20 space-y-16">
        {/* ── Hero Section ─────────────────────────── */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-mono">
            <HelpCircle className="h-4 w-4" />
            Help Center
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            How can we <span className="text-gradient">help you?</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Search our FAQ or browse by category. Can't find your answer? Contact us below.
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neon-input pl-12 h-12 text-base"
            />
          </div>
        </section>

        {/* ── FAQ Accordion ────────────────────────── */}
        <section className="max-w-3xl mx-auto space-y-10">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
              <Button variant="ghost" className="mt-4" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <Card
                key={category.name}
                className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.05)]"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg font-display">
                    <span className="text-primary">{category.icon}</span>
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`${category.name}-${idx}`}
                        className="border-primary/10"
                      >
                        <AccordionTrigger className="text-left hover:no-underline hover:text-primary text-sm md:text-base">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        {/* ── Contact Support Section ─────────────── */}
        <section className="max-w-2xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.08)]">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-display">
                <Send className="h-5 w-5 inline-block mr-2 text-primary" />
                Still need help?
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                Send us a message and we'll get back to you as soon as possible. You can also reach us at{' '}
                <a href="mailto:support@solosuccessacademy.cloud" className="text-primary hover:underline">
                  support@solosuccessacademy.cloud
                </a>
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="help-name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input
                      id="help-name"
                      placeholder="Your name"
                      className="neon-input"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="help-email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="help-email"
                      type="email"
                      placeholder="you@example.com"
                      className="neon-input"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="help-message" className="text-sm font-medium">
                    Message
                  </label>
                  <Textarea
                    id="help-message"
                    placeholder="Describe your issue or question..."
                    rows={5}
                    className="border-primary/30 bg-black/60 backdrop-blur-sm focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.4)] focus:outline-none"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                </div>
                <Button type="submit" variant="neon" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm">
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors font-mono">
              About Us
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors font-mono">
              Contact Page
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors font-mono">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors font-mono">
              Terms of Service
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
