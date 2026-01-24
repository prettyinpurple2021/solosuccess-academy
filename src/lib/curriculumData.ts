// Complete curriculum data for SoloSuccess Academy
// This file contains all lesson definitions for the 10 courses

export type LessonType = 'text' | 'video' | 'quiz' | 'assignment' | 'worksheet' | 'activity';

export interface CurriculumLesson {
  title: string;
  type: LessonType;
  content: string; // Description serves as content placeholder
}

export interface CurriculumCourse {
  title: string;
  courseId: string;
  phase: 'initialization' | 'orchestration' | 'launch';
  lessons: CurriculumLesson[];
}

// Course ID mapping based on existing database
const COURSE_IDS = {
  'The Solo Singularity – Mindset & Vision': 'c13d40f5-cb40-4e7a-9814-2936e690da51',
  'Signal in the Noise – AI Market Intelligence': '6006c8d3-0af8-4725-bbc9-d8615036f987',
  'Neon Identity – AI-Powered Branding': '55697b91-b21a-4574-8134-e252c914ae88',
  'The Ghost Machine – Workflow Automation': '61ae9cd4-a735-44cc-ae7d-57be4546abac',
  'The Infinite Loop – The Content Multiplier': 'e1ebab59-e163-4876-a51b-3288a140504e',
  'Digital Gravity – Attracting Your Audience': '3f9f583e-6166-4b36-9c13-4df137a94f2e',
  'Zero-Point Energy – Financial Bootstrapping': 'c7989fd2-afdb-410f-bd6d-15c8ff57d745',
  'The Neuro-Link – Psychology of Sales': '2cddde3a-77bc-4ced-9a23-dc06e4bff296',
  'Future State – Strategic Roadmapping': '3f327e10-9968-4a0a-bcdc-bcd9a6dbb462',
  'The Final Transmission – Storytelling & Pitch': '91192f0e-3f15-4880-bfda-38d7ebfa1362',
} as const;

// ============================================================================
// PHASE 1: INITIALIZATION (Identity & Intel)
// ============================================================================

const course1: CurriculumCourse = {
  title: 'The Solo Singularity – Mindset & Vision',
  courseId: COURSE_IDS['The Solo Singularity – Mindset & Vision'],
  phase: 'initialization',
  lessons: [
    {
      title: 'The "Company of One" Philosophy',
      type: 'text',
      content: 'Why you don\'t need a co-founder or VC funding. We explore the math behind high-margin, low-stress solo businesses.',
    },
    {
      title: 'The $0 Budget Manifesto',
      type: 'text',
      content: 'How to view "resourcefulness" as your primary currency. We introduce the concept of "Vibe Coding" and AI leverage.',
    },
    {
      title: 'Inventorying Your "Unfair Advantage"',
      type: 'text',
      content: 'A guided audit to find the unique skills and assets you already possess that competitors can\'t copy.',
    },
    {
      title: 'The Myth of the MVP',
      type: 'text',
      content: 'Why "Minimum" doesn\'t mean "Broken." We redefine the MVP as the "Maximum Value Product" you can ship in 48 hours.',
    },
    {
      title: 'Time Hacking for the Solo Founder',
      type: 'text',
      content: 'Mastering the "4-Hour Focus" technique to get more done in a morning than most teams do in a week.',
    },
    {
      title: 'Setup: The Vision Board Protocol',
      type: 'activity',
      content: 'Walkthrough of setting up the provided Notion Template to track your long-term goals.',
    },
    {
      title: 'Quiz – The Founder Type Assessment',
      type: 'quiz',
      content: 'A graded assessment to identify your specific entrepreneurial style (Builder, Seller, or Orchestrator).',
    },
  ],
};

