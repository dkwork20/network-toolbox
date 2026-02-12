# Visual Subnet Calculator

**Version:** 0.2.0  
**Date:** 2026-01-27  
**Type:** feat

## Summary

Interactive visual subnet planning tool with recursive splitting capability.

## Changes

### Features

- **Visual IP/CIDR Splitter tool**
  - Interactive tree-based visualization
  - Click to split subnets into smaller blocks
  - Visual representation of address allocation

- **Recursive subnet splitting visualizer**
  - Split any CIDR block down to /32 (single host)
  - Merge split blocks back together
  - Real-time IP count display

## Technical Details

- Svelte 5 snippets for recursive component rendering
- BigInt calculations for accurate IP range math
- Responsive design with dark mode support

## Route

`/tools/subnet`
