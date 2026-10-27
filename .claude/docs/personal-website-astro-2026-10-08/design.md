# Dylan Lin Personal Website

Status: Approved
Date: 2026-10-08
Canonical domain: `https://www.b612isreal.com`
Canonical repository: `https://github.com/ddylanlinn/b612`

## 1. Purpose

Merge the existing personal blog and engineering portfolio into one low-maintenance personal website.

The site presents Dylan as one person whose work spans software, products, teams, publishing, writing, travel, and outdoor experiences. It is not a conventional job-seeking portfolio and does not depend on frequent publishing to remain credible.

The desired outcomes, in order, are:

1. Cross-disciplinary projects, consulting, or co-founding conversations
2. Technical or product leadership opportunities
3. Connections with people who share compatible interests
4. Interviews, talks, and content collaborations
5. Pure engineering opportunities

`b612isreal.com` is only the domain. `Dylan Lin` is the public identity.

## 2. Voice and Positioning

The site is English-first. Existing Chinese articles remain in Chinese.

Copy must be calm, direct, and factual:

- Use short sentences and concrete details.
- Do not label Dylan as an explorer, builder, leader, or cross-disciplinary creator.
- Let work, writing, photographs, and history demonstrate those qualities.
- Do not use inspirational slogans, manufactured calls to action, or generic AI-style language.
- Do not imply active job seeking unless that becomes true.

Representative homepage tone:

> Dylan Lin
> I work in software and used to work in publishing. This is where I keep some of my work, trips, and writing.

This is a tone reference, not locked final copy.

## 3. Architecture Decision

Use Astro as the production framework.

The site has local content, no authentication, no database, no comments, no CMS, and no visitor-time API dependency. Astro produces static HTML with less runtime and maintenance overhead than upgrading the legacy Next.js application.

The existing Git repository remains canonical so its history is preserved. The existing Astro prototype is migration input, not a second maintained application.

### Repository strategy

- Formal checkout: `/Users/dylan/Dylan/b612`
- GitHub: `ddylanlinn/b612`
- Prototype archive: `/Users/dylan/Dylan/b612-astro-prototype-2026-09-21`
- Preserve the archive until production migration is verified.
- Replace the legacy Next.js application in the formal repository with one Astro application.
- Do not maintain parallel Next.js and Astro implementations.

### Runtime and hosting

- Node.js 22
- Astro static output
- Local MDX content
- Existing Vercel project, currently named `next-web`
- Existing Cloudflare DNS and redirect behavior
- Canonical host: `www.b612isreal.com`
- Non-www continues redirecting to `www`

No CMS, database, authentication, comments, newsletter, chatbot, or runtime content API is introduced.

## 4. Information Architecture

Primary navigation:

```text
Work · Writing · About
```

Primary routes:

```text
/
/work
/writing
/about
/blog/<legacy-slug>
```

### URL policy

Use new navigation paths while preserving published article URLs.

- `/writing` is the canonical Writing index and complete archive.
- `/blog` redirects permanently to `/writing`.
- The 23 published articles retain `/blog/<slug>`.
- Existing `/coding/<slug>` pages remain addressable but are excluded from the Writing index while marked draft.
- `/projects` redirects permanently to `/work`.
- `/blog/page/*`, `/tags/*`, and `/categories/*` redirect permanently to `/writing`.
- `/about` becomes a real page.
- Unknown routes use a plain 404 page.

Do not create duplicate article pages under `/writing/<slug>`.

## 5. Page Design

### Homepage

The homepage is curated, not a resume or full archive.

Order:

1. Name and one direct introductory paragraph
2. Four to six selections mixing work, travel, outdoor experience, and writing
3. Two to three selected work items
4. Five to ten selected articles and a link to Writing
5. Short About excerpt
6. Plain Email, LinkedIn, and GitHub links

The current prototype's timeline-first homepage is not the final homepage.

### Work

Work contains:

- A short description of how Dylan works
- Two to three selected work items
- A concise employment history
- Resume links

Each selected item uses:

```text
Project name
Context
My role
What changed
```

Avoid skill bars, oversized technology lists, confidential details, internal screenshots, or unverified metrics.

### Writing

Writing is both the selected list and complete archive.

- Selected pieces appear first.
- The complete archive follows, grouped by year.
- Entries include title, date, language, topic, and a one-line English summary.
- Initial topics are `Work`, `Outdoors`, `Travel`, and `Life`.
- Chinese articles keep their original body copy.
- Search is omitted until the archive demonstrates a real need for it.

### About

About contains the longer factual story:

- Current work
- Transition from editorial and marketing work into software
- Professional history
- Travel and outdoor experiences
- A concise timeline
- Contact links