const course2: CurriculumCourse = {
  title: 'Signal in the Noise – AI Market Intelligence',
  courseId: COURSE_IDS['Signal in the Noise – AI Market Intelligence'],
  phase: 'initialization',
  lessons: [
    {
      title: 'Introduction to Social Listening',
      type: 'text',
      content: 'How to use Reddit, X, and Discord to eavesdrop on your customers\' complaints before you ever build a product.',
    },
    {
      title: 'The AI Scraper Agent',
      type: 'text',
      content: 'A tutorial on using free AI web scrapers to gather data on what is already selling in your niche.',
    },
    {
      title: 'Validating Without Building',
      type: 'text',
      content: 'Techniques to test if people will pay for your idea using simple "Smoke Tests" and landing pages.',
    },
    {
      title: 'The "Blue Ocean" Detection Method',
      type: 'text',
      content: 'How to spot gaps in the market where competition is irrelevant because you are so unique.',
    },
    {
      title: 'Generating AI User Personas',
      type: 'text',
      content: 'Prompt engineering guide to create a "Virtual Customer" you can chat with to test your ideas.',
    },
    {
      title: 'Assignment – The 10-Idea Sprint',
      type: 'assignment',
      content: 'A rapid-fire exercise to generate 10 business ideas and filter them down to the single best one.',
    },
    {
      title: 'Quiz – Market Viability Check',
      type: 'quiz',
      content: 'A pass/fail checklist to ensure you aren\'t building a product nobody wants.',
    },
  ],
};

const course3: CurriculumCourse = {
  title: 'Neon Identity – AI-Powered Branding',
  courseId: COURSE_IDS['Neon Identity – AI-Powered Branding'],
  phase: 'initialization',
  lessons: [
    {
      title: 'Color Psychology & Cyberpunk Aesthetics',
      type: 'text',
      content: 'How to choose colors that trigger specific emotions (trust, excitement, luxury) using the "SoloSuccess" neon palette as a case study.',
    },
    {
      title: 'AI Logo Generation Workshop',
      type: 'text',
      content: 'Step-by-step guide to using Midjourney/DALL-E to create pro-level logos for free.',
    },
    {
      title: 'Establishing Brand Voice',
      type: 'text',
      content: 'How to teach ChatGPT to write like you so all your marketing sounds consistent.',
    },
    {
      title: 'Typography That Converts',
      type: 'text',
      content: 'Selecting the right fonts for readability and style without paying for expensive licenses.',
    },
    {
      title: 'Building the Visual Language',
      type: 'text',
      content: 'Creating a cohesive "look and feel" across your website, social media, and emails.',
    },
    {
      title: 'Assignment – The "3-Second Rule" Test',
      type: 'assignment',
      content: 'Create a header image and test if a stranger can understand your business in 3 seconds.',
    },
    {
      title: 'Trust Signals & Social Proof',
      type: 'text',
      content: 'How to design badges, testimonials, and "As Seen On" banners to build credibility from day one.',
    },
    {
      title: 'Quiz – Design Principles 101',
      type: 'quiz',
      content: 'Test your eye for design on spacing, contrast, and hierarchy.',
    },
  ],
};

// ============================================================================
// PHASE 2: ORCHESTRATION (Building the Machine)
// ============================================================================

const course4: CurriculumCourse = {
  title: 'The Ghost Machine – Workflow Automation',
  courseId: COURSE_IDS['The Ghost Machine – Workflow Automation'],
  phase: 'orchestration',
  lessons: [
    {
      title: 'Introduction to No-Code Automation',
      type: 'text',
      content: 'The basics of connecting apps (Zapier/Make) so data moves automatically.',
    },
    {
      title: 'The Unified Inbox System',
      type: 'text',
      content: 'How to funnel emails, DMs, and support tickets into one place so you never miss a lead.',
    },
    {
      title: 'Automating Your Calendar',
      type: 'text',
      content: 'Setting up auto-scheduling links so you never have to ask "What time works for you?" again.',
    },
    {
      title: 'Building a Free CRM',
      type: 'text',
      content: 'Using Notion or Airtable to track every customer interaction without paying for Salesforce.',
    },
    {
      title: 'The "If This, Then That" Logic',
      type: 'text',
      content: 'Mapping out complex logic trees to handle customer requests automatically.',
    },
    {
      title: 'Assignment – Map Your First Workflow',
      type: 'assignment',
      content: 'Draw a diagram of your first automated process and share it for feedback.',
    },
    {
      title: 'Automating Customer Onboarding',
      type: 'text',
      content: 'How to deliver your product and welcome emails instantly after purchase.',
    },
    {
      title: 'Troubleshooting the Machine',
      type: 'text',
      content: 'What to do when your automations break (and how to fix them quickly).',
    },
    {
      title: 'Quiz – Logic & Efficiency',
      type: 'quiz',
      content: 'Scenarios to test if you can identify the most efficient way to automate a task.',
    },
  ],
};

