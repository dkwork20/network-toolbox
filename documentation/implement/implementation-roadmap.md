# NetOps Solutions - Implementation Roadmap

## Overview

This roadmap outlines the phased implementation plan for expanding the NetOps Solutions toolkit with new features. The plan is organized by priority and estimated effort.

## Current State

**Existing Tools (10)**
- Network: IP Calculator, Subnet Visualizer, DNS Lookup, Diagnostics
- Utility: Log Sanitizer
- Developer: JWT Debugger, Cert Decoder, Converter, Timestamp, Cron Generator

## Phase 1: Quick Wins (Week 1-2)

**Goal**: Rapidly expand toolkit with minimal effort tools using native APIs

| Priority | Tool | Effort | Dependencies |
|----------|------|--------|--------------|
| 1 | UUID Generator | 2-3h | None |
| 2 | Base64 Encoder/Decoder | 4-6h | None |
| 3 | URL Encoder/Decoder | 3-4h | None |
| 4 | Password Generator | 4-6h | None |
| 5 | Color Picker | 3-4h | None |
| 6 | JSON Formatter | 3-4h | Optional: jsonpath-plus |

**Total Estimated: ~20-27 hours**

### Deliverables
- 6 new tools
- New "Encoding & Data" category
- New "Security" category
- All tools fully functional with copy/download capabilities

## Phase 2: Data & Encoding Tools (Week 3-4)

**Goal**: Add file handling and more complex encoding features

| Priority | Tool | Effort | Dependencies |
|----------|------|--------|--------------|
| 1 | Image Base64 Tool | 6-8h | None |
| 2 | Hash Calculator | 4-6h | Optional: spark-md5 |
| 3 | QR Code Generator | 4-5h | qrcode |
| 4 | Regex Tester | 4-5h | None |

**Total Estimated: ~18-24 hours**

### Deliverables
- 4 new tools
- Image drag & drop, URL fetch, clipboard paste
- Multiple hash algorithms
- QR codes for URL, WiFi, vCard

## Phase 3: Developer Tools (Week 5-6)

**Goal**: Enhance developer productivity

| Priority | Tool | Effort | Dependencies |
|----------|------|--------|--------------|
| 1 | Diff Viewer | 3-4h | diff |
| 2 | Regex Tester | (Phase 2) | - |

**Total Estimated: ~3-4 hours**

### Deliverables
- Side-by-side and unified diff views
- Syntax highlighting for changes

## Phase 4: Network Tools Expansion (Week 7-8)

**Goal**: Strengthen the core network tooling niche

| Priority | Tool | Effort | Dependencies |
|----------|------|--------|--------------|
| 1 | IP Range Calculator | 4-5h | Existing ip.ts |
| 2 | MAC Address Lookup | 3-4h | OUI database |

**Total Estimated: ~7-9 hours**

### Deliverables
- Comprehensive IP conversion tool
- Vendor identification from MAC addresses

## Phase 5: Fix Existing Gaps (Week 9)

**Goal**: Complete incomplete features in existing tools

| Priority | Task | Effort |
|----------|------|--------|
| 1 | TOML output in Converter | 2-3h |
| 2 | Latency Check in Diagnostics | 3-4h |
| 3 | IPv6 Subnet Visualization | 6-8h |
| 4 | Expand test coverage | 4-6h |

**Total Estimated: ~15-21 hours**

## Category Structure (Final)

```
NetOps Solutions
├── Network Tools (6)
│   ├── IP Calculator ✓
│   ├── Subnet Visualizer ✓
│   ├── DNS Lookup ✓
│   ├── Diagnostics ✓
│   ├── IP Range Calculator ⬚
│   └── MAC Lookup ⬚
│
├── Encoding & Data (7)
│   ├── Base64 Encoder ⬚
│   ├── URL Encoder ⬚
│   ├── JSON Formatter ⬚
│   ├── Hash Calculator ⬚
│   ├── QR Generator ⬚
│   ├── Image Base64 ⬚
│   └── Color Picker ⬚
│
├── Security (2)
│   ├── Log Sanitizer ✓
│   └── Password Generator ⬚
│
└── Developer (6)
    ├── JWT Debugger ✓
    ├── Cert Decoder ✓
    ├── Converter ✓
    ├── Timestamp ✓
    ├── Cron Generator ✓
    ├── Regex Tester ⬚
    ├── Diff Viewer ⬚
    └── UUID Generator ⬚
```

