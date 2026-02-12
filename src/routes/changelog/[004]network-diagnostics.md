# Network Diagnostics

**Version:** 0.4.0  
**Date:** 2026-01-27  
**Type:** feat

## Summary

Network diagnostic and connectivity testing tools.

## Changes

### Features

- **Unix Timestamp Converter**
  - Convert timestamps to human-readable dates
  - Multiple format support

- **Duration Converter**
  - Parse and format time durations
  - Added to Timestamp tools

- **WebRTC Leak Test**
  - Detect WebRTC IP leaks
  - Local and public IP detection

- **DNS Lookup Tool**
  - DNS-over-HTTPS (DoH) queries
  - Multiple record type support (A, AAAA, MX, TXT, NS, CNAME)

- **IP Calculator (Excluded Ranges)**
  - Calculate IP ranges with exclusions
  - Support for multiple exclusion ranges

- **Updated navigation bar structure**
  - Reorganized menu categories
  - Improved mobile navigation

### Fixes

- **Cron Generator layout on mobile and desktop**
  - Fixed responsive issues
  - Improved input field sizing

## Technical Details

- WebRTC API for leak detection
- Fetch API for DoH queries
- BigInt for IP calculations

## Routes

- `/tools/timestamp`
- `/tools/diagnostics`
- `/tools/dns`
- `/tools/ip`
