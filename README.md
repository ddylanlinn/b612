# b612

The source for [www.b612isreal.com](https://www.b612isreal.com), Dylan Lin's personal website. It brings work, writing, reading, and personal history into one site.

The public identity is `Dylan Lin`. `b612isreal.com` is the domain name, not the brand description.

## Stack

- Astro static output with one Vercel server endpoint
- Local MDX content
- Notion Bookshelf data
- TypeScript
- Tailwind CSS as a build-time CSS tool
- Vercel hosting behind Cloudflare DNS

Notion supplies the public Bookshelf data. The website has no authentication, comments system, or visitor data store.

## Local setup

Use Node.js 22.19 or newer.

```sh
npm ci
npm run dev
```

Use `vercel dev` when testing the Bookshelf API locally. Astro dev serves the static page only.

The Bookshelf endpoint requires these server-only variables:

```sh
NOTION_TOKEN=
NOTION_BOOKS_DATA_SOURCE_ID=
```

The website never sends `NOTION_TOKEN` to the browser.

`package.json` overrides Zod to `4.6.7`. Astro's optional Vercel dependency pins an older vulnerable Zod release.

Production verification commands:

```sh
npm run validate:content
npm run check
npm run build
npm run preview
```

`npm run build` runs content validation, creates `dist/`, and verifies the generated route manifest.

## Repository map

- `src/pages/`: public pages, the hidden Bookshelf, and legacy article routes
- `src/content/`: original MDX article bodies
- `src/data/`: work, timeline, and English navigation metadata
- `src/components/`: small shared presentation components
- `src/layouts/`: document shell and metadata
- `public/`: article images, résumés, and favicons
- `scripts/`: deterministic content and route checks
- `docs/`: architecture, content, migration, and deployment runbooks

Read [docs/content-guide.md](docs/content-guide.md) before editing articles and [docs/deployment.md](docs/deployment.md) before releasing.