const course5: CurriculumCourse = {
  title: 'The Infinite Loop – The Content Multiplier',
  courseId: COURSE_IDS['The Infinite Loop – The Content Multiplier'],
  phase: 'orchestration',
  lessons: [
    {
      title: 'The "Pillar Content" Strategy',
      type: 'text',
      content: 'How to focus on creating one high-quality piece of content per week (Video or Blog).',
    },
    {
      title: 'AI Repurposing Workflows',
      type: 'text',
      content: 'Using AI to slice your Pillar Content into tweets, shorts, LinkedIn posts, and emails.',
    },
    {
      title: 'Designing Templates for Speed',
      type: 'text',
      content: 'Creating Canva templates so you just drag-and-drop text instead of designing from scratch.',
    },
    {
      title: 'Automated Scheduling',
      type: 'text',
      content: 'Setting up tools to post your content at optimal times across all platforms automatically.',
    },
    {
      title: 'Writing Hooks That Stop the Scroll',
      type: 'text',
      content: 'The psychology of the "first 3 seconds" and how to write headlines that force clicks.',
    },
    {
      title: 'Assignment – The "1-Hour Month" Challenge',
      type: 'assignment',
      content: 'Plan and schedule an entire month of content in a single 1-hour sitting.',
    },
    {
      title: 'Analytics: Measuring What Matters',
      type: 'text',
      content: 'Which metrics actually lead to money (Clicks/Conversions) vs. vanity metrics (Likes).',
    },
    {
      title: 'Quiz – Platform Algorithms',
      type: 'quiz',
      content: 'Test your knowledge on what different social platforms prioritize in 2026.',
    },
  ],
};

const course6: CurriculumCourse = {
  title: 'Digital Gravity – Attracting Your Audience',
  courseId: COURSE_IDS['Digital Gravity – Attracting Your Audience'],
  phase: 'orchestration',
  lessons: [
    {
      title: 'Traffic vs. Audience',
      type: 'text',
      content: 'Understanding the difference between renting eyes (Ads) and owning them (Email List).',
    },
    {
      title: 'Creating Irresistible Lead Magnets',
      type: 'text',
      content: 'How to build a free tool or guide that is so good people feel guilty they didn\'t pay for it.',
    },
    {
      title: 'Building Your First Email List',
      type: 'text',
      content: 'Technical setup of a newsletter and how to get your first 100 subscribers.',
    },
    {
      title: 'Cold Outreach That Feels Warm',
      type: 'text',
      content: 'How to DM potential partners or clients without sounding like a spam bot.',
    },
    {
      title: 'Assignment – Draft Your Welcome Sequence',
      type: 'assignment',
      content: 'Write the first 3 emails a new subscriber receives to turn them into a fan.',
    },
    {
      title: 'SEO Basics for the Solo Founder',
      type: 'text',
      content: 'Simple tweaks to your website to make Google send you free traffic.',
    },
    {
      title: 'Quiz – Funnel Mechanics',
      type: 'quiz',
      content: 'Diagnose a "broken" funnel and identify where the customers are dropping off.',
    },
  ],
};

