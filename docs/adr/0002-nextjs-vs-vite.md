# ADR 0002: Next.js vs. Vite for the web app

**Status:** Accepted  
**Date:** 2026-09-01

## Context

The Plimsoll web app is a data-display SPA. Two build/framework choices were
evaluated:

1. **Vite + React**: Minimal config, fast hot-module reload, pure client-side
   rendering, easy to deploy to any static host.
2. **Next.js (App Router)**: File-system routing, Server Components and Server
   Actions, built-in image optimisation, and first-class Vercel hosting.

The app has no server-rendered data requirements today (all data is fetched
client-side from the indexer), but the following future needs were considered:

- SEO-friendly pages for individual asset coverage reports (robots should index
  `/asset/?sac=…`).
- Social metadata (`og:image`, `twitter:card`) generated per-asset.
- Potential server-side caching of indexer responses to reduce cold-start
  latency.

## Decision

We chose **Next.js** with the App Router.

The `"use client"` directive marks all pages that need browser APIs (wallet
integration, `useSearchParams`). Static or lightly-dynamic pages can be
rendered on the server without wallets, keeping the bundle small.

Deployment is to Vercel using the project's `vercel.json` config, which also
handles `Cache-Control` headers for the Next.js static assets.

## Consequences

- Next.js App Router is more complex than a plain Vite SPA; contributors must
  understand the client/server component boundary.
- Server Components cannot import wallet libraries; the `"use client"` barrier
  must be managed carefully.
- We get file-system routing, `<Link>` prefetching, and `<Image>` optimisation
  for free.
- Deployment is pinned to Vercel for the easiest experience, though the app
  runs on any Node.js host that supports Next.js standalone output.
