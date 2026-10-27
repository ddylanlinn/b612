# Content Guide

## Add or edit an article

Blog articles live in `src/content/blog/` and keep their published slug as the file path. Changing a filename changes its URL, so treat it as a migration that requires a redirect.

Required frontmatter:

```yaml
title: 'Article title'
date: 2026-10-08
draft: false
summary: 'Original-language summary'
```

Supported fields include `images`, `tags`, `categories`, `language`, `topics`, `featured`, `lastmod`, and `canonicalUrl`. Existing legacy fields remain accepted only so article bodies can migrate mechanically.

For every published blog article, add one entry to `src/data/articleMeta.ts` with one English sentence, one topic (`Work`, `Outdoors`, `Travel`, or `Life`), and optional `featured: true`.

This split is intentional: the original article stays untouched while the English-first shell gets concise navigation metadata.

## Images

Store article images under `public/static/images/<slug>/` and reference them with an absolute path such as `/static/images/example/photo.jpg`. Use original, informative images. Do not add decorative stock imagery.

## Drafts

- Blog files with `draft: true` are not generated.
- Coding drafts keep their legacy URL for compatibility and receive `noindex, nofollow`.
- Drafts do not appear on `/writing`, the homepage, RSS, or the sitemap.

## Validation

Run `npm run validate:content`, `npm run check`, and `npm run build`.

Validation blocks missing frontmatter, missing local assets, missing English navigation metadata, duplicate or missing route outputs, placeholder text, and changes to the expected count of published legacy articles.
