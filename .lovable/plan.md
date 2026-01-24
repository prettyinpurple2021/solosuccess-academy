
# Plan: Seed All Courses and Lessons for SoloSuccess Academy

## Overview

All 10 courses already exist in the database and are published. This plan will populate each course with its complete lesson structure based on your curriculum. We'll create **74 total lessons** across 10 courses, properly categorized by lesson type.

---

## Current State

| Course # | Title | Phase | Course ID | Status |
|----------|-------|-------|-----------|--------|
| 1 | The Solo Singularity | initialization | c13d40f5-cb40-4e7a-9814-2936e690da51 | Published, 0 lessons |
| 2 | Signal in the Noise | initialization | 6006c8d3-0af8-4725-bbc9-d8615036f987 | Published, 0 lessons |
| 3 | Neon Identity | initialization | 55697b91-b21a-4574-8134-e252c914ae88 | Published, 0 lessons |
| 4 | The Ghost Machine | orchestration | 61ae9cd4-a735-44cc-ae7d-57be4546abac | Published, 0 lessons |
| 5 | The Infinite Loop | orchestration | e1ebab59-e163-4876-a51b-3288a140504e | Published, 0 lessons |
| 6 | Digital Gravity | orchestration | 3f9f583e-6166-4b36-9c13-4df137a94f2e | Published, 0 lessons |
| 7 | Zero-Point Energy | orchestration | c7989fd2-afdb-410f-bd6d-15c8ff57d745 | Published, 0 lessons |
| 8 | The Neuro-Link | launch | 2cddde3a-77bc-4ced-9a23-dc06e4bff296 | Published, 0 lessons |
| 9 | Future State | launch | 3f327e10-9968-4a0a-bcdc-bcd9a6dbb462 | Published, 0 lessons |
| 10 | The Final Transmission | launch | 91192f0e-3f15-4880-bfda-38d7ebfa1362 | Published, 0 lessons |

---

## Implementation Approach

I'll create a **curriculum seed utility** that will:
1. Define all lesson data in a structured format
2. Bulk insert lessons using the Supabase client
3. Map lesson types correctly (text, video, quiz, assignment, worksheet, activity)

### Lesson Type Mapping

Based on your curriculum, lessons will be categorized as:

| Curriculum Description | Database Type |
|------------------------|---------------|
| Regular lessons (tutorials, guides) | `text` |
| Quiz / Assessment / Exam | `quiz` |
| Assignment / Exercise | `assignment` |
| Setup / Walkthrough (hands-on) | `activity` |

---

## Phase 1: Initialization Courses (Lessons 1-22)

### Course 1: The Solo Singularity – Mindset & Vision (7 lessons)

| Order | Title | Type | Description |
|-------|-------|------|-------------|
| 1 | The "Company of One" Philosophy | text | Why you don't need a co-founder or VC funding. The math behind high-margin, low-stress solo businesses. |
| 2 | The $0 Budget Manifesto | text | How to view "resourcefulness" as your primary currency. Introduction to "Vibe Coding" and AI leverage. |
| 3 | Inventorying Your "Unfair Advantage" | text | A guided audit to find unique skills and assets you possess that competitors can't copy. |
| 4 | The Myth of the MVP | text | Why "Minimum" doesn't mean "Broken." Redefining MVP as the "Maximum Value Product" you can ship in 48 hours. |
| 5 | Time Hacking for the Solo Founder | text | Mastering the "4-Hour Focus" technique to get more done in a morning than most teams do in a week. |
| 6 | Setup: The Vision Board Protocol | activity | Walkthrough of setting up the provided Notion Template to track your long-term goals. |
| 7 | Quiz – The Founder Type Assessment | quiz | A graded assessment to identify your entrepreneurial style (Builder, Seller, or Orchestrator). |

### Course 2: Signal in the Noise – AI Market Intelligence (7 lessons)

| Order | Title | Type | Description |
|-------|-------|------|-------------|
| 1 | Introduction to Social Listening | text | How to use Reddit, X, and Discord to eavesdrop on your customers' complaints before building. |
| 2 | The AI Scraper Agent | text | Tutorial on using free AI web scrapers to gather data on what's selling in your niche. |
| 3 | Validating Without Building | text | Techniques to test if people will pay using "Smoke Tests" and landing pages. |
| 4 | The "Blue Ocean" Detection Method | text | How to spot gaps in the market where competition is irrelevant. |
| 5 | Generating AI User Personas | text | Prompt engineering guide to create a "Virtual Customer" you can chat with. |
| 6 | Assignment – The 10-Idea Sprint | assignment | Rapid-fire exercise to generate 10 business ideas and filter to the single best one. |
| 7 | Quiz – Market Viability Check | quiz | A pass/fail checklist to ensure you aren't building a product nobody wants. |

### Course 3: Neon Identity – AI-Powered Branding (8 lessons)

