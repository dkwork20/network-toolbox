# Core IPv6 Support

**Version:** 0.1.0  
**Date:** 2026-01-26  
**Type:** feat

## Summary

Initial release with full IPv6 support for WireGuard configuration calculations.

## Changes

### Features

- **Full IPv6 support for WireGuard Calculator**
  - Complete IPv6 address parsing and validation
  - IPv6 CIDR notation support
  - IPv6 address compression and expansion

- **128-bit integer math for IP ranges**
  - BigInt-based calculations for accurate IPv6 range handling
  - Proper overflow protection for large address spaces

### Fixes

- **Correct IPv6 zero-compression**
  - RFC 5952 compliant IPv6 address formatting
  - Proper handling of :: notation

## Technical Details

- Implemented `ipToBigInt()` and `bigIntToIp()` for IPv4/IPv6 conversion
- Added IPv6 validation regex patterns
- Created comprehensive test suite for IP utilities
