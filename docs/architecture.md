# Architecture

## Purpose

This is one low-maintenance personal website for Dylan Lin's work, writing, and history. Astro renders the entire site to static files. A visitor does not depend on a Node server, database, CMS, or third-party content service.

## Build flow

1. Astro loads the `blog` and `coding` MDX collections through `src/content.config.ts`.
2. Zod validates frontmatter and coerces dates.
3. `src/data/articleMeta.ts` adds English navigation summaries and topic labels without changing the original Chinese article bodies.
4. Astro generates core pages, 23 published `/blog/<slug>` routes, and two no-index draft `/coding/<slug>` routes.
5. The sitemap integration and RSS endpoint generate discovery files.
6. `scripts/validate-routes.mjs` checks the finished `dist/` tree and redirect configuration.

## Route policy

- `/`, `/work`, `/writing`, and `/about` are canonical pages.
- Published article URLs stay at `/blog/<slug>`.
- `/blog` and `/coding` redirect to `/writing`.
- `/projects` redirects to `/work`.
- Historic pagination, tag, and category route families redirect to `/writing` through `vercel.json`.
- Draft coding pages remain addressable for compatibility but use `noindex, nofollow`.

## Sources of truth

- Original article bodies: `src/content/`
- English article summaries, topics, selections: `src/data/articleMeta.ts`
- Work claims: `src/data/work.ts`, derived from the former portfolio content
- Personal timeline: `src/data/timeline.ts`
- Route baseline: `.claude/docs/personal-website-astro-2026-10-08/legacy-routes.txt`

The old Next.js application is not retained alongside Astro. The separate prototype archive is migration evidence only and must not become a second maintained source.

## Design constraints

The UI is server-rendered HTML with no required client JavaScript. Styles use a small editorial token set in `src/styles/global.css`. Motion is limited to smooth scrolling, which is disabled for reduced-motion users.
