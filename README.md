# SoloSuccess Academy

An AI-powered Learning Management System (LMS) for solo founders and small business owners, featuring a 10-course curriculum designed to help entrepreneurs build their businesses from mindset to pitch.

---

## 🚀 Features

### For Students
- **10-Course Curriculum** — Comprehensive learning path from initialization to launch
- **AI Tutor** — Personalized learning assistance powered by AI
- **Interactive Textbooks** — Flip-book style textbooks with highlighting and notes
- **Flashcard System** — Spaced-repetition learning with the SM-2 algorithm
- **Quizzes & Worksheets** — Interactive assessments with instant feedback
- **Course Projects** — Hands-on projects with AI-powered feedback
- **Discussion Forums** — Community learning with threaded discussions
- **Gamification** — XP, streaks, badges, and leaderboards
- **Certificates** — Auto-generated PDF certificates with unique verification codes

### For Administrators
- **Course Management** — Create and manage courses, lessons, and content
- **AI Content Generation** — Generate lessons, quizzes, and worksheets with AI
- **Student Analytics** — Track progress and engagement
- **Gradebook** — Review and grade student work
- **Content Generator** — Smart prompts with tone, length, and template options

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI components
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: Lovable AI integration for content generation
- **PDF Generation**: jsPDF for certificates
- **Animations**: Canvas Confetti for celebrations

## 📋 Prerequisites

Before running locally, ensure you have:

- **Node.js** 18.x or higher
- **npm** 9.x or higher (or **bun** as an alternative)
- **Supabase Account** (for backend services)

## 🔧 Local Development Setup

### Step 1: Download the Project

**Option A: Using Lovable's Code Export (Recommended)**
1. Open your project in Lovable
2. Switch to **Code Editor View** (toggle in top-left)
3. Use the file browser to navigate through all files
4. Copy each file's contents to matching files on your local machine

**Option B: Copy from Preview**
1. Right-click in the code editor and select all files you need
2. Create the same folder structure locally
3. Paste contents into each file

### Step 2: Create Project Structure

Create this folder structure locally:

```
solosuccess-academy/
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── integrations/
│   ├── lib/
│   ├── pages/
│   └── test/
├── supabase/
│   └── functions/
├── index.html
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

### Step 3: Install Dependencies

```bash
# Navigate to your project directory
cd solosuccess-academy

# Install dependencies
npm install

# Or using bun
bun install
```

### Step 4: Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://fkqzwlpwdgdiwpsvhavt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=fkqzwlpwdgdiwpsvhavt
```

> **Note**: For local development with a new Supabase project, you'll need to create your own project and update these values.

### Step 5: Run the Development Server

```bash
# Start the development server
npm run dev

# Or using bun
bun run dev
```

The app will be available at `http://localhost:3000`

## 📁 Project Structure

```
├── public/                 # Static assets (favicon, robots.txt)
├── src/
│   ├── components/         # React components
│   │   ├── admin/          # Admin dashboard components
│   │   ├── certificates/   # Certificate display/modal
│   │   ├── discussion/     # Forum components
│   │   ├── gamification/   # XP, badges, streaks
│   │   ├── layout/         # App layouts and navigation
│   │   ├── lesson/         # Lesson viewer components
│   │   ├── navigation/     # Breadcrumbs, nav links
│   │   ├── notifications/  # Notification bell
│   │   ├── profile/        # User profile components
│   │   ├── project/        # Course project submission
│   │   ├── textbook/       # Interactive textbook viewer
│   │   └── ui/             # Reusable UI components (shadcn)
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useCourses.ts   # Course data fetching
│   │   ├── useProgress.ts  # Student progress tracking
│   │   └── ...             # Other hooks
│   ├── integrations/       # Supabase client configuration
│   ├── lib/                # Utility functions
│   ├── pages/              # Route page components
│   └── test/               # Test configuration
├── supabase/
│   ├── functions/          # Edge Functions (serverless)
│   │   ├── ai-tutor/       # AI chat functionality
│   │   ├── generate-content/ # AI content generation
│   │   ├── generate-image/ # AI image generation
│   │   ├── generate-voice/ # Text-to-speech
│   │   ├── create-checkout/ # Stripe payment
│   │   └── stripe-webhook/ # Payment webhooks
│   └── config.toml         # Supabase local config
├── index.html              # HTML entry point
├── tailwind.config.ts      # Tailwind CSS configuration
├── vite.config.ts          # Vite build configuration
└── tsconfig.json           # TypeScript configuration
```

## 🔑 Key Files Reference

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app component with routing |
| `src/main.tsx` | React entry point |
| `src/index.css` | Global styles and CSS variables |
| `src/integrations/supabase/client.ts` | Supabase client setup |
| `vite.config.ts` | Build and dev server config |
| `tailwind.config.ts` | Theme and design tokens |

