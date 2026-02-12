# Phase 4: Network Tools Expansion

**Version:** 0.9.0  
**Date:** 2026-02-12  
**Type:** feat

## Summary

Strengthened core network tooling with IP range calculator and MAC lookup.

## Changes

### Features

- **IP Range Calculator** (`/tools/iprange`)
  - CIDR ↔ Range ↔ Netmask conversion
  - Network and broadcast address calculation
  - First/last usable host display
  - Wildcard mask calculation
  - Total and usable host count
  - Quick reference table for common CIDRs

- **MAC Address Lookup** (`/tools/mac`)
  - Vendor identification from OUI database
  - MAC format conversion (colon, hyphen, dot, compact)
  - Random MAC address generator
  - Multicast/unicast bit control
  - Locally administered bit control

### Technical Details

- Extended existing `ip.ts` utilities
- Embedded OUI database with major vendors
- IEEE standard MAC address format handling
- BigInt for IPv6 range calculations

## Routes

- `/tools/iprange`
- `/tools/mac`