| Order | Title | Type | Description |
|-------|-------|------|-------------|
| 1 | Color Psychology & Cyberpunk Aesthetics | text | How to choose colors that trigger specific emotions using the "SoloSuccess" neon palette. |
| 2 | AI Logo Generation Workshop | text | Step-by-step guide to using Midjourney/DALL-E to create pro-level logos for free. |
| 3 | Establishing Brand Voice | text | How to teach ChatGPT to write like you so all your marketing sounds consistent. |
| 4 | Typography That Converts | text | Selecting the right fonts for readability and style without expensive licenses. |
| 5 | Building the Visual Language | text | Creating a cohesive "look and feel" across website, social media, and emails. |
| 6 | Assignment – The "3-Second Rule" Test | assignment | Create a header image and test if a stranger can understand your business in 3 seconds. |
| 7 | Trust Signals & Social Proof | text | How to design badges, testimonials, and "As Seen On" banners to build credibility. |
| 8 | Quiz – Design Principles 101 | quiz | Test your eye for design on spacing, contrast, and hierarchy. |

---

## Phase 2: Orchestration Courses (Lessons 23-56)

### Course 4: The Ghost Machine – Workflow Automation (9 lessons)

| Order | Title | Type | Description |
|-------|-------|------|-------------|
| 1 | Introduction to No-Code Automation | text | The basics of connecting apps (Zapier/Make) so data moves automatically. |
| 2 | The Unified Inbox System | text | How to funnel emails, DMs, and support tickets into one place. |
| 3 | Automating Your Calendar | text | Setting up auto-scheduling links so you never ask "What time works?" again. |
| 4 | Building a Free CRM | text | Using Notion or Airtable to track every customer interaction without Salesforce. |
| 5 | The "If This, Then That" Logic | text | Mapping out complex logic trees to handle customer requests automatically. |
| 6 | Assignment – Map Your First Workflow | assignment | Draw a diagram of your first automated process and share for feedback. |
| 7 | Automating Customer Onboarding | text | How to deliver your product and welcome emails instantly after purchase. |
| 8 | Troubleshooting the Machine | text | What to do when your automations break (and how to fix them quickly). |
| 9 | Quiz – Logic & Efficiency | quiz | Scenarios to test if you can identify the most efficient way to automate. |

### Course 5: The Infinite Loop – The Content Multiplier (8 lessons)

| Order | Title | Type | Description |
|-------|-------|------|-------------|
| 1 | The "Pillar Content" Strategy | text | How to focus on creating one high-quality piece of content per week. |
| 2 | AI Repurposing Workflows | text | Using AI to slice your Pillar Content into tweets, shorts, LinkedIn posts, and emails. |
| 3 | Designing Templates for Speed | text | Creating Canva templates so you just drag-and-drop text. |
| 4 | Automated Scheduling | text | Setting up tools to post your content at optimal times automatically. |
| 5 | Writing Hooks That Stop the Scroll | text | The psychology of the "first 3 seconds" and how to write headlines that force clicks. |
| 6 | Assignment – The "1-Hour Month" Challenge | assignment | Plan and schedule an entire month of content in a single 1-hour sitting. |
| 7 | Analytics: Measuring What Matters | text | Which metrics lead to money (Clicks/Conversions) vs. vanity metrics (Likes). |
| 8 | Quiz – Platform Algorithms | quiz | Test your knowledge on what different social platforms prioritize in 2026. |

### Course 6: Digital Gravity – Attracting Your Audience (7 lessons)

| Order | Title | Type | Description |
|-------|-------|------|-------------|
| 1 | Traffic vs. Audience | text | Understanding the difference between renting eyes (Ads) and owning them (Email List). |
| 2 | Creating Irresistible Lead Magnets | text | How to build a free tool or guide so good people feel guilty they didn't pay. |
| 3 | Building Your First Email List | text | Technical setup of a newsletter and how to get your first 100 subscribers. |
| 4 | Cold Outreach That Feels Warm | text | How to DM potential partners or clients without sounding like a spam bot. |
| 5 | Assignment – Draft Your Welcome Sequence | assignment | Write the first 3 emails a new subscriber receives to turn them into a fan. |
| 6 | SEO Basics for the Solo Founder | text | Simple tweaks to your website to make Google send you free traffic. |
| 7 | Quiz – Funnel Mechanics | quiz | Diagnose a "broken" funnel and identify where the customers are dropping off. |

### Course 7: Zero-Point Energy – Financial Bootstrapping (6 lessons)

| Order | Title | Type | Description |
|-------|-------|------|-------------|
| 1 | The "Profit First" Mindset | text | Solo business accounting—ensuring you get paid before expenses eat your cash. |
| 2 | The Art of the Barter | text | How to trade your skills for services you need (e.g., coding for legal advice). |
| 3 | The Free-Tier Tech Stack | text | Curated list of best free software for startups (and when to switch to paid). |
| 4 | Pricing Your Services | text | How to calculate your hourly worth and price for sustainability, not cheapness. |
| 5 | Assignment – The Expense Audit | assignment | Review current spending and cut $100/month of useless subscriptions. |
| 6 | Quiz – Financial Literacy | quiz | Real-world math problems involving margins, churn, and burn rate. |

