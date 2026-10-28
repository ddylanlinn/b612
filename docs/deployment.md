# Deployment Runbook

## Topology

- GitHub repository: `ddylanlinn/b612`
- Vercel project: `next-web` (historic project name)
- Canonical URL: `https://www.b612isreal.com`
- Cloudflare owns DNS and the non-www to www redirect
- Vercel builds static pages and the Bookshelf server endpoint

The repository pins Vercel to the Astro preset and Node.js 22. Vercel installs with `npm ci` and builds with `npm run build`.

Configure these Production and Preview variables in Vercel:

- `NOTION_TOKEN`: internal Notion integration token
- `NOTION_BOOKS_DATA_SOURCE_ID`: Books data source identifier

Keep both values server-only. Never expose either value through a public environment variable.

Google OAuth is not part of the current Bookshelf flow. ChatGPT manages book records in Notion, and Google Books only supplies public cover images.

## Release sequence

Commit, push, Preview, and Production are separate authorization gates.

1. On the intended branch, run `npm ci`, `npm run check`, and `npm run build`.
2. Confirm `git status` contains only reviewed files and documentation matches behavior.
3. After authorization, commit the scoped diff.
4. After separate authorization, push the branch and create a Vercel Preview.
5. Verify the Preview checklist below.
6. After Production authorization, promote the exact verified revision.
7. Verify the custom domain through Cloudflare, not only the Vercel deployment URL.

## Preview and Production checklist

- Home, Work, Writing, and About return 200.
- A representative Chinese article renders its body and images.
- All 23 legacy article URLs exist.
- `/blog` redirects to `/writing` and `/projects` redirects to `/work`.
- A pagination, tag, and category legacy URL redirects to `/writing`.
- `/rss.xml`, `/robots.txt`, and `/sitemap-index.xml` return valid content.
- `/bookshelf` loads current Notion books without a new deployment.
- `/api/books` returns normalized book data without exposing the Notion token.
- `/api/book-cover` returns a same-origin image for an allowed Google Books cover URL.
- An unknown path uses the 404 page.
- Page title, description, canonical URL, social metadata, keyboard navigation, and mobile layout are correct.
- No comment, newsletter, Supabase, or Slack request appears in the browser network log.

## Rollback

Do not delete the previous Vercel Production deployment or prototype archive during rollout. If verification fails, immediately promote the previous known-good Vercel deployment. DNS should not need to change because the Vercel project and custom domain remain the same. Record the failed revision and observed route before attempting another release.
