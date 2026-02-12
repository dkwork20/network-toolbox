# Privacy Tools - Log Sanitizer

**Version:** 0.3.0  
**Date:** 2026-01-27  
**Type:** feat

## Summary

Privacy-focused log sanitization tool for redacting sensitive information.

## Changes

### Features

- **Log Sanitizer tool**
  - Redact sensitive data from logs before sharing
  - Pattern-based detection of sensitive information
  - Custom redaction rules support

- **Domain Name Masking**
  - Domain Only mode - mask domain names
  - Full URI mode - mask complete URLs
  - Configurable masking patterns

### Fixes

- **Refined regex to ignore common file extensions**
  - Prevents false positives on file paths
  - Better context-aware detection

## Technical Details

- Regex-based pattern matching
- Configurable replacement strings
- Preview before/after comparison

## Route

`/tools/sanitizer`
