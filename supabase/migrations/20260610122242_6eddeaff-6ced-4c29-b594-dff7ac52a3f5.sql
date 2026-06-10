-- Two-step shift to avoid unique-constraint collisions
UPDATE public.lessons SET order_number = order_number + 1000
WHERE course_id = 'c13d40f5-cb40-4e7a-9814-2936e690da51' AND order_number >= 3;

UPDATE public.lessons SET order_number = order_number - 999
WHERE course_id = 'c13d40f5-cb40-4e7a-9814-2936e690da51' AND order_number >= 1003;

-- Rename + prepend reality check to the "$0 Budget Manifesto"
UPDATE public.lessons
SET title = 'The Lean Budget Manifesto',
    content = $$## Reality Check (2026 Update)

Let's be honest before we go any further: **"$0 budget" is a great way to start, but it is not a permanent operating model.** Modern solo businesses do run leaner than ever thanks to AI, free tiers, and no-code tools — but they are not actually free to run at scale.

Here's what a realistic budget looks like across the typical solo journey in 2026:

- **Pre-revenue (validating an idea):** ~$0–$20/month. Free tiers of Lovable, Supabase, Vercel, ChatGPT/Claude free, a domain name. That's it.
- **First paying customers (~$1K MRR):** ~$150–$250/month. Email sender (Resend/Postmark), a real AI plan ($20–$40), one paid SaaS, and maybe small ad tests.
- **Growing (~$10K MRR):** ~$800–$1,500/month. Paid ads, premium AI, support tools, accounting software, and at least one VA or contractor.
- **Established ($30K+ MRR):** $2K–$5K+/month, mostly people (contractors, fractional help) plus paid acquisition.

> **The honest principle:** start at $0 to prove the idea works. Reinvest revenue into tools and time-savers as you grow. Treat "$0 forever" as a marketing slogan, not a business plan.

The rest of this lesson teaches the *resourcefulness mindset* that makes the early $0 phase possible — those habits stay valuable long after you start spending money.

---

$$ || content
WHERE id = '213a2b9b-63b1-451d-8a05-dfaabc4005dc';

-- Insert the new realism lesson at position 3
INSERT INTO public.lessons (course_id, title, type, order_number, content, is_published)
VALUES (
  'c13d40f5-cb40-4e7a-9814-2936e690da51',
  'The 2026 Indie Income Reality',
  'text',
  3,
  $$## Why This Lesson Exists

The internet is full of solopreneur income screenshots. Most are either cherry-picked, peak months, gross revenue (not profit), or outright fiction. Before you build a business plan around someone else's highlight reel, here's what the data actually looks like for solo founders in 2026.

---

## Realistic Income Bands

Synthesized from public IndieHackers revenue boards, Stripe Atlas reports, MicroConf surveys, and the 2025–2026 "State of Independent SaaS" reports:

- **0–6 months in:** $0–$200/month is normal. Most solo projects make nothing in their first six months.
- **6–18 months in:** $200–$2,000/month is realistic for a focused founder with a real distribution channel.
- **2–4 years in:** $2K–$15K MRR is achievable for solo SaaS, info products, and productized services that have found a niche.
- **The long tail:** ~5–10% of serious solo founders reach $15K–$50K+ MRR. The "quit-your-job" milestone ($8K–$12K MRR after taxes/tools) typically takes 18–36 months of consistent shipping.

> **Median, not mean.** The average solo-founder revenue number you see online is dragged up by a tiny number of outliers. Median is what *most* people experience.

---

## What This Means for Your Plan

1. **Don't quit your day job at MVP launch.** Aim to replace 50% of your salary in monthly *profit* (not revenue) before going full-time.
2. **Build a runway, not a hope.** 6–12 months of saved expenses is the standard recommendation in 2026.
3. **Profit > revenue.** A $5K MRR business with $500/month costs beats a $15K MRR business with $14K/month costs.
4. **Compounding takes time.** Most "overnight" wins you read about are actually year 3–4 of consistent shipping.

---

## The Mindset Shift

This isn't meant to discourage you — it's meant to give you a *real* finish line so you can pace yourself. A solo business paying you $4K/month in profit while you work 25 hours a week from anywhere is genuinely life-changing, and statistically far more attainable than the "$1M solopreneur" archetype.

We'll revisit these numbers in Course 7 ("Bootstrap Your Business on a Lean Budget") and again in Course 9 when we talk about scale.
$$,
  true
);