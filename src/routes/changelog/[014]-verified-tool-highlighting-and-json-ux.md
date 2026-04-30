# Verified Tool Highlighting and JSON Structure Editor UX

**Version:** 0.14.0  
**Date:** 2026-02-14  
**Type:** feat

## Summary

This release improves trust and usability across key tools. Verified tools now share a centralized metadata source, surface clear visual highlights on the homepage and navbar, and JSON/Base64 workflows receive major UX and performance improvements.

## Changes

### Features
- Added centralized verified metadata with reusable helpers for tool id and route-path checks.
- Added verified visual highlighting on homepage tool cards.
- Added verified visual highlighting and badges in desktop dropdown and mobile navigation.
- Added verified badge on JSON Formatter route header.
- Improved JSON human structure editing workflow with lock/unlock, change tracking, and apply guidance.

### Fixes
- Fixed JSON sample load loop/freeze behavior.
- Fixed auto-navigate usability by keeping focus behavior aligned for continued editing.
- Improved Base64 drag-drop feedback and large paste conversion responsiveness.

### Technical Details
- Unified verified checks through a dedicated data module.
- Connected verified route headers (`base64`, `diff`, `json`) to shared verification metadata.
- Kept existing NEW/version badge behavior while layering verified indicators.

## Route

`/tools/base64`, `/tools/json`, `/tools/diff`

## File Changes (REQUIRED - list all modified files)
- `src/lib/data/verified-tools.ts` - Added central verified route/tool metadata and helper functions.
- `src/routes/+page.svelte` - Added verified card highlighting and verified badge rendering on tool cards.
- `src/lib/components/Navbar.svelte` - Added verified link highlighting and badges in desktop/mobile tool menus.
- `src/routes/tools/base64/+page.svelte` - Wired verified badge rendering to central `isToolVerified` metadata.
- `src/routes/tools/diff/+page.svelte` - Wired verified badge rendering to central `isToolVerified` metadata.
- `src/routes/tools/json/+page.svelte` - Added verified badge and retained latest JSON structure editor UX updates.
- `src/lib/data/changelog.ts` - Added release entry for `0.14.0`.
