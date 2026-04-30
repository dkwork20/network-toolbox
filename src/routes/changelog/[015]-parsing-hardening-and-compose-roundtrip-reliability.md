# Parsing Hardening, Route Stability, and Compose Round-Trip Reliability

**Version:** 0.15.0  
**Date:** 2026-02-27  
**Type:** fix

## Summary

This release hardens input parsing, fixes subnet correctness issues, improves runtime stability in route UIs, and upgrades Docker Compose import/export fidelity to reduce data loss during round-trip editing.

## Changes

### Fixes
- Hardened IPv4/CIDR validation to reject malformed octets, invalid separators, and trailing prefix garbage.
- Corrected subnet netmask conversion to enforce contiguous masks and fixed IPv6 subnet output formatting.
- Prevented homepage quick-link rendering crashes from malformed URLs.
- Corrected DNS answer type display to use each row's actual record type.
- Improved Docker Compose round-trip behavior for map/array variants and preserved structured unknown fields.

### Technical Details
- Added `ipv4NetmaskToPrefix` utility and expanded CIDR test coverage.
- Added safe URL normalization/sanitization flows in homepage quick links and safe hostname fallback rendering.
- Switched Docker YAML output from manual string concatenation to structured object serialization via `js-yaml`.
- Removed parser debug logging noise in Docker import flow.

## Route

`/tools/ip`, `/tools/dns`, `/tools/docker`, `/`

## File Changes (REQUIRED - list all modified files)
- `src/lib/utils/ip.ts` - Hardened IPv4/CIDR parsing and added contiguous netmask-to-prefix conversion.
- `src/lib/utils/cidr.test.ts` - Added malformed input and non-contiguous netmask regression tests.
- `src/routes/tools/ip/+page.svelte` - Integrated netmask validation utility and canonical IPv6 output formatting.
- `src/routes/+page.svelte` - Added quick-link URL normalization/sanitization and updated tool version badges.
- `src/lib/components/SortableQuickLink.svelte` - Added safe URL checks and non-throw hostname fallback.
- `src/routes/tools/dns/+page.svelte` - Implemented DNS type code map and per-answer type rendering.
- `src/routes/tools/docker/+page.svelte` - Refactored import/export to preserve map/array semantics and structured extra fields.
- `src/lib/data/changelog.ts` - Added v0.15.0 changelog entry.
- `src/routes/changelog/[015]-parsing-hardening-and-compose-roundtrip-reliability.md` - Added release note.
- `AGENTS.md` - Added version badge requirement for updated/bugfix tools (`V0.x ~ V0.y` format).
- `documentation/implement/[003]-session-hardening-comprehensive-plan.md` - Added comprehensive phased implementation plan for this session.

