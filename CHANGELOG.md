# Changelog

## [Unreleased]

### Fixed

- **Home Page**: Resolved build errors by removing invalid `SortableContext` import and implementing a local `arrayMove` helper for `dnd-kit-svelte` integration.
- **Cron Tool**: Fixed runtime error (`parseExpression is not a function`) by correctly using `CronExpressionParser.parse` from `cron-parser`.
- **Timestamp Tool**: Fixed mobile layout overflow issues. Added `w-full`, `min-w-0`, and responsive flex directions to inputs and breakdown grids.