const course7: CurriculumCourse = {
  title: 'Zero-Point Energy – Financial Bootstrapping',
  courseId: COURSE_IDS['Zero-Point Energy – Financial Bootstrapping'],
  phase: 'orchestration',
  lessons: [
    {
      title: 'The "Profit First" Mindset',
      type: 'text',
      content: 'A crash course in solo business accounting—ensuring you get paid before expenses eat your cash.',
    },
    {
      title: 'The Art of the Barter',
      type: 'text',
      content: 'How to trade your skills for services you need (e.g., trading coding for legal advice).',
    },
    {
      title: 'The Free-Tier Tech Stack',
      type: 'text',
      content: 'A curated list of the best software that is free for startups (and when to switch to paid).',
    },
    {
      title: 'Pricing Your Services',
      type: 'text',
      content: 'How to calculate your hourly worth and price your products for sustainability, not just cheapness.',
    },
    {
      title: 'Assignment – The Expense Audit',
      type: 'assignment',
      content: 'Review your current spending and cut $100/month of useless subscriptions.',
    },
    {
      title: 'Quiz – Financial Literacy',
      type: 'quiz',
      content: 'Real-world math problems involving margins, churn, and burn rate.',
    },
  ],
};

// ============================================================================
// PHASE 3: LAUNCH SEQUENCE (Sales & Future)
// ============================================================================

const course8: CurriculumCourse = {
  title: 'The Neuro-Link – Psychology of Sales',
  courseId: COURSE_IDS['The Neuro-Link – Psychology of Sales'],
  phase: 'launch',
  lessons: [
    {
      title: 'Reframing Sales',
      type: 'text',
      content: 'Changing your mindset from "taking money" to "solving problems."',
    },
    {
      title: 'The Psychology of "No"',
      type: 'text',
      content: 'Why people say no (fear, confusion, timing) and how to address each one.',
    },
    {
      title: 'Copywriting Frameworks (AIDA)',
      type: 'text',
      content: 'Learning the Attention-Interest-Desire-Action formula to write sales pages that convert.',
    },
    {
      title: 'Handling Objections',
      type: 'text',
      content: 'Pre-writing answers to common concerns like "It\'s too expensive" or "I don\'t have time."',
    },
    {
      title: 'Assignment – The Offer Rewrite',
      type: 'assignment',
      content: 'Take a boring product description and rewrite it using the persuasion techniques learned.',
    },
    {
      title: 'The Follow-Up Protocol',
      type: 'text',
      content: 'How to follow up with leads without being annoying (the "magic email" script).',
    },
    {
      title: 'Closing: Contracts & Invoices',
      type: 'text',
      content: 'The boring but necessary mechanics of actually getting money into your bank account.',
    },
    {
      title: 'Quiz – Persuasion Tactics',
      type: 'quiz',
      content: 'Identify which psychological trigger is being used in various sales examples.',
    },
  ],
};

const course9: CurriculumCourse = {
  title: 'Future State – Strategic Roadmapping',
  courseId: COURSE_IDS['Future State – Strategic Roadmapping'],
  phase: 'launch',
  lessons: [
    {
      title: 'Setting OKRs (Objectives & Key Results)',
      type: 'text',
      content: 'How to set goals that are ambitious but measurable (e.g., "Hit $5k MRR," not "Get rich").',
    },
    {
      title: 'Pivot vs. Persevere',
      type: 'text',
      content: 'A decision matrix to help you know when to quit a failing idea or double down on a hard one.',
    },
    {
      title: 'Scaling: When to Spend Money',
      type: 'text',
      content: 'Identifying the exact moment you should hire a freelancer or pay for ads.',
    },
    {
      title: 'Risk Management & Backups',
      type: 'text',
      content: 'Protecting your digital assets—backups, security, and owning your own platform.',
    },
    {
      title: 'Assignment – The "Pre-Mortem"',
      type: 'assignment',
      content: 'Write a story about how your business failed in 2027, then work backward to prevent it today.',
    },
    {
      title: 'Continuous Learning',
      type: 'text',
      content: 'How to stay ahead of AI trends so your business doesn\'t become obsolete.',
    },
    {
      title: 'Quiz – Strategic Thinking',
      type: 'quiz',
      content: 'Strategy scenarios where you must choose the best long-term move.',
    },
  ],
};

