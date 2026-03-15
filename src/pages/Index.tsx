/**
 * @file Index.tsx — Landing Page
 * 
 * Premium Cyberpunk Tech landing page with:
 * - Neon-glow H1 headings with Rajdhani font
 * - Chamfered data-cards with angled corners
 * - Timeline/circuit-board connector for phase sections
 * - UI frame brackets around CTAs
 * - Multi-layered hover buttons
 * - Floating bokeh particles (via PublicLayout)
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCourses } from '@/hooks/useCourses';
import { phaseMetadata, formatPrice, type CoursePhase } from '@/lib/courseData';
import { 
  ArrowRight, 
  Rocket, 
  Brain, 
  Target, 
  Zap,
  CheckCircle2,
  Star,
  Users,
  Trophy,
  Play,
  Terminal,
  Cpu,
  GraduationCap,
  Briefcase,
  Lightbulb,
  DollarSign
} from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';
import { PageMeta } from '@/components/layout/PageMeta';
import { ErrorView } from '@/components/ui/error-view';
import { UIFrame } from '@/components/landing/UIFrame';

export default function Index() {
  const { data: courses, isLoading, isError, error, refetch } = useCourses();

  /* Group courses by phase */
  const coursesByPhase = courses?.reduce((acc, course) => {
    const phase = course.phase as CoursePhase;
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(course);
    return acc;
  }, {} as Record<CoursePhase, typeof courses>);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Get personalized feedback and guidance from our AI tutor on every lesson.',
      color: 'primary' as const,
    },
    {
      icon: Target,
      title: 'Project-Based',
      description: 'Complete real projects that become your professional portfolio.',
      color: 'secondary' as const,
    },
    {
      icon: Zap,
      title: 'Self-Paced',
      description: 'Learn at your own speed with lifetime access to all course materials.',
      color: 'accent' as const,
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect with fellow solo founders in course discussion boards.',
      color: 'primary' as const,
    },
  ];

  /* Phase color helpers for timeline nodes */
  const phaseColors: Record<CoursePhase, string> = {
    initialization: 'text-primary',
    orchestration: 'text-secondary',
    launch: 'text-accent',
  };

  if (isError) {
    return (
      <div className="flex-1 relative z-10">
        <PageMeta path="/" />
        <ErrorView
          message={error?.message}
          onRetry={() => refetch()}
          backTo="/"
          backLabel="Go home"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 relative z-10">
      <PageMeta path="/" />

      {/* ═══════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24 md:py-36 nebula-section">
        {/* Animated orb background effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] animate-orb-glow-primary" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[150px] animate-orb-glow-secondary" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px] animate-orb-glow-accent" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container relative">
          <div className="max-w-5xl mx-auto text-center">
            {/* Terminal-style badge */}
            <div className="mb-8 px-4 py-2 text-sm font-mono border border-secondary/40 bg-secondary/10 rounded-full inline-flex items-center shadow-[0_0_20px_hsl(185_100%_55%/0.2)] animate-pulse-glow">
              <Terminal className="mr-2 h-4 w-4 text-secondary" />
              <span className="text-secondary">&gt;</span> AI-Powered Learning for Solo Founders
            </div>

            {/* H1 with neon glow animation */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight mb-8 leading-tight">
              <span className="text-foreground animate-neon-glow inline-block">BUILD YOUR</span>
              <br />
              <span className="text-nebula animate-flicker">DREAM BUSINESS</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
              10 comprehensive courses designed for solo founders. From mindset to market to money—
              graduate with a professional portfolio and investor-ready pitch.
            </p>

            {/* CTA Buttons with UI Frame */}
            <UIFrame className="inline-block p-6" scanline color="secondary">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="neon" asChild className="text-lg px-10 h-14 btn-cyber">
                  <Link to="/auth?mode=signup">
                    <Cpu className="mr-2 h-5 w-5" />
                    Initialize Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-10 h-14 btn-cyber">
                  <Link to="/courses">
                    <Play className="mr-2 h-5 w-5" />
                    View Courses
                  </Link>
                </Button>
              </div>
            </UIFrame>

            {/* Academy highlights */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-16 pt-10 border-t border-primary/20 relative">
              <div className="cosmic-divider absolute top-0 left-0 right-0" />
              {[
                { value: '10', label: 'Expert Courses', hoverColor: 'group-hover:text-primary' },
                { value: '3', label: 'Learning Phases', hoverColor: 'group-hover:text-secondary' },
                { value: '$49-69', label: 'Per Course', hoverColor: 'group-hover:text-accent' },
                { value: '∞', label: 'Lifetime Access', hoverColor: 'group-hover:text-primary' },
              ].map((stat) => (
                <div key={stat.label} className="text-center group">
                  <div className={`text-3xl font-display font-bold text-foreground ${stat.hoverColor} transition-colors`}>{stat.value}</div>
                  <div className="text-sm text-muted-foreground font-mono">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          WHO IS THIS FOR + FEATURES
          ═══════════════════════════════════════ */}
      <section id="features" className="py-24 relative nebula-section">
        <div className="cosmic-divider mb-16" />
        
        <div className="container relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              <span className="text-gradient-pink animate-neon-glow inline-block">DESIGNED FOR</span>
              <br />
              <span className="text-foreground font-heading">AMBITIOUS SOLO FOUNDERS</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Whether you're just starting out or scaling your existing business, 
              this academy is built for founders who want to do it all themselves.
            </p>
          </div>

          {/* Audience cards — chamfered data-card style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: Lightbulb, title: 'First-Time Founders', desc: 'New to entrepreneurship? Learn the complete journey from idea validation to your first paying customer.', color: 'primary' },
              { icon: Briefcase, title: 'Side Hustlers', desc: 'Building alongside a day job? Self-paced learning with lifetime access fits your busy schedule.', color: 'secondary' },
              { icon: GraduationCap, title: 'Career Changers', desc: 'Transitioning from corporate? Graduate with a professional portfolio and investor-ready pitch.', color: 'accent' },
              { icon: Users, title: 'Indie Hackers', desc: 'Already building? Fill the gaps in your knowledge with targeted courses on branding, sales, and automation.', color: 'primary' },
            ].map((item) => (
              <div key={item.title} className="data-card p-6 group cursor-default nebula-glow-hover">
                <div className={`h-14 w-14 rounded-xl bg-${item.color}/10 border border-${item.color}/30 flex items-center justify-center mb-4 transition-all duration-300`}>
                  <item.icon className={`h-7 w-7 text-${item.color}`} />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="text-center mb-12">
            <h3 className="text-3xl font-display font-bold mb-4 text-foreground">Platform Features</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to succeed, built into one powerful learning platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="data-card p-6 group cursor-default nebula-glow-hover">
                <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 transition-all duration-300">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PRICING SECTION
          ═══════════════════════════════════════ */}
      <section id="pricing" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent" />
        
        <div className="container relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              <span className="text-gradient-cyan animate-neon-glow inline-block">SIMPLE PRICING</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Pay per course. No subscriptions. Lifetime access to everything you purchase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Per Course */}
            <div className="data-card p-8 text-center">
              <div className="h-16 w-16 mx-auto rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-foreground mb-1">Per Course</h3>
              <p className="text-sm text-muted-foreground mb-4">Individual course access</p>
              <div className="text-4xl font-display font-bold text-primary mb-4">$49 - $69</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Lifetime access</li>
                <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />AI tutor included</li>
                <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Certificate on completion</li>
              </ul>
            </div>

            {/* Complete Phase — highlighted */}
            <UIFrame color="primary" className="p-0">
              <div className="data-card p-8 text-center border-primary/40 shadow-[0_0_30px_hsl(270_80%_60%/0.15)]">
                <Badge className="w-fit mx-auto mb-4 bg-primary/20 text-primary border-primary/30">Most Popular</Badge>
                <div className="h-16 w-16 mx-auto rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-foreground mb-1">Complete Phase</h3>
                <p className="text-sm text-muted-foreground mb-4">3-4 courses bundled</p>
                <div className="text-4xl font-display font-bold text-primary mb-4">~$200</div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />All phase courses</li>
                  <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Project-based learning</li>
                  <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Community access</li>
                </ul>
              </div>
            </UIFrame>

            {/* Full Academy */}
            <div className="data-card p-8 text-center">
              <div className="h-16 w-16 mx-auto rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-foreground mb-1">Full Academy</h3>
              <p className="text-sm text-muted-foreground mb-4">All 10 courses</p>
              <div className="text-4xl font-display font-bold text-accent mb-4">~$590</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Complete curriculum</li>
                <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Portfolio website</li>
                <li className="flex items-center gap-2 justify-center"><CheckCircle2 className="h-4 w-4 text-success" />Pitch presentation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          COURSE JOURNEY — TIMELINE LAYOUT
          ═══════════════════════════════════════ */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              <span className="text-foreground">YOUR PATH TO</span>
              <br />
              <span className="text-gradient animate-neon-glow inline-block">SUCCESS</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Three phases, ten courses, one transformation. Each course builds on the last, 
              culminating in your professional portfolio and pitch.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <NeonSpinner size="lg" />
            </div>
          ) : (
            /* Timeline connector layout */
            <div className="timeline-connector space-y-20 max-w-5xl mx-auto">
              {(['initialization', 'orchestration', 'launch'] as CoursePhase[]).map((phase, idx) => {
                const meta = phaseMetadata[phase];
                const phaseCourses = coursesByPhase?.[phase] || [];

                return (
                  <div key={phase} className="relative space-y-8">
                    {/* Timeline node */}
                    <div className={`timeline-node ${phaseColors[phase]}`} style={{ top: '0.25rem' }} />

                    {/* Phase header */}
                    <div className="flex flex-wrap items-center gap-4">
                      <Badge className={`${meta.colorClass} px-4 py-2 text-sm font-display`}>
                        <span className="mr-2 text-lg">{meta.icon}</span>
                        {meta.label}
                      </Badge>
                      <span className="text-muted-foreground font-mono text-sm">{meta.description}</span>
                    </div>

                    {/* Course cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {phaseCourses.map((course) => (
                        <div key={course.id} className="data-card p-6 group">
                          <div className="flex items-start justify-between mb-3">
                            <Badge variant="outline" className="text-xs font-mono border-primary/30">
                              Course {course.order_number}
                            </Badge>
                            <span className="font-display font-bold text-primary">
                              {formatPrice(course.price_cents)}
                            </span>
                          </div>
                          <h3 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {course.description}
                          </p>
                          <Button variant="ghost" className="w-full group-hover:bg-primary/10 group-hover:text-primary" asChild>
                            <Link to={`/courses/${course.id}`}>
                              View Course
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FINAL CTA SECTION
          ═══════════════════════════════════════ */}
      <section className="py-24">
        <div className="container">
          <UIFrame scanline color="primary" className="max-w-4xl mx-auto">
            <div className="data-card overflow-hidden relative">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
              <div className="absolute inset-0 grid-pattern opacity-30" />
              
              <div className="p-12 md:p-16 text-center relative">
                <div className="h-20 w-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_40px_hsl(270_80%_50%/0.5)] animate-glow">
                  <Trophy className="h-10 w-10 text-primary-foreground" />
                </div>
                
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 animate-neon-glow">
                  <span className="text-foreground">READY TO</span>
                  <br />
                  <span className="text-gradient">TRANSFORM?</span>
                </h2>
                
                <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">
                  Start your journey today. Complete all 10 courses and graduate with a 
                  professional portfolio and investor-ready pitch.
                </p>
                
                <Button size="lg" variant="neon" asChild className="text-lg px-12 h-14 btn-cyber">
                  <Link to="/auth?mode=signup">
                    <Rocket className="mr-2 h-5 w-5" />
                    Launch Your Journey
                  </Link>
                </Button>
                
                <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-mono">Lifetime access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-mono">AI-powered feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-mono">Certificate on completion</span>
                  </div>
                </div>
              </div>
            </div>
          </UIFrame>
        </div>
      </section>
    </div>
  );
}
