# GenAura AI — AI Content Creator Marketplace

> Connect brands with the world's best creative talent, powered by AI matching.

## Quick Start

```bash
npm install
npm run dev       # → http://localhost:5173
npm run build     # production build → dist/
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite 8 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (no config file) |
| State | Zustand with localStorage persistence |
| Routing | React Router v7 |
| Icons | Lucide React |

## Team Structure

| Member | Feature | Folder |
|--------|---------|--------|
| Member 1 (Team Lead) | Dashboard, Shell, Architecture | `src/app/`, `src/components/ui/`, `src/lib/`, `src/types/` |
| Member 2 | Creator Profiles & Portfolios | `src/features/creators/` |
| Member 3 | Discovery, Matching & Shortlists | `src/features/discovery/` |
| Member 4 | Brief Builder | `src/features/briefs/` |
| Member 5 | Project Requests & Collaboration | `src/features/projects/` |

## Source Layout

```
src/
├── app/                   # App shell — owned by Member 1
│   ├── AppLayout.tsx      # Root layout with sidebar + outlet
│   ├── Sidebar.tsx        # Desktop sidebar + mobile nav drawer
│   └── router.tsx         # Centralized routing — Member 1 owns this
├── components/ui/         # Reusable UI library — Member 1 owns this
│   └── index.tsx          # Button, Badge, Card, Avatar, Input, StatCard…
├── data/
│   └── seed.ts            # Demo seed data
├── features/
│   ├── dashboard/         # Dashboard page — Member 1
│   ├── creators/          # STUB → Member 2
│   ├── discovery/         # STUB → Member 3
│   ├── briefs/            # STUB → Member 4
│   ├── projects/          # STUB → Member 5
│   └── settings/          # Settings page stub
├── lib/
│   ├── store.ts           # Zustand app store (single source of truth)
│   └── utils.ts           # Shared helpers (cn, formatUSD, timeAgo…)
└── types/
    └── index.ts           # Shared type contracts — ALL members import from here
```

## Shared Contracts

All shared types live in [`src/types/index.ts`](src/types/index.ts).

### Key Types

```ts
Creator           // Member 2 — creator profiles
PortfolioItem     // Member 2 — portfolio items
CreativeBrief     // Member 4 — brief builder
ShortlistEntry    // Member 3 — saved creators
ProjectRequest    // Member 5 — project management
```

### Route Constants

```ts
import { ROUTES } from '@/types';

navigate(ROUTES.dashboard)      // "/"
navigate(ROUTES.creators)       // "/creators"
navigate(ROUTES.briefNew)       // "/briefs/new"
navigate(ROUTES.projects)       // "/projects"
```

### Store Usage

```ts
import { useAppStore } from '@/lib/store';

// Read data
const creators = useAppStore((s) => s.creators);

// Mutate (Member 2 example)
const addCreator = useAppStore((s) => s.addCreator);
addCreator(newCreator);

// Dashboard stats (always derived from actual data)
const stats = useAppStore((s) => s.getDashboardStats());
```

## Design Tokens

Design tokens are CSS custom properties defined in [`src/index.css`](src/index.css):

| Token | Value |
|-------|-------|
| `--color-navy-950` | `#0a0f1e` (background) |
| `--color-violet-600` | `#7c3aed` (primary) |
| `--color-cyan-500` | `#06b6d4` (secondary accent) |

Use Tailwind classes: `bg-navy-900`, `text-violet-400`, `border-cyan-500/30`, etc.

## UI Components

All components are exported from `@/components/ui`:

```tsx
import { Button, Badge, Card, Avatar, Input, StatCard, PageHeader,
         EmptyState, StarRating, Spinner, Divider } from '@/components/ui';
```

## Git Workflow

- Branch: `feature/dashboard` (this work)
- Members: create `feature/<your-feature>` from this branch
- PRs: target `feature/dashboard` → review with Member 1 → merge to `main`
- Never force-push; coordinate shared type changes with Member 1 first
