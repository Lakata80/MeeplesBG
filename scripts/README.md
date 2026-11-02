# Scripts

> **Warning:** All scripts run against **live production services** (PostgreSQL, MeiliSearch, Sanity, Cloudflare R2, Resend, Anthropic API, BoardGameGeek API). Never run them without understanding what they will change.

## Reusable scripts

These scripts are referenced in `package.json` or maintained for ongoing use.

| Script | npm command | What it does | Required env vars |
|--------|-------------|--------------|-------------------|
| `hotness-sync.ts` | `npm run hotness:sync` | Syncs BGG hotness rankings to the database | `DATABASE_URL`, `MEILI_HOST`, `MEILI_API_KEY` |
| `import-games.ts` | `npm run import:games` | Imports board games from the BGG dump file | `DATABASE_URL`, `BGG_DUMP_FILE` |
| `import-bgg.ts` | `npm run import:bgg` | Fetches and imports BGG data via API | `DATABASE_URL`, `BGG_API_URL`, `BGG_SESSION_COOKIE` |
| `import-expansions.ts` | `npm run expansions:import` | Imports game expansions from BGG | `DATABASE_URL`, `MEILI_HOST`, `MEILI_API_KEY` |
| `reindex.ts` | `npm run import:reindex` | Re-indexes all games in MeiliSearch | `DATABASE_URL`, `MEILI_HOST`, `MEILI_API_KEY` |
| `translate-descriptions.ts` | `npm run translate` | Translates game descriptions to Bulgarian via Anthropic Claude | `DATABASE_URL`, `ANTHROPIC_API_KEY` |
| `upload-images.ts` | `npm run upload:images` | Uploads game images to Cloudflare R2 | `DATABASE_URL`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` |
| `refresh-types.ts` | `npm run import:mechanics` | Refreshes game types and mechanics from BGG | `DATABASE_URL`, `MEILI_HOST`, `MEILI_API_KEY` |
| `refresh-bgg-rank.ts` | `npm run bgg:refresh-rank` | Refreshes BGG rank data for all games | `DATABASE_URL` |
| `sync-category-ranks.ts` | `npm run sync:ranks` | Syncs category rank data | `DATABASE_URL` |
| `send-partner-email.ts` | `npm run partners:send` | Sends partner inquiry emails via Resend | `RESEND_API_KEY`, `RESEND_PARTNERS_FROM` |
| `write-article.ts` | `npm run write:article` | Generates a Sanity CMS article via Anthropic Claude | `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN` |
| `scan-mixed-scripts.ts` | _(run directly)_ | Scans game descriptions for mixed Latin/Cyrillic homoglyphs (QA tool for AI-translated content) | `DATABASE_URL` |
| `make-admin.ts` | _(run directly)_ | Promotes a user to ADMIN role: `npx tsx scripts/make-admin.ts <email>` | `DATABASE_URL` |

## One-off scripts

Historical scripts in `scripts/one-off/` were run once and are kept for reference. They are excluded from TypeScript compilation (`scripts/one-off` is in `tsconfig.json` `exclude`).

## BGG data dump

`import-games.ts` (and some one-off scripts) expects a BoardGameGeek data dump ZIP file. The file is **not committed** to the repository (`data/*.zip` is gitignored).

To use it:
1. Download the BGG data export from the BoardGameGeek Data Exchange or request it from the maintainer.
2. Place the ZIP file at `data/boardgames_ranks_YYYY-MM-DD.zip` (the date in the filename can be anything).
3. Set `BGG_DUMP_FILE` in your `.env.local` to the absolute path of the file, or pass `--dump-file` as a CLI arg if the script supports it.