---

## Phase 3: Launch Sequence Courses (Lessons 57-74)

### Course 8: The Neuro-Link – Psychology of Sales (8 lessons)

| Order | Title | Type | Description |
|-------|-------|------|-------------|
| 1 | Reframing Sales | text | Changing your mindset from "taking money" to "solving problems." |
| 2 | The Psychology of "No" | text | Why people say no (fear, confusion, timing) and how to address each one. |
| 3 | Copywriting Frameworks (AIDA) | text | Learning the Attention-Interest-Desire-Action formula for sales pages. |
| 4 | Handling Objections | text | Pre-writing answers to "It's too expensive" or "I don't have time." |
| 5 | Assignment – The Offer Rewrite | assignment | Take a boring product description and rewrite it using persuasion techniques. |
| 6 | The Follow-Up Protocol | text | How to follow up with leads without being annoying (the "magic email" script). |
| 7 | Closing: Contracts & Invoices | text | The mechanics of actually getting money into your bank account. |
| 8 | Quiz – Persuasion Tactics | quiz | Identify which psychological trigger is being used in sales examples. |

### Course 9: Future State – Strategic Roadmapping (7 lessons)

| Order | Title | Type | Description |
|-------|-------|------|-------------|
| 1 | Setting OKRs (Objectives & Key Results) | text | How to set goals that are ambitious but measurable (e.g., "Hit $5k MRR"). |
| 2 | Pivot vs. Persevere | text | A decision matrix to help you know when to quit or double down. |
| 3 | Scaling: When to Spend Money | text | Identifying the exact moment to hire a freelancer or pay for ads. |
| 4 | Risk Management & Backups | text | Protecting your digital assets—backups, security, and owning your platform. |
| 5 | Assignment – The "Pre-Mortem" | assignment | Write a story about how your business failed in 2027, then prevent it today. |
| 6 | Continuous Learning | text | How to stay ahead of AI trends so your business doesn't become obsolete. |
| 7 | Quiz – Strategic Thinking | quiz | Strategy scenarios where you must choose the best long-term move. |

### Course 10: The Final Transmission – Storytelling & Pitch (11 lessons)

| Order | Title | Type | Description |
|-------|-------|------|-------------|
| 1 | The Hero's Journey Structure | text | How to structure your pitch so you are the guide and the customer is the hero. |
| 2 | Data Visualization | text | Making your numbers look sexy and easy to understand on slides. |
| 3 | Slide Design for Non-Designers | text | Rules for font size, images, and bullet points for professional decks. |
| 4 | Public Speaking Presence | text | Tips for lighting, audio, and camera eye contact for your recorded pitch. |
| 5 | The "Ask" | text | Clearly defining what you want from the viewer (Invest? Buy? Join?). |
| 6 | Portfolio Assembly | text | Step-by-step guide to linking Projects 1–9 into your final portfolio website. |
| 7 | Assignment – The Elevator Pitch | assignment | Record a 30-second version of your pitch. |
| 8 | Tech Setup: Recording | text | How to use free software (OBS/Loom) to record high-quality presentations. |
| 9 | Editing Your Pitch | text | Basic cuts and transitions to make your video flow smoothly. |
| 10 | Hosting & Sharing | text | Where to upload your portfolio for maximum visibility. |
| 11 | Final Exam – The Solo Founder Certification | quiz | Comprehensive exam covering key concepts from all 10 courses. |

---

## Technical Implementation

### File to Create

**`src/lib/curriculumData.ts`** - Contains all lesson definitions as a typed data structure

### Seeding Approach

I'll create an admin utility page or button that:
1. Reads all course IDs from the database
2. Matches them with the curriculum data
3. Bulk inserts all lessons for each course
4. Sets all lessons as `is_published: true` by default

### Code Structure

```text
src/lib/curriculumData.ts
├── Interface definitions for curriculum structure
├── Phase 1 courses array (3 courses, 22 lessons)
├── Phase 2 courses array (4 courses, 30 lessons)
├── Phase 3 courses array (3 courses, 22 lessons)
└── Helper function to get lessons by course title
```

---

## Summary

| Phase | Courses | Total Lessons |
|-------|---------|---------------|
| Initialization | 3 | 22 |
| Orchestration | 4 | 30 |
| Launch | 3 | 22 |
| **Total** | **10** | **74** |

### Lesson Type Distribution

| Type | Count | Description |
|------|-------|-------------|
| text | 52 | Regular instructional lessons |
| quiz | 10 | Assessments and exams |
| assignment | 10 | Hands-on exercises |
| activity | 2 | Interactive walkthroughs |

---

## Files to Create/Modify

1. **Create**: `src/lib/curriculumData.ts` - Structured curriculum data
2. **Modify**: `src/pages/AdminDashboard.tsx` - Add "Seed Curriculum" button
3. **Create**: `src/components/admin/SeedCurriculumButton.tsx` - Admin utility to bulk insert lessons

All lessons will be inserted with their descriptions as content placeholders, ready for future expansion with full lesson content, videos, and interactive elements.
