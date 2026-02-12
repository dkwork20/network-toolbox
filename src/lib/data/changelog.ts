export interface ChangelogEntry {
    version: string;
    date: string;
    title: string;
    changes: {
        type: 'feat' | 'fix' | 'chore' | 'docs';
        text: string;
    }[];
}

export const changelog: ChangelogEntry[] = [
    {
        version: "0.11.0",
        date: "2026-02-13",
        title: "Docker Tool Enhancement",
        changes: [
            { type: 'feat', text: "Added YAML file import with drag-and-drop support" },
            { type: 'feat', text: "Added raw YAML editor with line numbers and error highlighting" },
            { type: 'feat', text: "Added extra fields support for custom/unknown YAML properties" },
            { type: 'feat', text: "Added command field as textarea for multi-line commands" },
            { type: 'fix', text: "Fixed light mode display issues in Docker tool" },
        ]
    },
    {
        version: "0.10.0",
        date: "2026-02-12",
        title: "Phase 5: Fixes & Additional Tools",
        changes: [
            { type: 'feat', text: "Added HTTP Headers Analyzer with WCAG scoring" },
            { type: 'feat', text: "Added Port Scanner for network availability checking" },
            { type: 'feat', text: "Added Ping/Latency Monitor with history tracking" },
            { type: 'feat', text: "Added SSL/TLS Checker for certificate validation" },
            { type: 'feat', text: "Added Whois Lookup for domain/IP registration info" },
            { type: 'feat', text: "Added Network Speed Test with bandwidth measurement" },
            { type: 'feat', text: "Added Markdown Preview with GitHub-flavored support" },
            { type: 'feat', text: "Added Docker Compose Generator" },
            { type: 'feat', text: "Added Bcrypt Hash Generator with verification" },
            { type: 'fix', text: "TOML output now works in Converter tool" },
            { type: 'fix', text: "Latency Check fully implemented in Diagnostics" },
            { type: 'fix', text: "IPv6 Subnet Visualization now supported" },
            { type: 'fix', text: "Expanded test coverage to 42 comprehensive tests" },
        ]
    },
    {
        version: "0.9.0",
        date: "2026-02-12",
        title: "Phase 4: Network Tools Expansion",
        changes: [
            { type: 'feat', text: "Added IP Range Calculator (CIDR/Range/Netmask conversion)" },
            { type: 'feat', text: "Added MAC Address Lookup with vendor identification" },
            { type: 'feat', text: "Embedded OUI database for vendor lookups" },
        ]
    },
    {
        version: "0.8.0",
        date: "2026-02-12",
        title: "Phase 3: Developer Tools Enhancement",
        changes: [
            { type: 'feat', text: "Added Diff Viewer with side-by-side and unified views" },
            { type: 'feat', text: "Line-by-line change highlighting" },
        ]
    },
    {
        version: "0.7.0",
        date: "2026-02-12",
        title: "Phase 2: Data & Encoding Tools Expansion",
        changes: [
            { type: 'feat', text: "Added Hash Calculator (SHA-256, SHA-512, etc.)" },
            { type: 'feat', text: "Added QR Code Generator for URLs, WiFi, vCard" },
            { type: 'feat', text: "Added Regex Tester with real-time matching" },
            { type: 'feat', text: "Image to Base64 conversion support" },
        ]
    },
    {
        version: "0.6.0",
        date: "2026-02-12",
        title: "Phase 1: Quick Wins - Encoding & Data Tools",
        changes: [
            { type: 'feat', text: "Added UUID Generator with bulk generation" },
            { type: 'feat', text: "Added Base64 Encoder/Decoder with UTF-8 support" },
            { type: 'feat', text: "Added URL Encoder/Decoder with query builder" },
            { type: 'feat', text: "Added Password Generator with strength indicator" },
            { type: 'feat', text: "Added Color Picker with WCAG contrast checker" },
            { type: 'feat', text: "Added JSON Formatter with minify and validate" },
            { type: 'feat', text: "New 'Encoding & Data' category added" },
        ]
    },
    {
        version: "0.5.0",
        date: "2026-01-27",
        title: "Developer Tools Expansion",
        changes: [
            { type: 'feat', text: "Added JWT Debugger tool" },
            { type: 'feat', text: "Added X.509 Certificate Decoder" },
            { type: 'feat', text: "Added Config Converter (JSON/YAML)" },
            { type: 'feat', text: "Implemented Interactive Cron Generator (crontab.guru style)" },
            { type: 'feat', text: "Implemented Changelog Timeline" },
            { type: 'fix', text: "Resolved Home Page build errors (dnd-kit-svelte)" },
            { type: 'fix', text: "Fixed Cron Generator runtime crashes" },
            { type: 'fix', text: "Fixed Timestamp Tool mobile layout overflow" },
        ]
    },
    {
        version: "0.4.0",
        date: "2026-01-27",
        title: "Network Diagnostics",
        changes: [
            { type: 'feat', text: "Added Unix Timestamp Converter" },
            { type: 'feat', text: "Added Duration Converter to Timestamp tools" },
            { type: 'feat', text: "Added WebRTC Leak Test tool" },
            { type: 'feat', text: "Updated navigation bar structure" },
            { type: 'feat', text: "Added DNS Lookup Tool" },
            { type: 'feat', text: "Added IP Calculator (Excluded Ranges)" },
            { type: 'fix', text: "Fixed Cron Generator layout on mobile and desktop" },
        ]
    },
    {
        version: "0.3.0",
        date: "2026-01-27",
        title: "Privacy Tools",
        changes: [
            { type: 'feat', text: "Added Log Sanitizer tool" },
            { type: 'feat', text: "Implemented Domain Name Masking (Domain Only / Full URI)" },
            { type: 'fix', text: "Refined regex to ignore common file extensions" },
        ]
    },
    {
        version: "0.2.0",
        date: "2026-01-27",
        title: "Visual Subnet Calculator",
        changes: [
            { type: 'feat', text: "Added Visual IP/CIDR Splitter tool" },
            { type: 'feat', text: "Implemented recursive subnet splitting visualizer" },
        ]
    },
    {
        version: "0.1.0",
        date: "2026-01-26",
        title: "Core IPv6 Support",
        changes: [
            { type: 'feat', text: "Full IPv6 support for WireGuard Calculator" },
            { type: 'feat', text: "Implemented 128-bit integer math for IP ranges" },
            { type: 'fix', text: "Ensured correct IPv6 zero-compression" },
        ]
    }
];