The prototype chapter timeline moves here. Its year strip is static supporting information, not primary navigation.

### Article

Article pages contain title, date, topic, language, optional meaningful image, and the original body.

Do not add comments, likes, reading progress, algorithmic recommendations, or engagement mechanics.

## 6. Visual System

Use a quiet editorial design:

- Warm paper-like background
- Dark gray text
- Muted accent color
- Sans-serif interface typography
- Readable serif typography where it benefits long-form content
- Comfortable Traditional Chinese rendering
- General content width around 1100 to 1200 px
- Reading width around 680 to 760 px
- Single-column mobile layout preserving source order

Keep the useful parts of the Astro prototype's color and typography system, but remove entrance animation and scroll animation. Retain only necessary hover and focus states. Respect reduced-motion preferences.

Use only informative, original images. Avoid explorer motifs, decorative maps, compasses, contour lines, film borders, staged hero portraits, parallax, 3D, or cursor effects.

Dark mode may follow the operating system. Do not add a theme switch.

## 7. Content Model

Articles remain local MDX files.

Required or supported metadata:

```yaml
title:
date:
summary:
language:
topics:
featured:
images:
draft:
```

Keep the schema small. Homepage selections refer to the same content records instead of duplicating article data.

### Source-of-truth policy

- The legacy Next.js MDX files are the original article source.
- Mechanical migration may remove obsolete layout metadata but must not rewrite article bodies.
- Existing images remain original quality.
- Work facts come from the existing portfolio source.
- Documented facts include `117+ projects`, `5+ WebView projects`, tracking library work, GTM, Mixpanel, and the listed roles.
- Do not publish prototype-only claims without a source.
- Omit the `70% efficiency` claim unless Dylan explicitly reconfirms it.
- `TODO`, placeholder content, missing metadata, and missing required images block production build.

New English summaries and topic labels are navigation metadata, not translations or editorial rewrites.

## 8. Build and Data Flow

At build time:

1. Load local MDX collections.
2. Validate metadata and unique slugs.
3. Validate local images and internal links.
4. Generate selected lists and the year-grouped archive.
5. Render all pages and legacy article routes to static HTML.
6. Generate canonical metadata, sitemap, RSS, and robots rules.
7. Emit `dist/` for Vercel.

No visitor request depends on a server or third-party content API.

## 9. Validation

The implementation must provide these deterministic checks:

1. `astro check` for Astro templates and TypeScript.
2. `astro build` for content schema and static generation.
3. A small content validator for:
   - required metadata
   - duplicate slugs
   - missing local images
   - broken internal links
   - `TODO` and placeholders
4. A route manifest check for:
   - all 23 published `/blog/<slug>` routes
   - required legacy redirects
   - absence of the removed comments APIs

Preview smoke tests cover Home, Work, Writing, About, representative Chinese articles, 404, sitemap, RSS, robots, and redirects.

## 10. Deployment and Rollback

Deployment stays on the existing Vercel project.

Target settings:

- Framework: Astro
- Node.js: 22
- Build command: `npm run build`
- Output directory: `dist`

Release sequence:

1. Finish and verify the Astro replacement locally.
2. Create a Vercel Preview.
3. Verify content, routes, metadata, and redirects.
4. Promote the verified revision to Production.
5. Verify the real custom domain through Cloudflare.
6. Retain the prototype archive and previous Vercel deployment until production verification is complete.

Git commit, push, Preview, and Production deployment remain separate authorization boundaries.

## 11. Required Project Documentation

Implementation is not complete until the repository contains current documentation for:

- `README.md`: purpose, setup, commands, and repository orientation
- `docs/architecture.md`: system structure, content flow, route policy, and framework decisions
- `docs/content-guide.md`: metadata, writing workflow, image rules, featured content, and validation failures
- `docs/deployment.md`: Vercel and Cloudflare topology, Preview and Production procedures, verification, and rollback
- `docs/migration.md`: legacy source inventory, redirect map, migrated assets, and known exceptions

Documentation and code must change together whenever the associated workflow or system changes.

## 12. Explicit Non-Goals

- CMS
- Database or backend API
- Comments or reactions
- Newsletter
- Full bilingual mirror
- Search before demonstrated need
- Interactive map
- Large animation system
- 3D or WebGL
- AI chatbot
- Rewriting the full article archive

## 13. Success Criteria

The redesign is complete when:

- The site communicates one coherent person rather than separate portfolio and blog identities.
- Public claims are traceable to approved source material.
- All published article URLs continue to work.
- Core pages work without client-side JavaScript.
- Local validation catches incomplete or broken content before deploy.
- Vercel Preview and Production pass the documented checks.
- A future update can be completed by editing MDX or small data files without reconstructing the system.
