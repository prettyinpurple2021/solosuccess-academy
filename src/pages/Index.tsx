import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
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
  Play
} from 'lucide-react';

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
    },
    {
      icon: Target,
      title: 'Project-Based',
      description: 'Complete real projects that become your professional portfolio.',
    },
    {
      icon: Zap,
      title: 'Self-Paced',
      description: 'Learn at your own speed with lifetime access to all course materials.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect with fellow solo founders in course discussion boards.',
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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          {/* Background effects */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px]" />
            <div className="absolute inset-0 grid-pattern opacity-30" />
          </div>

          <div className="container relative">
            <div className="max-w-4xl mx-auto text-center">
              <Badge 
                variant="outline" 
                className="mb-6 px-4 py-2 text-sm font-medium border-primary/30 bg-primary/5"
              >
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                AI-Powered Learning for Solo Founders
              </Badge>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6">
                Build Your Dream Business
                <span className="block text-gradient mt-2">One Course at a Time</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                10 comprehensive courses designed for solo founders. From mindset to market to money—
                graduate with a professional portfolio and investor-ready pitch.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild className="text-lg px-8 neon-border">
                  <Link to="/auth?mode=signup">
                    Start Learning Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg px-8">
                  <Link to="/courses">
                    <Play className="mr-2 h-5 w-5" />
                    View Courses
                  </Link>
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-border/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">10,000+</div>
                  <div className="text-sm text-muted-foreground">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">10</div>
                  <div className="text-sm text-muted-foreground">Courses</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-2xl font-bold text-foreground">4.9</span>
                    <Star className="h-5 w-5 fill-warning text-warning" />
                  </div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Why Solo Founders Choose Us
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to go from idea to successful business, 
                with AI assistance every step of the way.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border/50 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Course Journey Section */}
        <section className="py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Your Journey to Success
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Three phases, ten courses, one transformation. Each course builds on the last, 
                culminating in your professional portfolio and pitch.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-12">
                {(['initialization', 'orchestration', 'launch'] as CoursePhase[]).map((phase) => {
                  const meta = phaseMetadata[phase];
                  const phaseCourses = coursesByPhase?.[phase] || [];

                  return (
                    <div key={phase} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Badge className={meta.colorClass}>
                          <span className="mr-1">{meta.icon}</span>
                          {meta.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{meta.description}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {phaseCourses.map((course) => (
                          <Card 
                            key={course.id} 
                            className="group border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <Badge variant="outline" className="text-xs">
                                  Course {course.order_number}
                                </Badge>
                                <span className="font-bold text-primary">
                                  {formatPrice(course.price_cents)}
                                </span>
                              </div>
                              <CardTitle className="text-lg mt-2 group-hover:text-primary transition-colors">
                                {course.title}
                              </CardTitle>
                              <CardDescription className="line-clamp-2">
                                {course.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Button variant="ghost" className="w-full group-hover:bg-primary/10" asChild>
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
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Success Stories
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Join thousands of solo founders who've transformed their businesses.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
              <CardContent className="p-12 text-center relative">
                <div className="absolute inset-0 grid-pattern opacity-20" />
                <div className="relative">
                  <Trophy className="h-16 w-16 mx-auto mb-6 text-primary" />
                  <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                    Ready to Transform Your Business?
                  </h2>
                  <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                    Start your journey today. Complete all 10 courses and graduate with a 
                    professional portfolio and investor-ready pitch.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button size="lg" asChild className="text-lg px-8">
                      <Link to="/auth?mode=signup">
                        Get Started Now
                        <Rocket className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Lifetime access
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      AI-powered feedback
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Certificate on completion
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
