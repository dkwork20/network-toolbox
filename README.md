# NetOps Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A privacy-focused, client-side network toolkit with 30+ browser-based tools for network engineers, developers, and power users. All calculations run entirely in your browser — no data ever leaves your machine.

## Features

### Network Tools
- **IP Calculator** — Generate minimized AllowedIPs CIDR lists for WireGuard
- **Subnet Visualizer** — Interactive subnet breakdown and visualization
- **DNS Lookup** — Query DNS records
- **Diagnostics** — Network diagnostics and latency checks
- **MAC Lookup**, **Port Scanner**, **Ping Monitor**, **HTTP Headers**, **SSL Checker**, **Whois Lookup**, **Speed Test**

### Encoding & Data
- **UUID Generator**, **Hash Calculator**, **Base64 Encoder/Decoder**, **URL Encoder/Decoder**, **JSON Formatter**, **Color Picker**, **QR Generator**

### Security
- **Password Generator** — Secure password creation with strength indicator
- **Bcrypt Hash** — Hash and verify bcrypt passwords
- **Log Sanitizer** — Mask sensitive data in log output

### Developer
- **JWT Debugger**, **Certificate Decoder**, **Unit Converter**, **Timestamp Converter**, **Cron Expression Generator**, **Regex Tester**, **Diff Viewer**, **Markdown Preview**, **Docker Compose Editor**

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) 2.x + [Svelte](https://svelte.dev/) 5 (Runes)
- **UI**: [Skeleton](https://www.skeleton.dev/) 4.x + [Tailwind CSS](https://tailwindcss.com/) 4.x
- **Headless UI**: [Bits UI](https://bits-ui.com/) 2.x
- **Icons**: [Lucide](https://lucide.dev/)
- **Language**: TypeScript 5.x (strict mode)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/dkwork20/network-toolbox.git
cd network-toolbox

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5770](http://localhost:5770) in your browser.

### Other Commands

```bash
npm run build    # Production build
npm run preview  # Preview production build
npm run check    # Type checking
npx vitest       # Run tests
```

## Project Structure

```
src/
├── lib/
│   ├── components/   # Navbar, Footer, shared UI components
│   ├── utils/        # CIDR calculator, IP helpers
│   ├── workers/      # Web Workers for heavy computation
│   └── data/         # Changelog, tool metadata
└── routes/
    ├── +page.svelte  # Homepage
    └── tools/        # Individual tool pages (30+)
```

## Privacy

This project is designed with privacy as a core principle:

- All computations run client-side in the browser
- No telemetry, analytics, or tracking
- No data is sent to any server
- No accounts or sign-ups required

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make your changes and verify
npm run check
npx vitest

# Commit and push
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