## 🎨 Theming

The app uses a cyberpunk-inspired dark theme. Colors are defined in:
- `src/index.css` - CSS custom properties (HSL format)
- `tailwind.config.ts` - Tailwind theme extension

Key color tokens:
- `--primary` - Neon cyan accent
- `--secondary` - Purple accent
- `--background` - Dark background
- `--foreground` - Light text

## 🔐 Security Features

- **Row Level Security (RLS)** - All database tables protected
- **Authentication** - Email/password with email verification
- **Rate Limiting** - API endpoints protected (20 req/hour for AI)
- **Input Validation** - Server-side validation on Edge Functions
- **Secure Views** - `security_invoker` on public views

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start dev server (port 3000)

# Building
npm run build        # Create production build in dist/
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint and auto-fix issues
npm run type-check   # Run TypeScript type checking

# Testing
npm test             # Run Vitest test suite once
npm run test:watch   # Run Vitest in watch mode
```

## 🌐 Deployment Options

### Option 1: Lovable Publishing (Easiest)
Click **Publish** button in Lovable for instant deployment.

### Option 2: Self-Hosting
1. Build: `npm run build`
2. Deploy `dist/` folder to any static host
3. Configure environment variables
4. Deploy Edge Functions to Supabase separately

### Recommended Hosting Platforms
- **Vercel** - `npm i -g vercel && vercel`
- **Netlify** - Drag & drop `dist/` folder
- **Cloudflare Pages** - Connect via Git or upload
- **AWS Amplify** - Full-stack deployment

## 🗄️ Database Setup (New Supabase Project)

If creating a fresh Supabase project:

1. Create project at [supabase.com](https://supabase.com)
2. Navigate to SQL Editor
3. Run migrations from `supabase/migrations/` in order
4. Enable Email auth in Authentication settings
5. Create storage buckets: `avatars`, `lesson-videos`, `project-files`
6. Deploy Edge Functions (see below)

### Deploying Edge Functions (no local Docker)

To deploy functions to your **hosted** Supabase project (no `supabase start` or Docker needed):

1. **Find your project ref** (one of these methods):
   - **Dashboard URL**: Open your project in [Supabase Dashboard](https://supabase.com/dashboard) → the URL will be `https://supabase.com/dashboard/project/[PROJECT_REF]` — copy that `[PROJECT_REF]` part
   - **Project Settings**: Dashboard → **Project Settings** → **General** → look for **Reference ID**
   - **From your `.env`**: Check `VITE_SUPABASE_URL` — it's the part before `.supabase.co` (e.g., `https://[PROJECT_REF].supabase.co`)

2. **Link the CLI to your project**:
   ```bash
   npx supabase link --project-ref [YOUR_PROJECT_REF]
   ```
   Replace `[YOUR_PROJECT_REF]` with the actual ref from step 1.
   
   If you see *"necessary privileges"*: the logged-in account must be **Owner** or **Administrator** of the project. Check [Access Control](https://supabase.com/docs/guides/platform/access-control) and your [Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens). Re-login with `npx supabase login` if needed.

3. **Deploy a function** (or all):
   ```bash
   npx supabase functions deploy send-notification-email
   # or deploy all:
   npx supabase functions deploy
   ```

4. Set any **secrets** (e.g. SMTP) in the Dashboard under **Project → Edge Functions → Secrets**, or via CLI.

## 📄 License

Proprietary software for SoloSuccess Academy.

---

## 🔐 Security

- **Row Level Security (RLS)** — All database tables protected at the row level
- **Authentication** — Email/password with email verification
- **Rate Limiting** — AI endpoints protected (20 req/hour per user)
- **Input Validation** — Server-side validation on all API endpoints

---

## 📖 Wiki

Full documentation for this project is available in the [`docs/`](docs/) directory:

| Page | Description |
|------|-------------|
| [Home](docs/Home.md) | Project overview and navigation |
| [Features](docs/Features.md) | Complete feature documentation |
| [Curriculum](docs/Curriculum.md) | All 10 courses, lessons, and assignments |
| [Roadmap](docs/Roadmap.md) | Planned features and development timeline |
| [Changelog](docs/Changelog.md) | Version history and release notes |
| [FAQ](docs/FAQ.md) | Frequently asked questions |
| [Legal](docs/Legal.md) | Copyright, ownership, and usage restrictions |

---

## 📄 License

**Proprietary — All Rights Reserved.**

This project and all associated content, code, design, curriculum, images, and intellectual property are exclusively owned by the creator. No permission is granted to use, copy, modify, distribute, or commercially exploit any portion of this project. See [LICENSE](LICENSE) and [docs/Legal.md](docs/Legal.md) for the full terms.

---

*Built independently with the assistance of [Lovable](https://lovable.dev), GitHub Copilot, and Google Gemini.*
