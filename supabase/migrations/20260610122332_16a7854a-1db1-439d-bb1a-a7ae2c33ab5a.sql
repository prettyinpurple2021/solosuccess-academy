-- Shift the quiz (position 9) out of the way using high offset
UPDATE public.lessons SET order_number = order_number + 1000
WHERE course_id = '61ae9cd4-a735-44cc-ae7d-57be4546abac' AND order_number >= 9;

-- Insert two new lessons at positions 9 and 10
INSERT INTO public.lessons (course_id, title, type, order_number, content, is_published)
VALUES
(
  '61ae9cd4-a735-44cc-ae7d-57be4546abac',
  'AI Agents: Beyond If-This-Then-That (2026)',
  'text',
  9,
  $$## From Workflows to Agents

Earlier in this course we built **deterministic workflows** with no-code tools like Zapier and Make: *"When X happens, do Y."* Those still matter — they're cheap, reliable, and easy to debug. But by 2026, the frontier has moved. We now have **autonomous AI agents** that can make decisions, use tools, and complete multi-step goals without explicit branches for every scenario.

The mental model shift:

- **Workflow:** You define every step. The tool follows orders.
- **Agent:** You define a goal and a set of tools. The agent figures out the steps.

---

## The 2026 Agent Stack for Solo Founders

### 1. Coding Agents — Claude Code & Cursor
- **Claude Code** (Anthropic): runs in your terminal, can read/write files, run commands, and ship features end-to-end. Best for refactors, bug fixes, and small features.
- **Cursor Agents** (background mode): assigns tickets to AI in the background; opens pull requests for you to review.
- **Use case for solos:** ship a feature in 30 minutes while you handle customer calls.

### 2. Browser Agents — browser-use, Browserbase, Stagehand
- AI controls a real Chrome browser to fill forms, scrape data, schedule meetings, post on social media.
- **Use case for solos:** auto-research competitor pricing weekly; auto-respond to qualified leads in a CRM you don't have an API for.

### 3. Workflow Agents — n8n + LLM nodes, Make AI Agents, Zapier Agents
- The same no-code tools you already use now have *agent nodes* that decide which next step to run based on natural-language reasoning.
- **Use case for solos:** a single "support triage" agent reads inbound emails, decides whether to reply, escalate, or refund, and acts.

### 4. Research Agents — Exa, Perplexity Sonar, Firecrawl
- Hand them a question; they search, scrape, summarize, and cite sources.
- **Use case for solos:** weekly market briefings, competitor monitoring, lead enrichment.

---

## When to Use an Agent (vs. a Workflow)

| Use a workflow when… | Use an agent when… |
| --- | --- |
| The steps are the same every time | The steps depend on context |
| You need 99.9% reliability | "Mostly right" is acceptable |
| Speed and cost matter most | The task is judgment-heavy |
| The tool has a clean API | You'd otherwise pay a human |

> **Solo founder rule:** start with a workflow. Only upgrade to an agent when you find yourself adding a 4th or 5th "if/else" branch — that's when an LLM saves more time than it costs.

---

## A Realistic First Agent Build

Pick one repetitive judgment task you do weekly. Examples:
- Reading 50 inbound emails and sorting them into "reply / ignore / escalate."
- Reviewing 20 podcast clips and picking the 3 best to publish.
- Watching pricing pages of 5 competitors and flagging changes.

Build it once with an n8n AI Agent node + a Gmail/Notion/Slack tool. Budget: ~$5–$15/month in LLM tokens for a solo founder.

In the next lesson we'll cover **MCP servers** — the protocol that lets your agents securely connect to your real business tools.
$$,
  true
),
(
  '61ae9cd4-a735-44cc-ae7d-57be4546abac',
  'MCP Servers: Connecting Your Agents to Your Business',
  'text',
  10,
  $$## What is MCP?

**Model Context Protocol (MCP)** is the open standard — introduced by Anthropic in late 2024 and adopted by OpenAI, Google, and most major IDEs in 2025–2026 — that lets AI agents securely talk to your tools, data, and services.

Think of MCP as **USB for AI agents**: one standard plug, hundreds of compatible tools. Before MCP, every agent → tool connection was a custom integration. Now it's a single config.

---

## Why Solo Founders Should Care

You probably have data scattered across:
- Stripe (revenue, customers)
- Supabase or your DB (app data)
- Notion or Linear (notes, tasks)
- Gmail / Slack (conversations)
- Google Drive (assets)

Without MCP, your AI assistant can't *see* any of that — you copy-paste context manually. With MCP, you connect each tool once and your agent can query everything as if it were a teammate.

**Real solo-founder examples:**
- "Hey Claude, summarize last week's churned customers and draft win-back emails." (MCP: Stripe + Gmail)
- "Find every support thread mentioning bug #482 and update the Linear ticket." (MCP: Slack + Linear)
- "Look at this month's signups and tell me which trial users haven't logged in." (MCP: Supabase + analytics)

---

## The 2026 MCP Ecosystem

You don't need to build MCP servers from scratch. As of 2026, there are **400+ public MCP servers** you can install with one command, including:

- **Database:** Supabase, Postgres, Neon, PlanetScale
- **Revenue:** Stripe, Paddle
- **Product:** Linear, Notion, GitHub, Figma
- **Communication:** Gmail, Slack, Discord
- **Browsing:** Browserbase, Playwright, Firecrawl
- **Filesystem:** Local files, S3, Google Drive

Most are listed at `mcp.so` and `glama.ai/mcp/servers`.

---

## How to Add Your First MCP Server (Claude Desktop or Cursor)

1. Open your AI client's settings → **MCP Servers**.
2. Paste a JSON config (most servers publish a copy-paste snippet on their README).
3. Restart the client.
4. The new tool appears as a callable function. Now your agent can use it.

Example: adding the Stripe MCP server takes about 60 seconds and gives Claude/Cursor full read access to your Stripe data (you control which scopes).

---

## Security: Don't Hand Over the Keys

MCP servers run **locally** on your machine and use *your* credentials. That means:

- Only install MCP servers from trusted sources (official vendor or popular open-source).
- Use **read-only** credentials when possible.
- For write actions (sending email, charging cards), prefer servers that require explicit per-action confirmation.

---

## What This Unlocks for a Solo Business

Once you have ~3–5 MCP servers connected to your daily AI client, the cognitive load of running your business drops dramatically. You stop being a *router* between tools and start being a *decision-maker* working alongside an agent that already has the full picture.

This is the single biggest leverage shift for solo founders since the launch of ChatGPT itself — and the entire stack costs under $40/month.
$$,
  true
);

-- Move the quiz back to position 11
UPDATE public.lessons SET order_number = order_number - 1000 + 2
WHERE course_id = '61ae9cd4-a735-44cc-ae7d-57be4546abac' AND order_number >= 1009;