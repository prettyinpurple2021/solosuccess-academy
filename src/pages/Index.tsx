import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCourses } from '@/hooks/useCourses';
import { phaseMetadata, formatPrice, type CoursePhase } from '@/lib/courseData';
import { 
  ArrowRight, 
  Sparkles, 
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
  Cpu
} from 'lucide-react';
import { NeonSpinner } from '@/components/ui/neon-spinner';

export default function Index() {
  const { data: courses, isLoading } = useCourses();

  // Group courses by phase
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
      glow: 'group-hover:shadow-[0_0_30px_hsl(270_80%_60%/0.3)]',
    },
    {
      icon: Target,
      title: 'Project-Based',
      description: 'Complete real projects that become your professional portfolio.',
      glow: 'group-hover:shadow-[0_0_30px_hsl(185_80%_50%/0.3)]',
    },
    {
      icon: Zap,
      title: 'Self-Paced',
      description: 'Learn at your own speed with lifetime access to all course materials.',
      glow: 'group-hover:shadow-[0_0_30px_hsl(320_80%_60%/0.3)]',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect with fellow solo founders in course discussion boards.',
      glow: 'group-hover:shadow-[0_0_30px_hsl(270_80%_60%/0.3)]',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Founder, TechFlow',
      content: 'This academy gave me the framework I needed to launch my SaaS. The AI feedback on my pitch was invaluable!',
      avatar: 'SC',
    },
    {
      name: 'Marcus Johnson',
      role: 'Indie Hacker',
      content: 'From zero to a validated business idea in just 10 courses. The automation course alone saved me 20+ hours a week.',
      avatar: 'MJ',
    },
    {
      name: 'Elena Rodriguez',
      role: 'Creative Entrepreneur',
      content: 'The branding course transformed how I present my business. My conversion rates doubled!',
      avatar: 'ER',
    },
  ];

  return (
    <div className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-36">
          {/* Animated background effects */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] animate-orb-glow-primary" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[150px] animate-orb-glow-secondary" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px] animate-orb-glow-accent" style={{ animationDelay: '2s' }} />
          </div>

          <div className="container relative">
            <div className="max-w-5xl mx-auto text-center">
              {/* Terminal-style badge */}
              <Badge 
                variant="outline" 
                className="mb-8 px-4 py-2 text-sm font-mono border-primary/40 bg-primary/10 shadow-[0_0_20px_hsl(270_80%_50%/0.3)] animate-pulse-glow"
              >
                <Terminal className="mr-2 h-4 w-4 text-primary" />
                <span className="text-primary">&gt;</span> AI-Powered Learning for Solo Founders
              </Badge>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black tracking-tight mb-8 leading-tight">
                <span className="text-foreground">BUILD YOUR</span>
                <br />
                <span className="text-gradient animate-flicker">DREAM BUSINESS</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                10 comprehensive courses designed for solo founders. From mindset to market to money—
                graduate with a professional portfolio and investor-ready pitch.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="neon" asChild className="text-lg px-10 h-14">
                  <Link to="/auth?mode=signup">
                    <Cpu className="mr-2 h-5 w-5" />
                    Initialize Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-10 h-14">
                  <Link to="/courses">
                    <Play className="mr-2 h-5 w-5" />
                    View Courses
                  </Link>
                </Button>
              </div>

              {/* Social proof with neon styling */}
              <div className="flex items-center justify-center gap-12 mt-16 pt-10 border-t border-primary/20">
                <div className="text-center group">
                  <div className="text-3xl font-display font-bold text-foreground group-hover:text-primary transition-colors">10,000+</div>
                  <div className="text-sm text-muted-foreground font-mono">Students</div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-display font-bold text-foreground group-hover:text-secondary transition-colors">10</div>
                  <div className="text-sm text-muted-foreground font-mono">Courses</div>
                </div>
                <div className="text-center group">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-3xl font-display font-bold text-foreground group-hover:text-accent transition-colors">4.9</span>
                    <Star className="h-6 w-6 fill-warning text-warning" />
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
          
          <div className="container relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                <span className="text-gradient-pink">WHY SOLO FOUNDERS</span>
                <br />
                <span className="text-foreground">CHOOSE US</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Everything you need to go from idea to successful business, 
                with AI assistance every step of the way.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card 
                  key={feature.title} 
                  className={`group glass-card glass-card-hover cursor-default ${feature.glow}`}
                >
                  <CardHeader>
                    <div className="h-14 w-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_hsl(270_80%_60%/0.4)] transition-all duration-300">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Course Journey Section */}
        <section className="py-24">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                <span className="text-foreground">YOUR PATH TO</span>
                <br />
                <span className="text-gradient">SUCCESS</span>
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
              <div className="space-y-16">
                {(['initialization', 'orchestration', 'launch'] as CoursePhase[]).map((phase) => {
                  const meta = phaseMetadata[phase];
                  const phaseCourses = coursesByPhase?.[phase] || [];

                  return (
                    <div key={phase} className="space-y-8">
                      <div className="flex items-center gap-4">
                        <Badge className={`${meta.colorClass} px-4 py-2 text-sm font-display`}>
                          <span className="mr-2 text-lg">{meta.icon}</span>
                          {meta.label}
                        </Badge>
                        <span className="text-muted-foreground font-mono">{meta.description}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {phaseCourses.map((course) => (
                          <Card 
                            key={course.id} 
                            className="group glass-card glass-card-hover"
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <Badge variant="outline" className="text-xs font-mono border-primary/30">
                                  Course {course.order_number}
                                </Badge>
                                <span className="font-display font-bold text-primary">
                                  {formatPrice(course.price_cents)}
                                </span>
                              </div>
                              <CardTitle className="text-xl mt-3 group-hover:text-primary transition-colors">
                                {course.title}
                              </CardTitle>
                              <CardDescription className="line-clamp-2">
                                {course.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Button variant="ghost" className="w-full group-hover:bg-primary/10 group-hover:text-primary" asChild>
                                <Link to={`/courses/${course.id}`}>
                                  View Course
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent" />
          
          <div className="container relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                <span className="text-gradient-cyan">SUCCESS STORIES</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Join thousands of solo founders who've transformed their businesses.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="glass-card glass-card-hover">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-display font-bold text-primary shadow-[0_0_15px_hsl(270_80%_60%/0.3)]">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-display font-medium">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container">
            <Card className="glass-card border-primary/30 overflow-hidden relative">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
              <div className="absolute inset-0 grid-pattern opacity-30" />
              
              <CardContent className="p-16 text-center relative">
                <div className="h-20 w-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_40px_hsl(270_80%_50%/0.5)] animate-glow">
                  <Trophy className="h-10 w-10 text-primary-foreground" />
                </div>
                
                <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                  <span className="text-foreground">READY TO</span>
                  <br />
                  <span className="text-gradient">TRANSFORM?</span>
                </h2>
                
                <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">
                  Start your journey today. Complete all 10 courses and graduate with a 
                  professional portfolio and investor-ready pitch.
                </p>
                
                <Button size="lg" variant="neon" asChild className="text-lg px-12 h-14">
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
              </CardContent>
            </Card>
          </div>
        </section>
    </div>
  );
}