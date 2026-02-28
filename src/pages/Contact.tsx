/**
 * @file Contact.tsx — Contact Us Page
 * 
 * Public page with a contact form and support links.
 * No backend needed — form shows a success toast.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Mail, HelpCircle, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageMeta } from '@/components/layout/PageMeta';
import { toast } from '@/hooks/use-toast';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Message sent!', description: "Thanks for reaching out — we'll respond as soon as possible." });
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <>
      <PageMeta title="Contact Us — SoloSuccess Academy" description="Get in touch with the SoloSuccess Academy team." />

      <div className="container py-12 md:py-20 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-mono">
            <MessageSquare className="h-4 w-4" />
            Contact Us
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            Get in <span className="text-gradient">touch</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Have a question, suggestion, or just want to say hi? We'd love to hear from you.
          </p>
        </section>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Contact Form */}
          <div className="md:col-span-2">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.08)]">
              <CardHeader>
                <CardTitle className="font-display text-xl">Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="contact-name" className="text-sm font-medium">Name *</label>
                      <Input id="contact-name" placeholder="Your name" className="neon-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="contact-email" className="text-sm font-medium">Email *</label>
                      <Input id="contact-email" type="email" placeholder="you@example.com" className="neon-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-subject" className="text-sm font-medium">Subject</label>
                    <Input id="contact-subject" placeholder="What's this about?" className="neon-input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-message" className="text-sm font-medium">Message *</label>
                    <Textarea
                      id="contact-message"
                      placeholder="Tell us more..."
                      rows={6}
                      className="border-primary/30 bg-black/60 backdrop-blur-sm focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.4)] focus:outline-none"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>
                  <Button type="submit" variant="neon" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar links */}
          <div className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 p-6 space-y-3">
              <Mail className="h-8 w-8 text-primary" />
              <h3 className="font-display font-semibold">Email Us</h3>
              <a href="mailto:support@solosuccess.academy" className="text-sm text-primary hover:underline font-mono block">
                support@solosuccess.academy
              </a>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-primary/20 p-6 space-y-3">
              <HelpCircle className="h-8 w-8 text-secondary" />
              <h3 className="font-display font-semibold">Help Center</h3>
              <p className="text-sm text-muted-foreground">Check our FAQ for quick answers.</p>
              <Button variant="outline" size="sm" asChild className="border-primary/30">
                <Link to="/help">Visit FAQ</Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
