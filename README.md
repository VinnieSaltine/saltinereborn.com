# The Saltine Reborn

Phase 1 teaser landing page for `The Saltine Reborn`, published under Hallowfield Publishing Group.

Production domain: `https://www.saltinereborn.com`

## Current Scope

- Teaser landing page
- Library page for the collected Saltines archive
- Cover image
- Title, author, publisher branding
- Teaser copy
- Chapter One Coming Soon
- Mobile-friendly static build
- Social preview metadata
- Canonical URL, robots.txt, and sitemap.xml

No backend, accounts, comments, message board, admin panel, notifications, or database.

## Private Beta Gate

The site includes a lightweight password gate for invited readers. It uses a Vercel serverless function at `api/verify-password.js` and checks this environment variable:

```bash
SITE_PASSWORD=your-private-reader-password
```

Successful access is remembered in browser storage. This is a private beta gate, not account-level security.

## Local Preview

```bash
npm install
npm run dev
```

Astro will print a local preview URL, usually `http://localhost:4321`.

## Production Build

```bash
npm run build
npm run preview
```

The production-ready static site is generated in `dist/`.

## Future Structure

Reserved content folders are already present:

- `src/content/chapters`
- `src/content/characters`
- `src/content/previously-on`

When Phase 2 begins, add routes under `src/pages/chapters`, `src/pages/characters`, and `src/pages/previously-on`. A future `/message-board` page can link to a hosted community tool without changing the core static site.

The current library framework lives at `src/pages/library.astro` and is designed for future books, side stories, character guides, timelines, maps, and bonus content.

## Production Assets

- `public/assets/saltine-cover.jpg`
- `public/assets/saltine-cover-source.png`
- `public/assets/hallowfield-logo-gold.png`
- `public/assets/social-preview.jpg`

The source PNG is retained so future social crops or compressed variants can be regenerated from the official cover art.