const course10: CurriculumCourse = {
  title: 'The Final Transmission – Storytelling & Pitch',
  courseId: COURSE_IDS['The Final Transmission – Storytelling & Pitch'],
  phase: 'launch',
  lessons: [
    {
      title: 'The Hero\'s Journey Structure',
      type: 'text',
      content: 'How to structure your pitch so you are the guide and the customer is the hero.',
    },
    {
      title: 'Data Visualization',
      type: 'text',
      content: 'Making your numbers (growth, users, revenue) look sexy and easy to understand on slides.',
    },
    {
      title: 'Slide Design for Non-Designers',
      type: 'text',
      content: 'Rules for font size, images, and bullet points so your deck looks professional.',
    },
    {
      title: 'Public Speaking Presence',
      type: 'text',
      content: 'Tips for lighting, audio, and camera eye contact for your recorded pitch.',
    },
    {
      title: 'The "Ask"',
      type: 'text',
      content: 'Clearly defining what you want from the viewer (Invest? Buy? Join?).',
    },
    {
      title: 'Portfolio Assembly',
      type: 'text',
      content: 'Step-by-step guide to linking Projects 1–9 into your final portfolio website.',
    },
    {
      title: 'Assignment – The Elevator Pitch',
      type: 'assignment',
      content: 'Record a 30-second version of your pitch.',
    },
    {
      title: 'Tech Setup: Recording',
      type: 'text',
      content: 'How to use free software (OBS/Loom) to record a high-quality presentation.',
    },
    {
      title: 'Editing Your Pitch',
      type: 'text',
      content: 'Basic cuts and transitions to make your video flow smoothly.',
    },
    {
      title: 'Hosting & Sharing',
      type: 'text',
      content: 'Where to upload your portfolio for maximum visibility.',
    },
    {
      title: 'Final Exam – The Solo Founder Certification',
      type: 'quiz',
      content: 'A comprehensive exam covering key concepts from all 10 courses. (Prerequisite for graduation).',
    },
  ],
};

// ============================================================================
// EXPORTED DATA
// ============================================================================

export const curriculumCourses: CurriculumCourse[] = [
  // Phase 1: Initialization
  course1,
  course2,
  course3,
  // Phase 2: Orchestration
  course4,
  course5,
  course6,
  course7,
  // Phase 3: Launch
  course8,
  course9,
  course10,
];

// Helper to get lessons by course ID
export function getLessonsByCourseId(courseId: string): CurriculumLesson[] | undefined {
  const course = curriculumCourses.find(c => c.courseId === courseId);
  return course?.lessons;
}

// Get course by ID
export function getCurriculumCourse(courseId: string): CurriculumCourse | undefined {
  return curriculumCourses.find(c => c.courseId === courseId);
}

// Get all course IDs
export function getAllCourseIds(): string[] {
  return curriculumCourses.map(c => c.courseId);
}

// Summary stats
export const curriculumStats = {
  totalCourses: curriculumCourses.length,
  totalLessons: curriculumCourses.reduce((sum, c) => sum + c.lessons.length, 0),
  byPhase: {
    initialization: curriculumCourses.filter(c => c.phase === 'initialization').reduce((sum, c) => sum + c.lessons.length, 0),
    orchestration: curriculumCourses.filter(c => c.phase === 'orchestration').reduce((sum, c) => sum + c.lessons.length, 0),
    launch: curriculumCourses.filter(c => c.phase === 'launch').reduce((sum, c) => sum + c.lessons.length, 0),
  },
  byType: {
    text: curriculumCourses.flatMap(c => c.lessons).filter(l => l.type === 'text').length,
    quiz: curriculumCourses.flatMap(c => c.lessons).filter(l => l.type === 'quiz').length,
    assignment: curriculumCourses.flatMap(c => c.lessons).filter(l => l.type === 'assignment').length,
    activity: curriculumCourses.flatMap(c => c.lessons).filter(l => l.type === 'activity').length,
  },
};
