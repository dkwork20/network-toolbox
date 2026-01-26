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
        version: "0.5.0",
        date: "2026-01-27",
        title: "Developer Tools Expansion",
        changes: [
            { type: 'feat', text: "Added JWT Debugger tool" },
            { type: 'feat', text: "Added X.509 Certificate Decoder" },
            { type: 'feat', text: "Added Config Converter (JSON/YAML)" },
            { type: 'feat', text: "Implemented Interactive Cron Generator (crontab.guru style)" },
            { type: 'feat', text: "Implemented Changelog Timeline" },
        ]
    },
    {
        version: "0.4.0",
        date: "2026-01-27",
        title: "Network Diagnostics",
        changes: [
            { type: 'feat', text: "Added WebRTC Leak Test tool" },
            { type: 'feat', text: "Updated navigation bar structure" },
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
