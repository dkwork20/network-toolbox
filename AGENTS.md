# AGENTS.md - Project Context

## Overview

**NetOps Solutions** (formerly WireGuard Helper) - privacy-focused, client-side network toolkit. All calculations run in-browser with no backend.

## Tech Stack

- **Framework**: SvelteKit 2.x + Svelte 5 (Runes)
- **UI**: Skeleton Labs 4.x + Tailwind CSS 4.x (Concord theme)
- **Headless UI**: Bits-UI 2.x
- **Testing**: Vitest
- **Drag & Drop**: @dnd-kit-svelte
- **Icons**: Lucide Svelte
- **Language**: TypeScript 5.x (strict mode)

## Project Structure

```
src/
├── lib/
│   ├── components/   # Navbar, Footer, Simulator
│   ├── utils/        # cidr.ts, ip.ts, scripts.ts
│   ├── workers/      # calculator.worker.ts
│   └── data/        # changelog.ts
└── routes/
    └── tools/       # 30+ tool pages
```

## Commands

```bash
npm run dev      # Dev server (port 5770)
npm run build    # Production build
npm run check    # Type checking
npx vitest       # Run tests
```

## Key Patterns

### Svelte 5 Runes

```typescript
$state()    # Reactive state
$effect()   # Side effects (prefer onMount for one-time init)
$derived()  # Computed values
```

### Web Worker

Heavy CIDR calculations run in worker to prevent UI blocking.

### BigInt for IPs

IPv4 (32-bit), IPv6 (128-bit) - no floating-point issues.

## Adding a New Tool

1. Create `src/routes/tools/<name>/+page.svelte`
2. Add tool entry to homepage `+page.svelte` tools array with `version` property
3. Add navigation entry in `Navbar.svelte`
4. Add entry to `changelog.ts`

### Homepage Tool Card

Each tool in `src/routes/+page.svelte` needs:

```typescript
{
  id: "xxx",
  title: "Tool Name",
  desc: "Description",
  icon: IconName,
  href: "/tools/xxx",
  cat: "network|encoding|security|dev",
  version: "V0.x",  // Required - version badge
}
```

Display in card:

```html
<span class="badge preset-tonal-secondary text-xs">{tool.version}</span>
```

## Version Badges

Add to tool page header:

```html
<span class="badge preset-filled-secondary-500 text-xs">V0.x</span>
```

| Version | Tools                                                            |
| ------- | ---------------------------------------------------------------- |
| V0.10   | headers, port, ping, ssl, whois, speed, markdown, docker, bcrypt |
| V0.9    | mac                                                              |
| V0.8    | diff                                                             |
| V0.7    | hash, qr, regex                                                  |
| V0.6    | uuid, base64, url, password, color, json                         |
| V0.5    | jwt, cert, converter, cron                                       |
| V0.4    | timestamp, dns, ip, diagnostics                                  |
| V0.3    | sanitizer                                                        |
| V0.2    | subnet                                                           |

## Git & Release Workflow

### Core Rule

- Never auto-commit.
- Commit only when user explicitly requests commit.
- By default, treat commit request as **Release Commit** workflow.
- Only switch to **Direct Commit** when explicit override keywords appear.

### Mode A: Release Commit (default)

Default trigger: any normal commit request without direct-override wording.

Behavior (MANDATORY):

1. Execute full changelog generation:
   - Update `src/lib/data/changelog.ts` (new entry at top).
   - Create release markdown in `src/routes/changelog/[NNN]-kebab-case-title.md`.
2. Run validation (`npm run check` and `npx vitest`).
3. Then commit.

### Mode B: Direct Commit (explicit override)

Trigger keywords (examples): **"directly"**, **"direct commit"**, **"git commit all directly"**.

Behavior:

- Skip release/changelog generation requirement.
- Commit immediately with current changes (still run validations if feasible unless user says skip).

### Commit Flow Template

```bash
git checkout -b feature/xxx
npm run check && npx vitest
# Wait for user to request commit
git add . && git commit -m "feat|fix|chore: description"
git push && create PR
```

## Changelog Generation (Release Mode Only)

### 1) Update `src/lib/data/changelog.ts`

Add entry at top:

```typescript
{
  version: "0.12.0",
  date: "YYYY-MM-DD",
  title: "Release Title",
  changes: [
    { type: 'feat', text: "Added X" },
    { type: 'fix', text: "Fixed Y" },
    { type: 'chore', text: "Refactored Z" },
  ]
}
```

### 2) Create markdown release note

Create file: `src/routes/changelog/[NNN]-kebab-case-title.md`

```markdown
# Release Title

**Version:** 0.12.0  
**Date:** YYYY-MM-DD  
**Type:** feat|fix|chore

## Summary

Brief overview.

## Changes

### Features
- Item

### Fixes
- Item

### Technical Details
- Item

## Route

`/tools/xxx`

## File Changes (REQUIRED - list all modified files)
- `path/to/file` - reason
```

### Naming Convention

- Sequence format: `[001]`, `[002]`, ...
- Filename format: `[NNN]-kebab-case-title.md`

### Release Checklist

- [ ] `changelog.ts` updated
- [ ] release markdown created
- [ ] homepage/tool version badges updated when relevant
- [ ] `npm run check` passed
- [ ] `npx vitest` passed

## Docs

- Skeleton: https://www.skeleton.dev/llms.txt
- Bits-UI: https://bits-ui.com/llms.txt

## Changelog Management

- After any significant task is completed, confirm commit mode with user when ambiguous.
- Default to Mode A (release with full changelog generation) unless user explicitly asks Mode B (direct commit).
- In Mode A, always generate both `src/lib/data/changelog.ts` and `src/routes/changelog/[NNN]-*.md`.
- Keep change type classification accurate: `feat`, `fix`, `chore`, `docs`.
