# Phase 2: Data & Encoding Tools Expansion

**Version:** 0.7.0  
**Date:** 2026-02-12  
**Type:** feat

## Summary

Added file handling, hash calculation, and QR code generation capabilities.

## Changes

### Features

- **Hash Calculator** (`/tools/hash`)
  - SHA-1, SHA-256, SHA-384, SHA-512 algorithms
  - Text and file input support
  - Hash comparison mode
  - MD5 support (via spark-md5)

- **QR Code Generator** (`/tools/qr`)
  - Text, URL, WiFi, vCard, Email, Phone QR codes
  - Size and color customization
  - Error correction levels (L, M, Q, H)
  - Download as PNG or SVG
  - Copy to clipboard as image

- **Regex Tester** (`/tools/regex`)
  - Real-time pattern matching
  - Capture group visualization
  - Common pattern presets
  - Flags toggle (g, i, m, s, u)
  - Code snippet generation

### Dependencies

```bash
npm install qrcode spark-md5
```

### Technical Details

- Web Crypto API for hash calculations
- `qrcode` library for QR generation
- Native RegExp for pattern testing
- Drag & drop file support
