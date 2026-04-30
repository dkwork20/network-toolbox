# WireGuard AllowedIPs / Masking Calculator & Toolkit

## Overview

A tool to help users generate minimized AllowedIPs CIDR lists for WireGuard, supporting multiple exclusion ranges to prevent routing conflicts (e.g., keeping LAN traffic local).

## Tech Stack ( All using latest version)

- **Framework**: SvelteKit
- **UI Component Library**: Skeleton
  - **Documentation**: [LLMS Guide](https://www.skeleton.dev/llms.txt)
- **Styling**: Tailwind CSS
- **Headless UI**: Bits-UI
  - **Documentation**: [LLMS Guide](https://bits-ui.com/llms.txt)
- **Language**: TypeScript

## Core Features (MVP)

1.  **Input**:
    - Multi-line text area for excluded CIDRs (e.g., `192.168.0.0/24`).
    - Format validation and error highlighting.
2.  **Calculation**:
    - BigInt-based algorithm to subtract excluded ranges from `0.0.0.0/0`.
    - Generate minimal CIDR list (non-overlapping).
    - Web Worker support for performance.
3.  **Output & Export**:
    - Display results in various formats (comma-separated, one per line).
    - Copy to clipboard.
    - Generate `[Peer]` or `[Interface]` configuration snippets.
4.  **Routing Advice**:
    - Generate `ip route` commands for Windows, Linux, macOS based on gateway/interface.

## Advanced Features (Roadmap)

- IPv6 support.
- Allow/Exclude combined editor.
- Visual conflict detection.
- CLI / VS Code extension.

## User Journey

1.  User inputs LAN / Reserved IP ranges to exclude.
2.  Tool calculates the remaining IP space in CIDR format.
3.  User copies the result to their WireGuard config (`AllowedIPs`).
4.  Optionally, user gets routing commands to ensure local traffic stays local.
