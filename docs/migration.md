# Migration from Next.js to Astro

## Decision

The site contains local content and has no runtime product features. Astro static output is simpler to operate than upgrading the legacy Next.js and Contentlayer application. The existing repository remains canonical so Git history is preserved.

## Inputs

- Canonical legacy content: the former `data/blog/` and `data/coding/` directories
- Work facts and résumé files: the former portfolio repository
- Layout and migration experiments: `/Users/dylan/Dylan/b612-astro-prototype-2026-09-21`

The prototype archive stays untouched until the Production migration is verified. It is not a maintained application.

## Content inventory

- 24 blog MDX files: 23 published and one draft
- Two coding MDX files: both drafts, both retained as no-index legacy routes
- 147 original article image files
- English and Traditional Chinese résumé PDFs

Article bodies were migrated mechanically. English summaries and topics were added separately in `src/data/articleMeta.ts`.

Known correction: the final image in `camino-intro.mdx` referenced the misspelled, nonexistent `camino-inter` directory. Migration corrected it to the existing `camino-intro/camino-intro-7.jpeg` asset.

## Redirect map

| Legacy path | Destination | Owner |
| --- | --- | --- |
| `/blog` | `/writing` | Astro locally, Vercel 308 in deployment |
| `/coding` | `/writing` | Astro locally, Vercel 308 in deployment |
| `/projects` | `/work` | Astro locally, Vercel 308 in deployment |
| `/tags` | `/writing` | Astro locally, Vercel 308 in deployment |
| `/categories` | `/writing` | Astro locally, Vercel 308 in deployment |
| `/blog/page/*` | `/writing` | Vercel |
| `/tags/*` | `/writing` | Vercel |
| `/categories/*` | `/writing` | Vercel |

All 23 published `/blog/<slug>` paths remain pages, not redirects. The exact pre-migration route capture is in `.claude/docs/personal-website-astro-2026-10-08/legacy-routes.txt`.

## Removed systems

- Next.js runtime and API routes
- Contentlayer generation
- Supabase comment client and APIs
- Slack comment notification webhook
- Giscus package and configuration
- Newsletter API
- Theme switch and client navigation components

The Supabase project remains paused and is not part of this site's runtime.
