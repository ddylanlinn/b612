# Astro Migration Implementation Plan

Status: Approved for implementation
Branch: `codex/astro-migration`
Base commit: `7435541`
Date: 2026-10-08

The implementation endpoint is a verified, uncommitted diff. Commit, push, Vercel Preview, and Production deployment require separate authorization.

## Phase 0: Safety and Baseline

1. Create the migration branch from the current local security-fix commit.
2. Record the legacy public route manifest before replacing the application.
3. Keep `/Users/dylan/Dylan/b612-astro-prototype-2026-09-21` unchanged until Production verification is complete.

## Phase 1: Astro Foundation

4. Replace the Next.js package configuration with Node 22 and Astro static-build scripts.
5. Add Astro, MDX, and sitemap configuration.
6. Align TypeScript, editor, formatter, and ignore configuration.
7. Implement the approved quiet editorial design tokens and responsive base styles.

## Phase 2: Content System

8. Define a small validated article schema.
9. Migrate blog MDX mechanically without rewriting article bodies.
10. Migrate coding MDX while retaining draft status and legacy routes.
11. Add English navigation metadata: summaries, language, topics, and featured state.
12. Preserve source images and PDFs.
13. Add shared collection queries for published, featured, and year-grouped content.
14. Add deterministic validation for metadata, duplicate routes, images, internal links, and placeholders.
15. Add a route-manifest check for published routes, redirects, and removed APIs.

## Phase 3: Shared UI

16. Add one source of truth for identity, navigation, contact, work, and timeline data.
17. Build the base document layout and metadata.
18. Build accessible header and footer navigation.
19. Build the long-form article layout.
20. Build small reusable content-list and work components.

## Phase 4: Pages and Routes

21. Preserve `/blog/<slug>` article routes.
22. Preserve `/coding/<slug>` draft routes without indexing them.
23. Build `/writing` as selected writing plus the complete year-grouped archive.
24. Build `/work` from source-backed portfolio facts.
25. Build `/about` with the factual story and concise timeline.
26. Build the curated homepage.
27. Add 404, RSS, sitemap, and robots output.
28. Add source-controlled permanent legacy redirects.

## Phase 5: Documentation and Cleanup

29. Rewrite `README.md` for purpose, setup, commands, and repository orientation.
30. Add `docs/architecture.md`.
31. Add `docs/content-guide.md`.
32. Add `docs/migration.md` with the route and source inventory.
33. Add `docs/deployment.md` with Preview, Production, verification, and rollback.
34. Remove superseded Next.js application files and dependencies.

## Phase 6: Verification and Handoff

35. Run install, content validation, `astro check`, static build, route checks, and local smoke tests.
36. Review the complete diff for scope, documentation alignment, unsupported claims, and accidental archive changes.

## Release Gates

- Gate 1: local implementation and deterministic verification
- Gate 2: explicit authorization to commit
- Gate 3: explicit authorization to push
- Gate 4: explicit authorization to create and verify Vercel Preview
- Gate 5: explicit authorization to promote to Production and verify the custom domain
