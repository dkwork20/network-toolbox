# AGENTS.md - Project Context for AI Assistants

## Project Overview

**NetOps Solutions** (formerly WireGuard Helper) is a privacy-focused, client-side web toolkit for network operations, development, and security tasks. The application runs entirely in the browser with no backend dependencies, ensuring user data never leaves their device.

### Core Purpose
Generate minimized AllowedIPs CIDR lists for WireGuard VPN configurations, supporting multiple exclusion ranges to prevent routing conflicts (e.g., keeping LAN traffic local while routing other traffic through VPN).

### Tech Stack (Latest Versions)

| Category | Technology |
|----------|------------|
| Framework | SvelteKit 2.x with Svelte 5 (Runes) |
| UI Components | Skeleton Labs 4.x (`@skeletonlabs/skeleton-svelte`) |
| Styling | Tailwind CSS 4.x with Concord theme |
| Headless UI | Bits-UI 2.x |
| Icons | Lucide Svelte |
| Language | TypeScript 5.x (strict mode) |
| Build Tool | Vite 7.x |
| Testing | Vitest |
| Drag & Drop | @dnd-kit-svelte |

### Key Documentation Links (LLM-Ready)
- Skeleton: https://www.skeleton.dev/llms.txt
- Bits-UI: https://bits-ui.com/llms.txt

## Project Structure

```
src/
├── app.css                    # Global styles (Tailwind + Skeleton + Concord theme)
├── app.html                   # HTML template with dark mode detection
├── app.d.ts                   # TypeScript declarations
├── lib/
│   ├── index.ts               # Library exports
│   ├── toaster.svelte.ts      # Global toast notification system
│   ├── assets/
│   │   └── favicon.svg
│   ├── components/
│   │   ├── Footer.svelte
│   │   ├── Navbar.svelte      # Navigation with dropdown menus, mobile responsive
│   │   ├── Simulator.svelte   # Routing simulator for IP testing
│   │   └── SortableQuickLink.svelte  # Draggable quick links
│   ├── data/
│   │   └── changelog.ts
│   ├── utils/
│   │   ├── cidr.ts            # Core CIDR calculation algorithm (BigInt-based)
│   │   ├── cidr.test.ts       # Unit tests for CIDR logic
│   │   ├── ip.ts              # IPv4/IPv6 parsing and conversion utilities
│   │   └── scripts.ts         # OS routing script generators
│   └── workers/
│       └── calculator.worker.ts  # Web Worker for async CIDR calculations
└── routes/
    ├── +layout.svelte         # Root layout (Navbar + Footer + Toast)
    ├── +page.svelte           # Homepage with tool cards and quick links
    ├── changelog/
    │   └── +page.svelte
    └── tools/
        ├── cert/              # X.509 Certificate Decoder
        ├── converter/         # JSON/YAML/TOML Converter
        ├── cron/              # Cron Expression Generator
        ├── diagnostics/       # WebRTC & Connectivity Diagnostics
        ├── dns/               # DNS Lookup (DoH)
        ├── ip/                # IP Calculator (Main CIDR tool)
        ├── jwt/               # JWT Debugger
        ├── sanitizer/         # Log Sanitizer
        ├── subnet/            # Subnet Visualizer
        └── timestamp/         # Unix Timestamp Tool
```

## Building and Running

### Development Server
```bash
npm run dev
```
Server runs on port **5770** (configured in `vite.config.ts`).

### Production Build
```bash
npm run build
npm run preview    # Preview production build
```

### Type Checking
```bash
npm run check           # Single check
npm run check:watch     # Watch mode
```

### Testing
```bash
npx vitest              # Run tests
npx vitest run          # Single run (no watch)
```

## Architecture & Design Patterns

### Svelte 5 Runes
The project uses Svelte 5's new reactivity system (Runes):
- `$state()` for reactive state
- `$effect()` for side effects
- `$props()` for component props
- `$derived()` for computed values

### Web Worker Pattern
Heavy CIDR calculations are offloaded to a Web Worker (`calculator.worker.ts`) to prevent UI blocking. The worker communicates via postMessage:
```typescript
// Main thread
worker.postMessage({ excludes, fullRanges });
worker.onmessage = (e) => { /* handle result */ };

// Worker thread
self.onmessage = (e) => {
  const result = calculateAllowedIPs(excludes, fullRanges);
  self.postMessage({ result });
};
```

### BigInt for IP Calculations
All IP calculations use BigInt for precision:
- IPv4: 32-bit values
- IPv6: 128-bit values
- No floating-point precision issues

### CIDR Algorithm Flow
1. **Parse** input CIDRs → `{start, end, version}` intervals
2. **Merge** overlapping/adjacent intervals (same IP version)
3. **Subtract** excluded intervals from base range (`0.0.0.0/0`, `::/0`)
4. **Convert** remaining intervals to minimal CIDR list

### Component Architecture
- **Layout** (`+layout.svelte`): Navbar, Footer, Toast container
- **Pages**: Self-contained tool implementations
- **Shared Components**: Navbar, Footer, Simulator, SortableQuickLink
- **Utilities**: Pure functions, no side effects

## Development Conventions

### Code Style
- TypeScript strict mode enabled
- No runtime type checks for internal functions (trust internal code)
- Validate at system boundaries (user input)
- Use Svelte 5 Runes syntax consistently
- Prefer composition over inheritance

