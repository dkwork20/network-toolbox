# Docker Tool Enhancement

**Version:** 0.11.0  
**Date:** 2026-02-13  
**Type:** feat

## Summary

Enhanced the Docker Compose Generator tool with YAML import/export capabilities and improved editing experience.

## Changes

### Features

- **YAML File Import** - Import docker-compose.yml files via file picker or drag-and-drop
- **Raw YAML Editor** - Full-featured editor with line numbers and real-time error highlighting
- **Extra Fields Support** - Handle any custom/unknown YAML properties not in the standard schema
- **Multi-line Command** - Added textarea for command field to support complex multi-line commands
- **Light Mode Fix** - Fixed display issues in light mode for better cross-theme compatibility

## Breaking Changes

None

## Migration Guide

None - this release only adds new features and fixes

## Route

`/tools/docker`

## File Changes

- `src/routes/tools/docker/+page.svelte` - Enhanced with YAML import, editor mode, extra fields, version badge updated to V0.11
- `src/routes/+page.svelte` - Updated Docker Compose tool version to V0.11
- `src/lib/data/changelog.ts` - Added v0.11.0 entry
- `src/routes/changelog/[011]-docker-tool-enhancement.md` - Created changelog
