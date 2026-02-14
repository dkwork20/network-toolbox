# Theme Consistency and Skeleton Preset Migration

**Version:** 0.12.0  
**Date:** 2026-02-14  
**Type:** fix

## Summary

This release aligns theme behavior and styling utilities with Skeleton v4. It fixes Markdown preview theme adaptation, improves persisted theme preference handling, and migrates legacy `variant-*` classes to `preset-*` classes.

## Changes

### Fixes

- **Markdown Preview Theme Sync** (`/tools/markdown`) - Preview now follows app dark/light mode in real time via `html.dark` state.
- **Theme Preference Priority** - Theme bootstrap now prioritizes saved user preference over system preference fallback.

### Technical Details

- Added a migration script with dry-run and write modes for utility-class migration.
- Replaced legacy `variant-*` usage with Skeleton v4-compatible classes across shared components and tools.
- Removed temporary compatibility approach after completing migration.

## Route

`/tools/markdown`

## File Changes (REQUIRED - must list all modified files)

- `AGENTS.md` - Clarified direct-commit override rule in workflow
- `package-lock.json` - Lockfile updates
- `package.json` - Added migration script commands
- `scripts/migrate-variant-to-preset.mjs` - Added migration script
- `src/lib/components/Navbar.svelte` - Theme init fixes and style migration
- `src/lib/components/Simulator.svelte` - Style migration
- `src/lib/components/SortableQuickLink.svelte` - Style migration
- `src/routes/+layout.svelte` - Theme bootstrap fix
- `src/routes/+page.svelte` - Style migration
- `src/routes/changelog/+page.svelte` - Style migration
- `src/routes/tools/base64/+page.svelte` - Style migration
- `src/routes/tools/bcrypt/+page.svelte` - Style migration
- `src/routes/tools/cert/+page.svelte` - Style migration
- `src/routes/tools/color/+page.svelte` - Style migration
- `src/routes/tools/converter/+page.svelte` - Style migration
- `src/routes/tools/cron/+page.svelte` - Style migration
- `src/routes/tools/diagnostics/+page.svelte` - Style migration
- `src/routes/tools/diff/+page.svelte` - Style migration
- `src/routes/tools/dns/+page.svelte` - Style migration
- `src/routes/tools/docker/+page.svelte` - Style migration
- `src/routes/tools/hash/+page.svelte` - Style migration
- `src/routes/tools/headers/+page.svelte` - Style migration
- `src/routes/tools/ip/+page.svelte` - Style migration
- `src/routes/tools/json/+page.svelte` - Style migration
- `src/routes/tools/jwt/+page.svelte` - Style migration
- `src/routes/tools/mac/+page.svelte` - Style migration
- `src/routes/tools/markdown/+page.svelte` - Theme adaptation fix and style migration
- `src/routes/tools/markdown/lib/constants.ts` - Added markdown constants
- `src/routes/tools/markdown/lib/utils.ts` - Added markdown utilities
- `src/routes/tools/password/+page.svelte` - Style migration
- `src/routes/tools/ping/+page.svelte` - Style migration
- `src/routes/tools/port/+page.svelte` - Style migration
- `src/routes/tools/qr/+page.svelte` - Style migration
- `src/routes/tools/regex/+page.svelte` - Style migration
- `src/routes/tools/sanitizer/+page.svelte` - Style migration
- `src/routes/tools/speed/+page.svelte` - Style migration
- `src/routes/tools/ssl/+page.svelte` - Style migration
- `src/routes/tools/subnet/+page.svelte` - Style migration
- `src/routes/tools/timestamp/+page.svelte` - Style migration
- `src/routes/tools/url/+page.svelte` - Style migration
- `src/routes/tools/uuid/+page.svelte` - Style migration
- `src/routes/tools/whois/+page.svelte` - Style migration
- `src/lib/data/changelog.ts` - Added v0.12.0 entry
- `src/routes/changelog/[012]-theme-preset-migration.md` - Added release markdown
