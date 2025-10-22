# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a UGC (User-Generated Content) Management Hub built for TDR's Community Manager to streamline content curation from Instagram and TikTok using hashtag-based aggregation. The application provides a dashboard for managing content status workflow with status states: `new` → `approved_for_repost` | `weekly_winner` | `rejected`.

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Database**: Supabase (PostgreSQL with auto-generated APIs)
- **UI**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner

## Development Commands

```bash
# Development
npm run dev          # Start development server on localhost:5173
npm run build        # Build for production (includes TypeScript compilation)
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Package management
npm install          # Install dependencies
```

## Architecture

### Project Structure
```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components (40+ pre-built)
│   ├── UGCCard.tsx      # Content display cards
│   ├── UGCDashboard.tsx # Main dashboard layout
│   ├── Sidebar.tsx      # Navigation sidebar
│   └── [other components]
├── hooks/               # Custom React hooks
│   ├── useUGCContent.ts    # UGC data fetching
│   ├── useAuth.ts         # Authentication state
│   ├── useTDRApplications.ts # Application management
│   └── [other hooks]
├── lib/                 # Utility functions
│   ├── utils.ts         # Core utilities (cn() helper)
│   └── supabase.ts      # Database client
├── pages/               # Page components
│   ├── LoginPage.tsx       # Authentication page
│   ├── InstagramCollectionPage.tsx # Content collection
│   └── TDRApplicationsPage.tsx # Application management
├── services/            # External service integrations
│   ├── instagramScraper.ts   # Instagram API integration
│   ├── apifyActor.ts        # Apify automation
│   └── [other services]
├── types/               # TypeScript definitions
│   └── index.ts         # Core type definitions
├── App.tsx              # Main application component
└── main.tsx             # Entry point
```

### Key Architectural Patterns

**Component System**: Uses shadcn/ui components built on Radix UI primitives. All components are accessible and composable with consistent styling via CSS variables.

**Data Flow**:
- Supabase provides the backend with auto-generated REST APIs
- TanStack Query manages server state, caching, and background updates with query pattern `['resource', filters?]`
- React Query hooks follow the pattern: `use[Resource]()` in `src/hooks/`
- JWT-based authentication with automatic token refresh
- External service integrations via Apify for Instagram content scraping
- UGC content flows through status workflow: `new` → `approved_for_repost` | `weekly_winner` | `rejected`

**Styling System**:
- Tailwind CSS with custom design tokens in `tailwind.config.js`
- CSS variables for theming (light/dark mode support via `next-themes`)
- `cn()` utility in `src/lib/utils.ts` combines clsx and tailwind-merge for conditional classes

**Form Handling**: React Hook Form with Zod schemas for type-safe validation, integrated via `@hookform/resolvers`

## Configuration Files

- `vite.config.ts`: Vite configuration with React plugin, path aliases (@ -> src/), and Apify API proxy
- `tailwind.config.js`: Tailwind configuration with custom colors, animations, and shadcn/ui setup
- `components.json`: shadcn/ui configuration with component paths and styling preferences
- `tsconfig.json`: TypeScript configuration (extends Vite's default)

## Environment Setup

Create `.env` file with:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Apify Configuration
VITE_APIFY_API_TOKEN=your_apify_api_token
VITE_APIFY_DATASET_ID=your_apify_dataset_id
```

## Development Notes

### Component Development
- Use existing shadcn/ui components as building blocks
- Follow the established pattern of exporting components from individual files
- Utilize the `cn()` utility for conditional styling
- Components support dark/light mode through CSS variables

### Data Fetching
- Use TanStack Query hooks for all server state with query pattern `['resource', filters?]`
- Leverage Supabase's auto-generated APIs for database operations
- Handle JWT errors with automatic logout redirect
- Use existing Instagram scraper services for hashtag-based content collection via Apify API
- Core services: `instagramScraper.ts` (271 lines), `apifyActor.ts` (322 lines), `instagramDatabase.ts`

### Form Development
- Use React Hook Form with Zod schemas for validation
- Integrate with shadcn/ui form components
- Use the existing form patterns in `src/components/ui/form.tsx`

### Styling Guidelines
- Prefer Tailwind utility classes over custom CSS
- Use the design token system (colors, spacing, radius) defined in Tailwind config
- Maintain responsive design with mobile-first approach
- Leverage the animation system (accordion-down, accordion-up) for smooth transitions

## Key Files to Understand

### Configuration
- `vite.config.ts`: Path aliases (@ → src/), React plugin, Apify API proxy
- `components.json`: shadcn/ui configuration with component paths
- `tailwind.config.js`: Complete design system with CSS variables

### Core Architecture
- `src/App.tsx`: Authentication flow + QueryClient setup
- `src/components/UGCDashboard.tsx`: Main dashboard with sidebar, filters, content grid
- `src/hooks/useUGCContent.ts`: Primary data fetching hook with filtering
- `src/lib/supabase.ts`: Database client configuration
- `src/types/index.ts`: TypeScript definitions for UGCContent, UGCContentFilters, ContentStatus

### Service Layer
- `src/services/instagramScraper.ts`: Apify dataset integration for hashtag-based scraping
- `src/services/apifyActor.ts`: Actor management for URL-based scraping
- `src/services/instagramDatabase.ts`: Supabase integration for scraped data
- `src/services/imageStorage.ts`: Media file management
- `src/services/instagramScheduler.ts`: Scheduled scraping operations

### UI Components
- `src/lib/utils.ts`: Core utility functions including the `cn()` helper
- `src/components/ui/`: Complete shadcn/ui component library (40+ components)
- `src/components/UGCCard.tsx`: Content display cards
- `src/components/Sidebar.tsx`: Navigation sidebar