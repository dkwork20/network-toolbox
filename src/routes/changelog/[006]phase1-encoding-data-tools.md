# Phase 1: Quick Wins - Encoding & Data Tools

**Version:** 0.6.0  
**Date:** 2026-02-12  
**Type:** feat

## Summary

Rapid expansion of toolkit with encoding and data tools using native browser APIs.

## Changes

### Features

- **UUID Generator** (`/tools/uuid`)
  - Generate v4 UUIDs with `crypto.randomUUID()`
  - Bulk generation (1-100 UUIDs)
  - Format options (uppercase, no hyphens)
  - Copy and download functionality

- **Base64 Encoder/Decoder** (`/tools/base64`)
  - Standard Base64 encoding/decoding
  - Base64URL support for JWTs
  - UTF-8 character handling
  - File to Base64 conversion
  - Image preview for decoded images

- **URL Encoder/Decoder** (`/tools/url`)
  - Encode/decode URL components
  - Full URL parsing
  - Query string builder
  - Protocol detection

- **Password Generator** (`/tools/password`)
  - Secure random password generation
  - Customizable length (4-128 characters)
  - Character set toggles
  - Passphrase mode with word list
  - Strength indicator with entropy

- **Color Picker** (`/tools/color`)
  - HEX, RGB, HSL, CMYK conversion
  - WCAG contrast checker
  - Copy in any format
  - Random color generator

- **JSON Formatter** (`/tools/json`)
  - Format with custom indent
  - Minify JSON
  - Validate with error highlighting
  - JSONPath query support (optional)

### Technical Details

- No external dependencies required
- Native Web Crypto API for secure randomness
- Native `btoa()`/`atob()` for Base64
- Native `encodeURIComponent()` for URL encoding

## New Category

Added "Encoding & Data" category to organize data transformation tools.