**Legend**: ✓ Existing | ⬚ New

## Dependencies Summary

### Required (npm install)
```bash
# Phase 2
npm install qrcode
npm install -D @types/qrcode

# Phase 2 (optional, for MD5)
npm install spark-md5
npm install -D @types/spark-md5

# Phase 3
npm install diff
npm install -D @types/diff

# Phase 1 (optional, for JSONPath)
npm install jsonpath-plus
```

### Optional
- Full OUI database for MAC lookup (embedded mini version included)

## File Structure Additions

```
src/routes/tools/
├── uuid/+page.svelte
├── base64/+page.svelte
├── url/+page.svelte
├── password/+page.svelte
├── color/+page.svelte
├── json/+page.svelte
├── image-base64/+page.svelte
├── hash/+page.svelte
├── qr/+page.svelte
├── regex/+page.svelte
├── diff/+page.svelte
├── iprange/+page.svelte
└── mac/+page.svelte
```

## Homepage Updates Required

### Tool Cards Addition
Add each new tool to the `tools` array in `src/routes/+page.svelte`.

### Category Updates
Add two new categories to the `categories` array:
```typescript
{ id: "encoding", label: "Encoding & Data" },
{ id: "security", label: "Security" },
```

### Icon Imports
Add new icon imports from `@lucide/svelte`:
```typescript
import {
  // ... existing
  Fingerprint,    // UUID
  Binary,         // Base64
  Link,           // URL
  KeyRound,       // Password
  Palette,        // Color
  FileJson,       // JSON
  Image,          // Image Base64
  Hash,           // Hash
  QrCode,         // QR
  Regex,          // Regex
  GitCompare,     // Diff
  Network,        // MAC (reuse)
  Calculator,     // IP Range (reuse)
} from "@lucide/svelte";
```

## Navbar Updates Required

Add new tools to appropriate dropdown menus in `src/lib/components/Navbar.svelte`.

## Testing Requirements

Each new tool should include:
1. Manual testing checklist (see individual feature docs)
2. Unit tests for utility functions
3. Cross-browser testing (Chrome, Firefox, Safari, Edge)
4. Mobile responsive testing
5. Dark mode verification

## Performance Considerations

- **Image Base64**: Large files may cause UI lag; consider file size warnings
- **Hash Calculator**: SHA-512 on large files may take time; show progress
- **QR Generator**: Very long text may exceed QR capacity; show error
- **Diff Viewer**: Very large files may cause memory issues; set limits

## Security Considerations

- All tools run client-side (no data leaves browser)
- Password Generator uses `crypto.getRandomValues()` for secure randomness
- No external API calls except optional URL fetch in Image Base64
- No sensitive data logging

## Success Metrics

- All Phase 1-4 tools implemented and functional
- Homepage properly displays all 21+ tools
- All tools have consistent UI/UX patterns
- Mobile responsive across all tools
- Dark mode working correctly
- Copy/download functionality works
- Error handling is user-friendly

## Timeline Summary

| Phase | Duration | Tools Added |
|-------|----------|-------------|
| Phase 1 | Week 1-2 | 6 tools |
| Phase 2 | Week 3-4 | 4 tools |
| Phase 3 | Week 5-6 | 1 tool |
| Phase 4 | Week 7-8 | 2 tools |
| Phase 5 | Week 9 | Gap fixes |
| **Total** | **9 weeks** | **13 new tools** |

## Notes

- Timelines are estimates and may vary based on complexity discovery
- Each tool includes comprehensive documentation in its feature doc
- All tools follow existing Svelte 5 Runes patterns
- Consistent use of Skeleton Labs components for UI
- Toast notifications via existing toaster system
