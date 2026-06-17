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