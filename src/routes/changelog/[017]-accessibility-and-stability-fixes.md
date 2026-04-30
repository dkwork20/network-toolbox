# Accessibility & Stability Fixes

**Version:** 0.17.0  
**Date:** 2026-03-03  
**Type:** fix

## Summary

This release resolves several accessibility (a11y) warnings related to form labels and ARIA roles, and addresses deprecation warnings by adopting Svelte 5 continuous improvements for dynamic component rendering.

## Changes

### Fixes

- Resolved associated control warnings for input labels in Base64 and Hash tools.
- Fixed missing semantic ARIA roles on static drag-and-drop elements in the Hash tool.

### Technical Details

- Migrated deprecated `<svelte:component>` instances to use native Svelte 5 `{@const}` component tagging for dynamic icons in the Headers and Password tools.

## Route

- `/tools/base64`
- `/tools/hash`
- `/tools/headers`
- `/tools/password`

## File Changes (REQUIRED - list all modified files)

- `src/routes/tools/base64/+page.svelte` - Fixed `a11y_label_has_associated_control` validation
- `src/routes/tools/hash/+page.svelte` - Fixed `a11y_label_has_associated_control` and `a11y_no_static_element_interactions` validation
- `src/routes/tools/headers/+page.svelte` - Fixed `svelte_component_deprecated` runtime warnings
- `src/routes/tools/password/+page.svelte` - Fixed `svelte_component_deprecated` runtime warnings
- `src/lib/data/changelog.ts` - Added release records
