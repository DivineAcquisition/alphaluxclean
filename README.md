# AlphaLuxClean — Next.js

This project was originally built with Vite + React + React Router and has been
rebuilt on **Next.js 14 (App Router)** while preserving every existing page
and Shadcn UI component.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **React 18**
- **Tailwind CSS** + **shadcn/ui** (Radix UI primitives)
- **Supabase** for data + auth
- **Stripe** for payments

## Project Structure

```
app/                         # Next.js App Router entry
├── layout.tsx               # Root layout: html/body, metadata, global scripts
├── ClientApp.tsx            # Client-only wrapper that mounts the SPA
└── [[...slug]]/page.tsx     # Catch-all route that delegates to the SPA tree

src/
├── App.tsx                  # React Router tree (mounted client-side)
├── index.css                # Global Tailwind styles + design tokens
├── views/                   # Page components (formerly `src/pages/`)
├── components/              # Shared UI + feature components
│   └── ui/                  # shadcn/ui primitives
├── contexts/                # React context providers
├── hooks/                   # Custom hooks
├── integrations/            # Third-party clients (Supabase, etc.)
├── lib/                     # Utilities & shared libs
├── services/                # Service-layer helpers
└── utils/                   # Misc utilities
```

### Why the catch-all route?

The application has ~90 existing page components and 80+ files that import
`react-router-dom`. Rather than rewrite every file, the whole React Router tree
is mounted inside a single Next.js App Router catch-all route
(`app/[[...slug]]/page.tsx`). This gives us:

1. Next.js as the build system, server runtime, and framework (SSR-ready
   layout, metadata, static assets, image optimization, middleware, API routes,
   etc.).
2. Zero churn on existing pages/components — they continue to work untouched.
3. A path to progressively migrate individual routes into native Next.js
   `app/…/page.tsx` files over time.

## Development

```bash
npm install
npm run dev    # http://localhost:8080
```

## Production build

```bash
npm run build
npm start
```

## Environment variables

Copy `.env` (already present with public Supabase keys) or set the following:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SUPABASE_PROJECT_ID=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...   # optional, Stripe also fetched from Supabase
```

Legacy `VITE_*` aliases are still read as a fallback.

## Migrating a page to native Next.js routes

To promote, e.g. `/pricing` to a native Next.js route:

1. Create `app/pricing/page.tsx` and import the existing view component from
   `@/views/Pricing`.
2. Remove (or leave) its `<Route path="/pricing" …>` entry in `src/App.tsx` —
   Next.js routes take precedence over the catch-all.
