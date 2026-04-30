# Diff Viewer Performance Hardening

**Version:** 0.13.0  
**Date:** 2026-02-14  
**Type:** feat

## Summary

This release focuses on making the Diff Viewer reliably smooth on large text inputs by moving expensive computation off the main thread, reducing render cost, and adding a dedicated large-file workflow.

## Changes

### Features

- Added a dedicated diff Web Worker pipeline to keep typing and UI interactions responsive during large comparisons.
- Added virtualized rendering for split and unified outputs so only visible rows are mounted.
- Added **Large File Mode** with configurable context lines (`0/1/3/5/10`) to collapse long unchanged ranges.

### Fixes

- Fixed oversized perceived row height in split diff output by removing unintended vertical grid gap between rows.
- Fixed `storedTheme has already been declared` runtime error by wrapping theme bootstrap variables in an IIFE.

### Technical Details

- Added diff worker request/response contracts and adaptive character-diff budgeting for heavy inputs.
- Added pending recompute scheduling and debounce strategy for frequent text edits.
- Added a `Verified` badge to mark Diff Viewer optimization freeze for personal tracking.

## Route

`/tools/diff`

## File Changes (REQUIRED - must list all modified files)

- `src/lib/workers/diff.worker.ts` - Added workerized diff engine, large-file collapsing, and adaptive char-diff logic.
- `src/routes/tools/diff/+page.svelte` - Added large-file controls, virtualization wiring, spacing fix, and `Verified` badge.
- `src/routes/+layout.svelte` - Fixed theme bootstrap variable redeclaration in head script.
- `src/lib/data/changelog.ts` - Added v0.13.0 changelog entry.
- `src/routes/changelog/[013]-diff-viewer-performance-hardening.md` - Added release markdown for v0.13.0.
