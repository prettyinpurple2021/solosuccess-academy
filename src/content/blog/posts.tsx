/**
 * @file posts.tsx — Blog post registry
 *
 * Each post defines metadata (used by the blog index, SEO, JSON-LD)
 * plus a `body` React component rendered inside the post page.
 * Add new posts here — the routes and index auto-pick them up.
 */
import { Link } from 'react-router-dom';

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  excerpt: string;
  publishedAt: string; // ISO date
  updatedAt?: string;
  readingMinutes: number;
  author: { name: string; url?: string };
  tags: string[];
  /** FAQ items used to inject FAQPage JSON-LD. */
  faq?: { q: string; a: string }[];
  body: () => JSX.Element;
}

/* ── Reusable prose primitives (kept inline so posts read like an article) ── */
const H2 = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2 id={id} className="font-display text-2xl md:text-3xl font-bold mt-12 mb-4 scroll-mt-24">
    {children}
  </h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-display text-xl md:text-2xl font-semibold mt-8 mb-3 text-primary">
    {children}
  </h3>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
);

/* ─────────────────────────────────────────────────────────────
   POST 1 — 10 Online Courses for Entrepreneurs
   ───────────────────────────────────────────────────────────── */
function OnlineCoursesForEntrepreneursBody() {
  return (
    <article className="max-w-3xl mx-auto">
      <P>
        Search "online courses for entrepreneurs" and Google hands you Coursera, Harvard, and a dozen
        aggregator pages. None of them tell you which course is actually right for <em>you</em> —
        they're catalogs, not opinions.
      </P>
      <P>
        I spent the last few weeks going through every major platform with one question in mind:{' '}
        <strong>
          which of these actually helps a solo founder ship a real business — not just earn a
          certificate to hang on a LinkedIn profile?
        </strong>
      </P>
      <P>
        This is a hands-on comparison, written by the team behind{' '}
        <Link to="/about" className="text-primary hover:underline">SoloSuccess Academy</Link>. Yes,
        we're on the list. No, we're not #1 — we're #10, because ranking ourselves first would make
        this useless to you. We'll be transparent about who each course is for, who it's wrong for,
        and what it actually costs in 2026. No affiliate links. No "best of" filler.
      </P>

      <H2 id="evaluation">How I evaluated each course</H2>
      <P>
        Most "best of" lists rank by brand. I ranked by what matters when you're a one-person
        operation with limited time and money. Six criteria, scored 1–5:
      </P>
      <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-6 marker:text-primary">
        <li><strong>Built for solo founders</strong> — vs. corporate teams or MBA students.</li>
        <li><strong>Hands-on output</strong> — do you leave with a real artifact?</li>
        <li><strong>Mentor or feedback loop</strong> — human or capable AI.</li>
        <li><strong>Lifetime access vs. subscription.</strong></li>
        <li><strong>Price-to-depth ratio.</strong></li>
        <li><strong>Community</strong> — a peer group where you can ask "is this normal?"</li>
      </ol>
      <P>
        A perfect course doesn't exist. The right course matches <em>your</em> phase: idea →
        validation → first revenue → scale.
      </P>

      <H2 id="ranked">The 10 courses, ranked by fit for solo founders</H2>

      <H3>1. Coursera — Entrepreneurship Specializations</H3>
      <P>
        <strong>Best for:</strong> Structured learners who want a recognizable university brand on
        their résumé. The Wharton "Entrepreneurship Specialization" spans opportunity discovery,
        launch, growth, and financing. Well-produced, taught by tenured professors.
      </P>
      <P>
        <strong>Format:</strong> 4–6 month specializations. <strong>Cost:</strong> $49–$59/month
        subscription. <strong>Skip if:</strong> You want to <em>build</em>, not study. Heavy on
        lectures, light on shipping — designed for venture-track startups, not bootstrappers.
      </P>

      <H3>2. Harvard Business School Online — Entrepreneurship Essentials</H3>
      <P>
        <strong>Best for:</strong> Career-changers and corporate professionals who need credibility
        to pivot. The case-method teaching is genuinely good and the cohort discussions are sharp.
      </P>
      <P>
        <strong>Format:</strong> 6-week cohort, ~30 hours. <strong>Cost:</strong> ~$1,750.{' '}
        <strong>Skip if:</strong> Budget matters or you don't need the credential. You're paying for
        the Harvard name and network — both real, both expensive.
      </P>

      <H3>3. MIT OpenCourseWare — Entrepreneurship</H3>
      <P>
        <strong>Best for:</strong> Free self-learners with discipline. MIT publishes Bill Aulet's
        "Disciplined Entrepreneurship" — arguably the best framework taught at any university.
      </P>
      <P>
        <strong>Format:</strong> Lecture notes, slides, some video. <strong>Cost:</strong> $0.{' '}
        <strong>Skip if:</strong> You need accountability. No instructor, no deadline — OCW
        completion rates are in the low single digits.
      </P>

      <H3>4. LinkedIn Learning — Entrepreneurship paths</H3>
      <P>
        <strong>Best for:</strong> Existing LinkedIn Premium subscribers picking up specific skills.
        Quality is solid; depth is shallow.
      </P>
      <P>
        <strong>Format:</strong> Micro-lessons, 2–10 min each. <strong>Cost:</strong> Bundled with
        Premium (~$40/mo). <strong>Skip if:</strong> You want a coherent curriculum. It's a buffet
        of snacks, not a meal.
      </P>

      <H3>5. Udemy — Entrepreneurship category</H3>
      <P>
        <strong>Best for:</strong> Cheap, narrow, tactical skills like "Validate a SaaS idea in 7
        days." Excellent courses (Evan Kimbrell, Rob Percival) sit alongside thousands of low-effort
        ones — the platform doesn't curate, you do.
      </P>
      <P>
        <strong>Cost:</strong> $10–$25 on the perpetual sale. <strong>Skip if:</strong> Quality
        matters more than price. For tactical skills it's unbeatable; for a full curriculum, noise.
      </P>

      <H3>6. Alison — Free Entrepreneurship courses</H3>
      <P>
        <strong>Best for:</strong> Complete beginners testing whether entrepreneurship is even for
        them. Free to learn; ~$50 for the certificate PDF.
      </P>
      <P>
        <strong>Skip if:</strong> You're past the "is this for me?" stage. Once you decide to
        actually build something, Alison's depth runs out fast.
      </P>

      <H3>7. SBA Learning Platform</H3>
      <P>
        <strong>Best for:</strong> US founders who need the regulatory, legal, and financing basics
        done right — entity formation, taxes, SBA loans, federal contracts.
      </P>
      <P>
        <strong>Cost:</strong> Free. <strong>Skip if:</strong> You want strategy, marketing, or
        mindset — not SBA's strength. Outside the US, almost none of it applies.
      </P>

      <H3>8. Class Central / openSAP / edX (aggregators)</H3>
      <P>
        These aren't courses — they're catalogs. Useful for discovery, not for learning.{' '}
        <strong>Skip if:</strong> You're tired of "exploring" and want to commit to one thing and
        finish it. Aggregators are how courses go unfinished.
      </P>

      <H3>9. Y Combinator's Startup School</H3>
      <P>
        <strong>Best for:</strong> Founders aiming at venture-backed, high-growth startups. The
        lectures (Sam Altman, Paul Graham, Michael Seibel) are foundational, and the optional group
        track gives you weekly accountability.
      </P>
      <P>
        <strong>Cost:</strong> Free. <strong>Skip if:</strong> You're building a small, profitable,
        one-person business. YC's entire frame is "get big or die" — apply it to a $10k/month solo
        SaaS and you'll over-engineer everything.
      </P>

      <H3>10. SoloSuccess Academy</H3>
      <P>
        <strong>Best for:</strong> Solo founders building a profitable one-person business in 6–12
        months. We built this because every other course on this list is aimed at someone else — MBA
        students, corporate teams, VC-track founders. None are built for the person who wants to
        make $5k–$20k/month working for themselves.
      </P>
      <P>
        <strong>Format:</strong> 10 hands-on courses, 78 lessons, 78 practice labs, 30 textbook
        chapters. Every lesson has an AI tutor that knows the lesson and answers your questions in
        context. You ship a real portfolio artifact at the end of each course.
      </P>
      <P>
        <strong>Cost:</strong> $49–$69 per course or a multi-course bundle.{' '}
        <strong>Lifetime access</strong>, no subscription, 30-day money-back guarantee.{' '}
        <strong>Skip if:</strong> You're building a 50-person VC-funded SaaS — go to Y Combinator.
      </P>
      <P>
        <Link to="/courses" className="text-primary hover:underline font-semibold">
          See the SoloSuccess Academy curriculum →
        </Link>
      </P>

      <H2 id="comparison">Quick comparison</H2>
      <div className="overflow-x-auto my-6 border border-primary/20 rounded-lg">
        <table className="w-full text-sm font-mono">
          <thead className="bg-primary/10 text-primary">
            <tr>
              <th className="text-left p-3">Course</th>
              <th className="text-left p-3">Solo fit</th>
              <th className="text-left p-3">Output</th>
              <th className="text-left p-3">Cost</th>
              <th className="text-left p-3">Lifetime</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {[
              ['Coursera', '2/5', '3/5', 'Subscription', 'No'],
              ['HBS Online', '2/5', '3/5', '$$$$', 'No'],
              ['MIT OCW', '3/5', '2/5', 'Free', 'Yes'],
              ['LinkedIn Learning', '2/5', '2/5', 'Subscription', 'No'],
              ['Udemy', '3/5', '3/5', '$', 'Yes'],
              ['Alison', '2/5', '2/5', 'Free', 'Yes'],
              ['SBA', '2/5', '2/5', 'Free', 'Yes'],
              ['YC Startup School', '3/5', '4/5', 'Free', 'Yes'],
              ['SoloSuccess Academy', '5/5', '5/5', '$49–$69', 'Yes'],
            ].map((row) => (
              <tr key={row[0]} className="border-t border-primary/10">
                {row.map((cell, i) => (
                  <td key={i} className="p-3">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2 id="pick">Which one should you pick?</H2>
      <ul className="space-y-2 text-muted-foreground mb-4 marker:text-primary list-disc pl-6">
        <li><strong>"I want a credential":</strong> HBS Online (premium) or Coursera (budget).</li>
        <li><strong>"I want it free":</strong> MIT OCW + YC Startup School + SBA, combined.</li>
        <li><strong>"I want tactical skills, fast":</strong> Udemy or LinkedIn Learning.</li>
        <li><strong>"I want venture-scale":</strong> YC Startup School.</li>
        <li>
          <strong>"I want to ship a real solo business":</strong>{' '}
          <Link to="/courses" className="text-primary hover:underline">SoloSuccess Academy</Link>.
        </li>
      </ul>
      <P>
        The honest answer most "best of" articles won't give you:{' '}
        <strong>you probably already know which one you want.</strong> The question is whether
        you'll finish it. Course completion is the single biggest predictor of outcomes — well above
        brand, price, or curriculum. Pick the one you'll actually do.
      </P>

      <H2 id="faq">FAQ</H2>
      <div className="space-y-6">
        <div>
          <p className="font-semibold mb-1">What's the best online course for entrepreneurs in 2026?</p>
          <P>
            There's no single "best" — it depends on goals. For credibility, HBS Online. For free
            self-study, MIT OCW combined with YC Startup School. For solo founders building a
            one-person business, SoloSuccess Academy. For tactical micro-skills, Udemy.
          </P>
        </div>
        <div>
          <p className="font-semibold mb-1">Are online entrepreneurship courses worth it?</p>
          <P>
            Yes — <em>if</em> you finish one and ship something. Under 10% of MOOC students finish.
            Pick the format that matches how you actually learn.
          </P>
        </div>
        <div>
          <p className="font-semibold mb-1">How much should I spend on an online business course?</p>
          <P>
            For most solo founders, $0–$70 per course is plenty. Anything over $500 should include
            1:1 mentorship, a recognized credential, or a cohort. Be skeptical of $2,000+ courses
            that are just pre-recorded video.
          </P>
        </div>
        <div>
          <p className="font-semibold mb-1">Can I start a business without taking a course?</p>
          <P>
            Yes — most successful founders did. Courses compress trial-and-error and give you
            frameworks, but they don't replace doing.
          </P>
        </div>
      </div>

      <div className="mt-12 p-6 rounded-lg border border-primary/30 bg-primary/5">
        <p className="font-display text-xl font-bold mb-2">Ready to actually ship?</p>
        <p className="text-muted-foreground mb-4">
          SoloSuccess Academy is built for one person, one business, one shipped artifact at a time.
        </p>
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          Explore the curriculum →
        </Link>
      </div>
    </article>
  );
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-to-start-a-business-with-no-money',
    title: 'How to Start a Business With No Money in 2026 (Solo Founder Edition)',
    metaTitle: 'How to Start a Business With No Money in 2026',
    description:
      'A realistic, no-fluff playbook for starting a business with zero capital in 2026. Service-first models, free tools, and the exact first 30 days for solo founders.',
    excerpt:
      'You do not need savings, investors, or a co-founder. You need a sellable skill, one paying customer, and 30 honest days. Here is the playbook solo founders are actually using in 2026.',
    publishedAt: '2026-06-19',
    readingMinutes: 10,
    author: { name: 'The SoloSuccess Team', url: '/about' },
    tags: ['bootstrapping', 'no money', 'solo founders'],
    faq: [
      {
        q: 'Can you really start a business with no money?',
        a: 'Yes — if you start with a service-based business that sells your time or expertise. You skip inventory, equipment, and product development, and you get paid before you have to spend anything.',
      },
      {
        q: 'What is the cheapest type of business to start?',
        a: 'A skill-based service business: freelance writing, design, consulting, tutoring, virtual assistance, or coaching. Total cost to start is usually under $50 for a domain and basic landing page.',
      },
      {
        q: 'How long until I can earn money?',
        a: 'Most solo founders following a focused 30-day plan land their first paying customer within 2 to 6 weeks. Anything beyond 8 weeks usually means the offer or audience is wrong, not the effort.',
      },
      {
        q: 'Do I need an LLC to start?',
        a: 'No. You can legally operate as a sole proprietor in most jurisdictions and invoice clients immediately. Form an LLC once you are earning consistent revenue and want liability protection.',
      },
    ],
    body: HowToStartWithNoMoneyBody,
  },
  {
    slug: 'solopreneur-vs-entrepreneur',
    title: 'Solopreneur vs Entrepreneur: 7 Real Differences That Actually Matter',
    metaTitle: 'Solopreneur vs Entrepreneur: 7 Key Differences (2026)',
    description:
      'Solopreneur vs entrepreneur — the real differences in goals, funding, team, and lifestyle. A clear breakdown to help you pick the right path before you commit.',
    excerpt:
      'They sound interchangeable. They are not. The path you pick shapes how you fund, hire, work, and exit. Here are the 7 differences that actually matter — and how to know which one fits you.',
    publishedAt: '2026-06-20',
    readingMinutes: 7,
    author: { name: 'The SoloSuccess Team', url: '/about' },
    tags: ['solopreneur', 'entrepreneur', 'career'],
    faq: [
      {
        q: 'What is the difference between a solopreneur and an entrepreneur?',
        a: 'A solopreneur builds and runs a business alone, usually optimizing for freedom, profit per hour, and low overhead. An entrepreneur builds an organization, typically with employees, investors, and a goal of scale or exit.',
      },
      {
        q: 'Can a solopreneur become an entrepreneur?',
        a: 'Yes — many do. The transition usually happens when revenue plateaus on personal time and the founder decides to hire, raise capital, or productize beyond what one person can deliver.',
      },
      {
        q: 'Do solopreneurs make less money?',
        a: 'Not necessarily. Top solopreneurs earn $200K to $1M+ per year with no employees, by selling expertise, software, or premium services. They keep more of every dollar because overhead is minimal.',
      },
      {
        q: 'Which is better for beginners?',
        a: 'Solopreneurship is almost always the safer starting point. It teaches sales, delivery, finance, and marketing on a small surface area before you take on the risk and complexity of hiring or fundraising.',
      },
    ],
    body: SolopreneurVsEntrepreneurBody,
  },
  {
    slug: 'how-to-validate-a-business-idea',
    title: 'How to Validate a Business Idea in 7 Days (Without Quitting Your Job)',
    metaTitle: 'How to Validate a Business Idea in 7 Days (2026 Guide)',
    description:
      'A 7-day, evenings-and-weekends framework to validate a business idea before you build it. Real conversations, a fake-door test, and one paying pre-order — not a 40-page business plan.',
    excerpt:
      'Skip the 40-page business plan. Here is the exact 7-day framework solo founders use to validate an idea with real conversations, a fake-door test, and one paying pre-order — all in evenings and weekends.',
    publishedAt: '2026-06-18',
    readingMinutes: 9,
    author: { name: 'The SoloSuccess Team', url: '/about' },
    tags: ['validation', 'idea testing', 'solo founders'],
    faq: [
      {
        q: 'How long does it take to validate a business idea?',
        a: 'Most solo founders can run a meaningful validation sprint in 7 days of evenings and weekends — five customer conversations, a one-page landing test, and at least one signal of willingness to pay.',
      },
      {
        q: 'What counts as validation?',
        a: 'Strong signals of willingness to pay: a pre-order, a paid deposit, an LOI, or a waitlist with replies asking when they can buy. Survey "I would buy this" answers do not count.',
      },
      {
        q: 'Do I need to build an MVP to validate?',
        a: 'No. A fake-door landing page, a Figma click-through, or a manual concierge service is usually enough to test demand before writing a single line of product code.',
      },
      {
        q: 'How much should I spend on validation?',
        a: 'Under $100. A domain, a landing page builder (often free), and $20–$50 of ads to drive 200–500 visitors is enough to read a clear signal.',
      },
    ],
    body: HowToValidateBusinessIdeaBody,
  },
  {
    slug: 'online-courses-for-entrepreneurs',
    title: '10 Online Courses for Entrepreneurs: An Honest Review (2026)',
    metaTitle: '10 Best Online Courses for Entrepreneurs (2026 Review)',
    description:
      'An honest comparison of the top online courses for entrepreneurs in 2026 — Coursera, HBS, Udemy, LinkedIn Learning, and more. Find the right fit for solo founders.',
    excerpt:
      'Coursera, Harvard, MIT, YC, Udemy — and us. A no-affiliate, no-filler comparison of the 10 online courses most relevant to solo founders in 2026.',
    publishedAt: '2026-06-17',
    readingMinutes: 11,
    author: { name: 'The SoloSuccess Team', url: '/about' },
    tags: ['entrepreneurship', 'online courses', 'solo founders'],
    faq: [
      {
        q: "What's the best online course for entrepreneurs in 2026?",
        a: 'There is no single best — it depends on goals. For credibility, HBS Online. For free self-study, MIT OCW combined with YC Startup School. For solo founders building a one-person business, SoloSuccess Academy. For tactical micro-skills, Udemy.',
      },
      {
        q: 'Are online entrepreneurship courses worth it?',
        a: 'Yes — if you finish one and ship something. Under 10% of MOOC students finish. Pick the format that matches how you actually learn and gives you accountability.',
      },
      {
        q: 'How much should I spend on an online business course?',
        a: 'For most solo founders, $0–$70 per course is plenty. Anything over $500 should include 1:1 mentorship, a recognized credential, or a cohort of peers.',
      },
      {
        q: 'Can I start a business without taking a course?',
        a: 'Yes. Courses compress trial-and-error and give you frameworks for thinking, but they do not replace doing.',
      },
    ],
    body: OnlineCoursesForEntrepreneursBody,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/* ─────────────────────────────────────────────────────────────
   POST 2 — How to Validate a Business Idea in 7 Days
   ───────────────────────────────────────────────────────────── */
function HowToValidateBusinessIdeaBody() {
  return (
    <article className="max-w-3xl mx-auto">
      <P>
        Most "validation" advice tells you to write a 40-page business plan, run a SWOT analysis,
        and forecast five-year revenue. That's not validation. That's procrastination dressed up as
        rigor.
      </P>
      <P>
        Real validation is one thing: <strong>evidence that strangers will give you money for what
        you're proposing</strong> — before you've built it. Everything else is opinion.
      </P>
      <P>
        This is the exact 7-day sprint we teach inside{' '}
        <Link to="/courses" className="text-primary hover:underline">SoloSuccess Academy</Link>. It
        runs on evenings and weekends, costs under $100, and ends with either a paying pre-order or
        a clear "no" — so you can move on without spending six months building the wrong thing.
      </P>

      <H2 id="what-counts">First: what actually counts as validation?</H2>
      <P>
        Strong signals — what we're hunting for:
      </P>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4 marker:text-primary">
        <li>A pre-order or paid deposit.</li>
        <li>A signed letter of intent (B2B).</li>
        <li>A waitlist with unsolicited "when can I buy?" replies.</li>
        <li>Someone offering to pay you to do it manually, today.</li>
      </ul>
      <P>Weak signals — what doesn't count:</P>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4 marker:text-muted">
        <li>Survey answers of "yes, I'd buy this."</li>
        <li>Friends and family saying "great idea!"</li>
        <li>LinkedIn likes on your post about the idea.</li>
        <li>Email signups with no follow-up engagement.</li>
      </ul>
      <P>
        If you only get weak signals, you don't have validation — you have a polite audience.
      </P>

      <H2 id="day-by-day">The 7-day sprint</H2>

      <H3>Day 1 — Write the one-sentence offer</H3>
      <P>
        Before you talk to anyone, force yourself to write your idea in a single sentence using this
        template:
      </P>
      <p className="font-mono text-sm bg-card/60 border border-primary/20 rounded-md p-4 my-4 text-foreground">
        I help <span className="text-primary">[specific person]</span> achieve{' '}
        <span className="text-primary">[specific outcome]</span> by{' '}
        <span className="text-primary">[specific mechanism]</span> for{' '}
        <span className="text-primary">[specific price]</span>.
      </p>
      <P>
        Example: <em>"I help freelance designers fill their pipeline by sending them 5 vetted
        client leads per week for $99/month."</em> If you can't fill in all four blanks, you're not
        ready to validate — you're ready to think more.
      </P>

      <H3>Day 2 — List 20 real people who fit the description</H3>
      <P>
        Not "small business owners." Twenty specific humans by name, in LinkedIn or a spreadsheet,
        who would be the buyer. If you can't list 20, the niche is too vague or you don't know it
        well enough yet. Go narrower.
      </P>

      <H3>Day 3–4 — Five problem-discovery conversations</H3>
      <P>
        Reach out to the 20 with one ask: <em>"I'm researching how [your role] currently handles
        [problem]. Could I get 15 minutes of your time? Not selling anything."</em> Aim for five
        accepts. On the call, ask only about their <strong>current behavior</strong>:
      </P>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4 marker:text-primary">
        <li>"Walk me through the last time you faced [problem]."</li>
        <li>"What did you do? What tools? Who else was involved?"</li>
        <li>"What was frustrating about it? What did it cost you — time or money?"</li>
        <li>"Have you tried to solve it before? What happened?"</li>
      </ul>
      <P>
        Never pitch. Never describe your idea. If they ask, say "I'll show you next week." You're
        looking for one thing: <strong>do at least 3 of 5 describe a real, painful, recurring
        problem in their own words?</strong> If not, your sentence from Day 1 is wrong. Revise.
      </P>

      <H3>Day 5 — Build a one-page fake-door landing page</H3>
      <P>
        Use Carrd, Framer, or a single page in your favorite no-code tool. Include:
      </P>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4 marker:text-primary">
        <li>A headline that's your Day 1 sentence, rewritten as a benefit.</li>
        <li>Three bullets describing what they get.</li>
        <li>The price — visible, not "request a quote."</li>
        <li>
          A single call-to-action button: <strong>"Pre-order — pay $X now"</strong> (B2C) or{' '}
          <strong>"Reserve your spot"</strong> with a deposit link (B2B).
        </li>
      </ul>
      <P>
        Use Stripe Payment Links — 10 minutes to set up, no website code required. If a real card
        gets charged, that's a strong signal. If they click "Pre-order" and bounce when they see
        the Stripe page, that's still useful: the offer is interesting, the price isn't.
      </P>

      <H3>Day 6 — Drive 200–500 visitors</H3>
      <P>
        Pick one source — don't try all of them:
      </P>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4 marker:text-primary">
        <li>$20–$50 of Meta or Reddit ads targeted at your niche.</li>
        <li>One post in a relevant subreddit or Slack/Discord community (read the rules first).</li>
        <li>Direct DMs to the other 15 people on your Day 2 list.</li>
      </ul>
      <P>
        You're looking for a <strong>click-through to checkout of 3%+</strong> and at least one
        completed payment or deposit. No payments after 300+ targeted visitors is a clear "this
        offer doesn't work yet" signal — and that's a win, because you found out in a week instead
        of a year.
      </P>

      <H3>Day 7 — Read the signal and decide</H3>
      <P>Three possible outcomes:</P>
      <ul className="list-disc pl-6 space-y-3 text-muted-foreground mb-4 marker:text-primary">
        <li>
          <strong>Green light:</strong> 1+ paid pre-orders, or 3+ qualified LOIs. Refund anyone who
          asks, then start building the smallest version that delivers the promise. You have
          validation.
        </li>
        <li>
          <strong>Yellow light:</strong> Strong click-throughs but no payments. The audience cares
          about the problem but not at this price or framing. Rewrite the offer (different price,
          different mechanism, different audience) and run Day 5–7 again — one variable changed.
        </li>
        <li>
          <strong>Red light:</strong> Low traffic-to-page engagement, no payments. Either the
          audience isn't who you thought, or the problem isn't real enough to pay for. Go back to
          Day 1. This is not failure — this is the entire point of validation.
        </li>
      </ul>

      <H2 id="mistakes">The four mistakes that ruin validation sprints</H2>
      <ol className="list-decimal pl-6 space-y-3 text-muted-foreground mb-4 marker:text-primary">
        <li>
          <strong>Asking friends and family.</strong> They lie to be kind. Talk to strangers in your
          target market.
        </li>
        <li>
          <strong>Pitching instead of asking.</strong> You'll get false positives from people being
          polite about your idea instead of honest about their problem.
        </li>
        <li>
          <strong>Hiding the price.</strong> "Contact us for pricing" makes the test meaningless.
          The price is half of what you're validating.
        </li>
        <li>
          <strong>Building before validating.</strong> If you've written more than zero lines of
          product code by Day 7, you've moved the goalposts from "do they want it?" to "did I waste
          my weekend?"
        </li>
      </ol>

      <H2 id="faq">FAQ</H2>
      <div className="space-y-6">
        <div>
          <p className="font-semibold mb-1">How long does it take to validate a business idea?</p>
          <P>
            Most solo founders can run a meaningful validation sprint in 7 days of evenings and
            weekends — five conversations, a one-page landing test, and at least one signal of
            willingness to pay. Bigger B2B deals take longer; D2C usually doesn't.
          </P>
        </div>
        <div>
          <p className="font-semibold mb-1">What counts as validation?</p>
          <P>
            Pre-orders, deposits, LOIs, or a waitlist with unsolicited "when can I buy?" messages.
            Survey-style "I would buy this" answers don't count — humans overestimate their own
            future behavior dramatically.
          </P>
        </div>
        <div>
          <p className="font-semibold mb-1">Do I need to build an MVP to validate?</p>
          <P>
            No. A fake-door landing page, a Figma click-through, or a manual concierge service
            (where you deliver the outcome by hand) is usually enough to read demand before writing
            a line of product code.
          </P>
        </div>
        <div>
          <p className="font-semibold mb-1">How much should I spend on validation?</p>
          <P>
            Under $100. A domain, a free landing page builder, and $20–$50 of targeted ads is
            enough to drive 200–500 visitors and read a clear signal.
          </P>
        </div>
      </div>

      <div className="mt-12 p-6 rounded-lg border border-primary/30 bg-primary/5">
        <p className="font-display text-xl font-bold mb-2">Want the full validation playbook?</p>
        <p className="text-muted-foreground mb-4">
          Course 1 of SoloSuccess Academy walks you through this 7-day sprint with templates,
          scripts, and an AI tutor that reviews your offer line by line.
        </p>
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          See the curriculum →
        </Link>
      </div>
    </article>
  );
}