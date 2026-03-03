# Log Sanitizer Enhancements

**Version:** 0.16.0  
**Date:** 2026-03-03  
**Type:** feat

## Summary

Significantly upgraded the Log Sanitizer tool (V0.3 ~ V0.16) to support advanced privacy masking requirements. Users can now target custom HTML tags, filter specific structural parameter keys (JSON `\u0026` compatible), and utilize auto-expanding accessible interfaces.

## Changes

### Features

- Added live Line and Character count metrics to both the Input and Output areas
- Added HTML Tags Masking with customizable target tag extraction (masks all content between opening and closing tags)
- Added dynamic Token/Key masking using configurable Regex logic (extracting Bearer, ?token=, etc)
- Added Custom Parameter masking with granular termination controls (configurable stops on `&`, `\`, quotes, spaces, and commas) to support raw JSON structured payloads.

### UI / UX

- Output text area now supports an "Auto-Expand Height" toggle which automatically sizes the box to fit content, alongside an ever-present `60vh` default baseline.
- Adjusted Token and HTML toggle labels in the toolbar to support accessible high-contrast color palettes in both Light and Dark themes.
- Redesigned the Replacement Mappings output to use a CSS grid layout, detached from the textarea scrolling logic.
- Double-clicking mapping cards now opens a detailed Modal pane for easy copying and viewing of truncated long keys.
- Masked results in the output renderer are now explicitly highlighted in a bright, theme-agnostic yellow background for quick visual recognition.

## Route

`/tools/sanitizer`

## File Changes

- `src/routes/tools/sanitizer/+page.svelte` - Implemented metrics, HTML tags parsing, Regex tokens configurations, UI redesign, expand height logic, parameter stops, highlight spans, and mapping modals.