### Naming Conventions
- Components: PascalCase (e.g., `Simulator.svelte`)
- Utilities: camelCase (e.g., `calculateAllowedIPs`)
- Routes: lowercase with hyphens (handled by SvelteKit)

### Styling
- Use Skeleton component classes (`btn`, `input`, `card`, `alert`)
- Tailwind utility classes for layout
- Dark mode via `.dark` class on `<html>` element
- Theme: Skeleton Concord

### Error Handling
- Toast notifications via `toaster.svelte.ts`
- Input validation with user-friendly error messages
- Worker errors propagated to main thread

## Tool Implementations Reference

### IP Calculator (`/tools/ip`)
Main CIDR calculation tool:
- Input: Multi-line CIDR exclusions
- Output: Minimized AllowedIPs list
- Features: Copy to clipboard, [Peer] config generation, routing advice
- Uses Web Worker for calculations

### JWT Debugger (`/tools/jwt`)
- Decodes JWT header, payload, signature
- Real-time decoding on input change
- Base64URL decoding with padding fix

### Certificate Decoder (`/tools/cert`)
- Uses `@peculiar/x509` library
- Parses X.509 certificates
- Displays certificate details

### Converter (`/tools/converter`)
- JSON ↔ YAML ↔ TOML conversion
- Uses `js-yaml` and `toml` packages

### Cron Generator (`/tools/cron`)
- Human-readable cron expressions
- Uses `cron-parser` and `cronstrue`

### DNS Lookup (`/tools/dns`)
- DNS over HTTPS (DoH) queries
- Multiple record types

## Security Considerations

- All calculations run client-side
- No data sent to external servers
- No API keys or secrets in code
- User input validated before processing
- Web Worker isolation for heavy computation

## Common Tasks

### Adding a New Tool
1. Create directory: `src/routes/tools/<tool-name>/`
2. Create `+page.svelte` with tool implementation
3. Add tool card to homepage (`+page.svelte`)
4. Add navigation entry in `Navbar.svelte`

### Modifying CIDR Algorithm
1. Core logic in `src/lib/utils/cidr.ts`
2. IP utilities in `src/lib/utils/ip.ts`
3. Update tests in `cidr.test.ts`
4. Worker in `calculator.worker.ts` if async needed

### Styling Changes
1. Global: `src/app.css`
2. Component-level: Use Skeleton classes + Tailwind
3. Theme customization: Skeleton Concord theme variables

## Known Limitations

- IPv6 CIDR minimization produces more results (expected due to larger address space)
- No backend for sharing/persistence (by design - privacy focus)
- Browser compatibility: Modern browsers with BigInt support

## New Feature Identification Rules

### Overview
All newly added tools from the implementation roadmap must have visual indicators to distinguish them from existing features. This helps users identify recent additions.

### Visual Indicators Required

#### 1. Navigation Menu Markers
Add red `**` suffix to menu item text for new tools:
```html
<!-- Example in Navbar.svelte -->
<a href="/tools/uuid">UUID Generator <span class="text-error-500 font-bold">**</span></a>
```

#### 2. Homepage Tool Cards
Add a "NEW" badge on tool cards:
```html
<!-- Add to tool card header -->
<span class="badge variant-filled-error text-xs">NEW</span>
```

#### 3. Tool Page Header
Add a special header styling with "NEW" indicator:
```html
<!-- In tool +page.svelte header section -->
<h1 class="h1 font-bold flex items-center gap-3">
  <Icon class="size-8 text-primary-500" />
  Tool Name
  <span class="badge variant-filled-error text-xs ml-2">NEW</span>
</h1>
```

### Current New Tools List

Update this list as phases are completed. Remove markers when tools are considered "established" (after ~3 months or user feedback).

**Phase 1 (Current):**
- `/tools/uuid` - UUID Generator
- `/tools/hash` - Hash Calculator
- `/tools/base64` - Base64 Encoder
- `/tools/url` - URL Encoder
- `/tools/json` - JSON Formatter
- `/tools/color` - Color Picker
- `/tools/password` - Password Generator

**Phase 2 (Planned):**
- `/tools/image-base64` - Image Base64 Tool
- `/tools/qr` - QR Code Generator
- `/tools/regex` - Regex Tester

**Phase 3 (Planned):**
- `/tools/diff` - Diff Viewer

**Phase 4 (Planned):**
- `/tools/iprange` - IP Range Calculator
- `/tools/mac` - MAC Address Lookup

### Implementation Checklist for New Tools

When adding a new tool, ensure:
1. ✅ Add tool to homepage `tools` array with `isNew: true` property
2. ✅ Add `<span class="text-error-500 font-bold">**</span>` in Navbar.svelte menu items
3. ✅ Add `<span class="badge variant-filled-error text-xs">NEW</span>` in tool page header
4. ✅ Update this AGENTS.md section with the new tool

### Removing New Indicators

When a tool is no longer "new":
1. Remove `isNew: true` from homepage tools array
2. Remove `**` markers from Navbar.svelte
3. Remove NEW badge from tool page header
4. Update this AGENTS.md section

## Git Workflow

The project uses Git with remote: `https://github.com/dkwork20/network-toolbox.git`

Standard workflow:
1. Create feature branch
2. Make changes
3. Run `npm run check` for type errors
4. Run tests if applicable
5. Commit with descriptive message
6. Push and create PR
