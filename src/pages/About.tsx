/**
 * @file About.tsx — About Us Page
 * 
 * Public page with mission statement, platform vision, and stats.
 */
import { Link } from 'react-router-dom';
import { Zap, Target, Users, BookOpen, Brain, Rocket, Award, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageMeta } from '@/components/layout/PageMeta';

/* ── Platform stats ──────────────────────── */
const stats = [
  { label: 'Courses', value: '10', icon: BookOpen },
  { label: 'Learning Phases', value: '3', icon: Target },
  { label: 'AI-Powered Features', value: '5+', icon: Brain },
  { label: 'Certificates Available', value: '10', icon: Award },
];

export default function About() {
  return (
    <>
      <PageMeta
        title="About Us — SoloSuccess Academy"
        description="Learn about SoloSuccess Academy's mission to empower solo entrepreneurs with AI-powered education."
      />

      <div className="container py-12 md:py-20 space-y-20">
        {/* ── Hero ──────────────────────────────── */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-mono">
            <Zap className="h-4 w-4" />
            About Us
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            Empowering <span className="text-gradient">Solo Founders</span> to Build the Future
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            SoloSuccess Academy is an AI-powered learning platform designed for ambitious individuals
            who want to launch, grow, and scale a one-person business — without a co-founder, without
            venture capital, and without compromise.
          </p>
        </section>

        {/* ── Mission ──────────────────────────── */}
        <section className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold">
              Our <span className="text-gradient">Mission</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We believe that entrepreneurship shouldn't require a team, a network, or deep pockets.
              With the right knowledge, tools, and support system, a single motivated individual can
              build something extraordinary.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our structured 10-course curriculum takes you from the initial spark of an idea through
              to a fully operational, revenue-generating solo business — complete with AI tutoring,
              interactive exercises, and verifiable certificates.
            </p>
          </div>
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.08)]">
            <CardContent className="p-8 space-y-4">
              <Rocket className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-xl font-display font-semibold">Three Learning Phases</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-mono font-bold">01</span>
                  <span><strong className="text-foreground">Initialization</strong> — Mindset, branding & identity foundations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary font-mono font-bold">02</span>
                  <span><strong className="text-foreground">Orchestration</strong> — Systems, sales & automation strategy</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent font-mono font-bold">03</span>
                  <span><strong className="text-foreground">Launch</strong> — Scaling, exit strategy & the final certification</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* ── Stats ────────────────────────────── */}
        <section className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="bg-card/50 backdrop-blur-sm border-primary/20 text-center p-6 hover:border-primary/40 transition-all"
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-3xl font-display font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-mono mt-1">{stat.label}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Who Is This For ─────────────────── */}
        <section className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-display font-bold">
            Who is this <span className="text-gradient">for?</span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              { icon: Users, title: 'Aspiring Entrepreneurs', desc: 'Launch your first business without a co-founder or funding.' },
              { icon: Target, title: 'Freelancers', desc: 'Productize your skills and build recurring revenue streams.' },
              { icon: Rocket, title: 'Side-Project Founders', desc: 'Turn your passion project into a real, structured business.' },
              { icon: Brain, title: 'Small Business Owners', desc: 'Fill knowledge gaps in marketing, automation, and strategy.' },
            ].map((item) => (
              <Card key={item.title} className="bg-card/50 backdrop-blur-sm border-primary/10 p-5">
                <div className="flex items-start gap-3">
                  <item.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────── */}
        <section className="text-center space-y-6">
          <h2 className="text-2xl font-display font-bold">Ready to start your journey?</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="neon" asChild>
              <Link to="/courses">
                Browse Courses <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-primary/30">
              <Link to="/help">Visit Help Center</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
