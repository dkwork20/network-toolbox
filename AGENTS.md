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
<span class="badge variant-soft-secondary text-xs">{tool.version}</span>
```

## Version Badges

Add to tool page header:

```html
<span class="badge variant-filled-secondary text-xs">V0.x</span>
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

## Git Workflow

**IMPORTANT**: Never auto-commit. Only commit when explicitly instructed by user and perform the changelog generation step first before the flow UNLESS user asks to DIRECT COMMIT.

```bash
git checkout -b feature/xxx
npm run check && npx vitest
# Wait for user to request commit
git add . && git commit -m "feat: description"
git push && create PR
```

## Changelog Generation

When request git commit meaning releasing a new version, generate changelog files:

### 1. Update `src/lib/data/changelog.ts`

Add new entry at top of array:

```typescript
{
  version: "0.11.0",
  date: "YYYY-MM-DD",
  title: "Release Title",
  changes: [
    { type: 'feat', text: "Added X tool" },
    { type: 'fix', text: "Fixed Y issue" },
  ]
}
```

### 2. Generate Markdown File

Create `src/routes/changelog/[xxx]-kebab-case-title.md`:

```markdown
# Release Title

**Version:** 0.11.0  
**Date:** YYYY-MM-DD  
**Type:** feat|fix|chore

## Summary

Brief overview of this release.

## Changes

### Features

- **New Tool** (`/tools/xxx`) - Brief description

### Fixes

- Fixed issue in tool

### Technical Details

- Implementation notes

## Route

`/tools/xxx`

## File Changes (REQUIRED - must list all modified files)

- `src/routes/tools/xxx/+page.svelte` - New tool / enhancement
- `src/routes/+page.svelte` - Homepage changes (if any)
- `src/lib/components/Navbar.svelte` - Navigation changes (if any)
- `src/lib/data/changelog.ts` - Added entry
- Any other modified files...
```

### Naming Convention

- Use 3-digit sequence: `[001]`, `[002]`, etc.
- Kebab-case: `[011]-release-name.md`

### Checklist

- [ ] Update changelog.ts with version entry
- [ ] Create markdown file in routes/changelog/
- [ ] Add version badge to new tool pages
- [ ] Run `npm run check`
- [ ] Test new tools

## Docs

- Skeleton: https://www.skeleton.dev/llms.txt
- Bits-UI: https://bits-ui.com/llms.txt
