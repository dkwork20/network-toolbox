# Session Comprehensive Plan - Reliability and Correctness Hardening

## Context
This session plan consolidates the review findings into one execution roadmap with phased delivery.

## Session Goals
1. Eliminate incorrect parsing/validation behaviors in core networking logic.
2. Fix user-facing correctness issues in subnet and DNS tools.
3. Prevent homepage runtime crashes from invalid user data.
4. Improve Docker Compose import/export fidelity to avoid data loss.
5. Land changes with strong test coverage and regression safety.

## In-Scope Findings
1. Permissive IPv4/CIDR parsing accepts malformed input.
2. Docker Compose round-trip loses valid data structures/fields.
3. Quick Links can crash rendering on malformed URLs.
4. Netmask mode accepts invalid non-contiguous masks.
5. IPv6 subnet outputs are displayed as raw hex numbers.
6. DNS answer type labels can be inaccurate per row.

## Out of Scope
1. UI redesign or visual restyling.
2. New tool pages/features unrelated to the reviewed issues.
3. Backend/proxy architecture changes.

## Phase Plan

## Phase 1 - Core Input Validation and Parsing Safety
### Target
- `src/lib/utils/ip.ts`
- `src/lib/utils/cidr.test.ts`

### Work
1. Enforce strict IPv4 octet syntax (full numeric match, range 0-255).
2. Harden CIDR parsing:
   - exactly one `/`
   - numeric-only prefix
   - reject trailing garbage
3. Keep valid IPv4/IPv6 CIDR behavior unchanged.

### Deliverables
1. Updated parsing/validation logic.
2. New negative tests for malformed IP/CIDR strings.

### Exit Criteria
1. Invalid forms like `1a.2.3.4` and `/24foo` are rejected.
2. Existing valid CIDR tests remain green.

## Phase 2 - Subnet Calculation Correctness
### Target
- `src/routes/tools/ip/+page.svelte`
- `src/lib/utils/ip.ts` (if helper extraction is needed)

### Work
1. Netmask mode validation:
   - only contiguous mask bits are accepted.
   - prefix derived from leading one bits (not popcount).
2. IPv6 subnet display correction:
   - use `bigIntToIpv6` for all displayed IPv6 addresses.
3. Keep IPv4 display behavior unchanged.

### Deliverables
1. Correct netmask validation and prefix calculation.
2. Human-readable IPv6 output in subnet results.

### Exit Criteria
1. Non-contiguous masks are rejected with clear error.
2. IPv6 fields render in canonical IPv6 notation.

## Phase 3 - Homepage Stability and DNS Accuracy
### Target
- `src/routes/+page.svelte`
- `src/lib/components/SortableQuickLink.svelte`
- `src/routes/tools/dns/+page.svelte`

### Work
1. Quick Links URL hardening:
   - validate and normalize on add/load.
   - guard rendering against `new URL(...)` throw.
   - keep UI usable even with corrupted localStorage data.
2. DNS type rendering:
   - map per-row `answer.type` from numeric code to label.
   - fallback safely for unknown codes.

### Deliverables
1. Crash-proof quick-links behavior.
2. Accurate per-answer DNS type display.

### Exit Criteria
1. Invalid URLs do not break homepage rendering.
2. Mixed DNS answer sets display correct row types.

## Phase 4 - Docker Compose Round-Trip Fidelity
### Target
- `src/routes/tools/docker/+page.svelte`
- Optional extraction: `src/lib/utils/docker-compose.ts`
- Optional tests: `src/lib/utils/docker-compose.test.ts`

### Work
1. Support multiple valid YAML shapes on import:
   - `environment`: array/object
   - `depends_on`: array/object
   - `labels`: array/object
2. Preserve custom/unknown fields without flattening away structure.
3. Replace fragile string-concatenation output with object-based assembly + `yaml.dump`.
4. Remove parse-path debug logs.

### Deliverables
1. Non-lossy import/edit/export flow for common Compose files.
2. Fixture coverage for round-trip behavior.

### Exit Criteria
1. Key fields are no longer silently dropped.
2. Representative Compose fixtures re-export with expected semantics.

## Phase 5 - Verification, Regression Pass, and Session Closure
### Work
1. Run validation and tests:
   - `npm run check`
   - `npx vitest`
2. Execute targeted manual checks for each fixed path.
3. Document any residual risks and follow-up items.

### Exit Criteria
1. Typecheck and tests pass.
2. Manual acceptance checks pass across all six findings.

## Test Strategy Matrix
| Area | Automated | Manual |
|---|---|---|
| IP/CIDR parsing | Unit tests in `cidr.test.ts` | Invalid/valid input smoke checks |
| Netmask correctness | Unit tests (new cases) | UI netmask mode scenarios |
| IPv6 output formatting | Unit/functional checks | UI output verification |
| Quick Links safety | Targeted component/page logic checks | Corrupt localStorage + bad URL flow |
| DNS type labels | Logic assertions | Mixed RR lookup check |
| Docker round-trip | Fixture-based tests | Import/edit/export compose samples |

## Priority and Execution Order
1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5

This order front-loads correctness/security-sensitive logic and defers heavier Docker refactor work until core reliability issues are stabilized.

## Risks and Mitigations
1. Risk: Validation tightening may reject previously accepted user input.
   Mitigation: Add explicit error messages and test real-world valid cases.
2. Risk: Docker export refactor may alter formatting unexpectedly.
   Mitigation: Compare semantic equality via YAML parse, not whitespace formatting.
3. Risk: Quick-links sanitation may hide legacy malformed entries.
   Mitigation: Show safe fallback behavior and avoid runtime throw.

## Session Definition of Done
1. All six findings are addressed in code.
2. Automated checks are green.
3. Manual acceptance checks are completed and documented.
4. No known blocker remains for release-mode commit workflow.

