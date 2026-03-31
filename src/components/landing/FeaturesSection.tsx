/**
 * @file FeaturesSection.tsx — Target audience + platform features
 * 
 * Showcases who the academy is for and the key platform
 * capabilities in chamfered data-card style.
 */
import {
  Brain,
  Target,
  Zap,
  Users,
  Lightbulb,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

/** Target audience personas */
const audiences = [
  { icon: Lightbulb, title: 'First-Time Founders', desc: 'New to entrepreneurship? Learn the complete journey from idea validation to your first paying customer.', color: 'primary' },
  { icon: Briefcase, title: 'Side Hustlers', desc: 'Building alongside a day job? Self-paced learning with lifetime access fits your busy schedule.', color: 'secondary' },
  { icon: GraduationCap, title: 'Career Changers', desc: 'Transitioning from corporate? Graduate with a professional portfolio and investor-ready pitch.', color: 'accent' },
  { icon: Users, title: 'Indie Hackers', desc: 'Already building? Fill the gaps in your knowledge with targeted courses on branding, sales, and automation.', color: 'primary' },
] as const;

/** Platform feature highlights */
const features = [
  { icon: Brain, title: 'AI-Powered Learning', description: 'Get personalized feedback and guidance from our AI tutor on every lesson.' },
  { icon: Target, title: 'Project-Based', description: 'Complete real projects that become your professional portfolio.' },
  { icon: Zap, title: 'Self-Paced', description: 'Learn at your own speed with lifetime access to all course materials.' },
  { icon: Users, title: 'Community', description: 'Connect with fellow solo founders in course discussion boards.' },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative nebula-section">
      <div className="cosmic-divider mb-16" />

      <div className="container relative">
        {/* Section heading */}
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

        {/* Audience cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {audiences.map((item) => (
            <div key={item.title} className="data-card p-6 group cursor-default nebula-glow-hover">
              <div className={`h-14 w-14 rounded-xl bg-${item.color}/10 border border-${item.color}/30 flex items-center justify-center mb-4 transition-all duration-300`}>
                <item.icon className={`h-7 w-7 text-${item.color}`} />
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Features heading */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-display font-bold mb-4 text-foreground">Platform Features</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to succeed, built into one powerful learning platform.
          </p>
        </div>

        {/* Feature cards */}
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
  );
}
