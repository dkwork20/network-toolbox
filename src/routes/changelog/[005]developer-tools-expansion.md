# Developer Tools Expansion

**Version:** 0.5.0  
**Date:** 2026-01-27  
**Type:** feat

## Summary

Expanded developer toolkit with debugging and conversion utilities.

## Changes

### Features

- **JWT Debugger**
  - Decode and inspect JWT tokens
  - Header, payload, and signature display
  - Algorithm detection

- **X.509 Certificate Decoder**
  - Parse PEM-encoded certificates
  - Display certificate details
  - Chain validation info

- **Config Converter (JSON/YAML)**
  - Convert between JSON and YAML
  - TOML support (input only)
  - Format and validate

- **Interactive Cron Generator**
  - crontab.guru-style interface
  - Visual schedule builder
  - Natural language descriptions

- **Changelog Timeline**
  - Visual changelog display
  - Version history tracking

### Fixes

- **Home Page build errors (dnd-kit-svelte)**
  - Fixed hydration issues
  - Resolved import errors

- **Cron Generator runtime crashes**
  - Fixed null reference errors
  - Improved error handling

- **Timestamp Tool mobile layout overflow**
  - Fixed horizontal scrolling
  - Responsive grid improvements

## Technical Details

- `@peculiar/x509` for certificate parsing
- `js-yaml` for YAML processing
- Custom cron parser implementation

## Routes

- `/tools/jwt`
- `/tools/cert`
- `/tools/converter`
- `/tools/cron`
