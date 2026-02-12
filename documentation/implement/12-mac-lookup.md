# MAC Address Lookup Tool

## Overview

A tool for looking up the vendor/manufacturer of network devices based on their MAC address. Also provides MAC address format conversion and generation capabilities.

## Route

`/tools/mac`

## Category

`network`

## User Stories

1. As a network administrator, I want to identify the vendor of a device from its MAC address
2. As a developer, I want to convert MAC addresses between different formats
3. As a developer, I want to generate random MAC addresses for testing

## Features

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Vendor Lookup | Identify manufacturer from MAC | P0 |
| Format Conversion | Convert between MAC formats | P0 |
| Format Validation | Validate MAC address format | P0 |
| Random MAC Generation | Generate random MAC addresses | P1 |
| Bulk Lookup | Look up multiple MACs | P2 |

### MAC Formats

| Format | Example | Description |
|--------|---------|-------------|
| Colon-separated | 00:1A:2B:3C:4D:5E | Most common |
| Hyphen-separated | 00-1A-2B-3C-4D-5E | Windows format |
| Dot-separated | 001A.2B3C.4D5E | Cisco format |
| No separator | 001A2B3C4D5E | Compact format |

## Technical Implementation

### Dependencies

**Optional**: OUI database (embedded or fetched)

For this implementation, we'll use a small embedded OUI database and/or an API for lookups.

### File Structure

```
src/routes/tools/mac/
└── +page.svelte
```

### Implementation Code

```svelte
<script lang="ts">
  import { Network, Copy, Check, RefreshCw, Shuffle, Search, AlertCircle, CheckCircle } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  interface MacInfo {
    mac: string;
    oui: string;
    vendor: string;
    address: string;
    country: string;
  }

  // State
  let macInput = $state("");
  let macInfo = $state<MacInfo | null>(null);
  let error = $state<string | null>(null);
  let isValid = $state(false);
  let copied = $state(false);
  let isLoading = $state(false);

  // Generated MAC options
  let generatedMac = $state("");
  let generateMulticast = $state(false);
  let generateLocal = $state(true);

  // Format states
  let formattedMacs = $state<{
    colon: string;
    hyphen: string;
    dot: string;
    compact: string;
  } | null>(null);

  // Embedded OUI database (simplified - in production, use full database)
  const ouiDatabase: Record<string, { vendor: string; country: string }> = {
    "00:00:0C": { vendor: "Cisco Systems, Inc", country: "US" },
    "00:00:1A": { vendor: "Dell Inc.", country: "US" },
    "00:00:1B": { vendor: "Novell Inc.", country: "US" },
    "00:05:02": { vendor: "Apple Inc.", country: "US" },
    "00:0A:27": { vendor: "Intel Corporation", country: "US" },
    "00:0C:29": { vendor: "VMware, Inc.", country: "US" },
    "00:0D:3A": { vendor: "Microsoft Corporation", country: "US" },
    "00:0E:0C": { vendor: "Nokia", country: "FI" },
    "00:11:22": { vendor: "Buffalo Inc.", country: "JP" },
    "00:12:3F": { vendor: "Nintendo Co., Ltd.", country: "JP" },
    "00:15:5D": { vendor: "Microsoft Corporation", country: "US" },
    "00:16:3E": { vendor: "Xensource, Inc.", country: "US" },
    "00:17:9A": { vendor: "Apple Inc.", country: "US" },
    "00:18:82": { vendor: "Cisco-Linksys, LLC", country: "US" },
    "00:19:E3": { vendor: "Intel Corporate", country: "US" },
    "00:1A:A0": { vendor: "Apple Inc.", country: "US" },
    "00:1B:21": { vendor: "Intel Corporate", country: "US" },
    "00:1C:42": { vendor: "Parallels, Inc.", country: "US" },
    "00:1D:72": { vendor: "Apple Inc.", country: "US" },
    "00:1E:52": { vendor: "Lite-On Technology Corp.", country: "TW" },
    "00:1F:5B": { vendor: "Apple Inc.", country: "US" },
    "00:1F:F3": { vendor: "LG Electronics", country: "KR" },
    "00:21:E9": { vendor: "Apple Inc.", country: "US" },
    "00:22:41": { vendor: "Cisco-Linksys, LLC", country: "US" },
    "00:23:12": { vendor: "Apple Inc.", country: "US" },
    "00:24:36": { vendor: "Apple Inc.", country: "US" },
    "00:25:00": { vendor: "Apple Inc.", country: "US" },
    "00:25:4B": { vendor: "Apple Inc.", country: "US" },
    "00:25:BC": { vendor: "Apple Inc.", country: "US" },
    "00:26:08": { vendor: "Apple Inc.", country: "US" },
    "00:26:4A": { vendor: "Intel Corporate", country: "US" },
    "00:26:B0": { vendor: "Apple Inc.", country: "US" },
    "00:26:BB": { vendor: "Apple Inc.", country: "US" },
    "00:27:10": { vendor: "Intel Corporate", country: "US" },
    "00:30:1B": { vendor: "Apple Inc.", country: "US" },
    "00:50:56": { vendor: "VMware, Inc.", country: "US" },
    "00:A0:C9": { vendor: "Intel Corporation", country: "US" },
    "00:E0:4C": { vendor: "Realtek Semiconductor Corp.", country: "TW" },
    "04:D1:3A": { vendor: "Apple Inc.", country: "US" },
    "08:00:27": { vendor: "Oracle VirtualBox", country: "US" },
    "0C:4D:E9": { vendor: "Amazon Technologies Inc.", country: "US" },
    "10:9A:DD": { vendor: "Apple Inc.", country: "US" },
    "14:10:9F": { vendor: "Apple Inc.", country: "US" },
    "18:65:90": { vendor: "Apple Inc.", country: "US" },
    "1C:1A:C0": { vendor: "Apple Inc.", country: "US" },
    "24:A0:74": { vendor: "Apple Inc.", country: "US" },
    "28:CF:DA": { vendor: "Apple Inc.", country: "US" },
    "28:E1:4C": { vendor: "Apple Inc.", country: "US" },
    "2C:F0:A2": { vendor: "Apple Inc.", country: "US" },
    "30:10:B3": { vendor: "Apple Inc.", country: "US" },
    "34:12:F9": { vendor: "Apple Inc.", country: "US" },
    "34:36:F1": { vendor: "Apple Inc.", country: "US" },
    "34:A3:95": { vendor: "Apple Inc.", country: "US" },
    "38:C9:86": { vendor: "Apple Inc.", country: "US" },
    "3C:15:C2": { vendor: "Apple Inc.", country: "US" },
    "40:3C:FC": { vendor: "Apple Inc.", country: "US" },
    "40:A6:D9": { vendor: "Apple Inc.", country: "US" },
    "44:D8:84": { vendor: "Apple Inc.", country: "US" },
    "48:A1:95": { vendor: "Apple Inc.", country: "US" },
    "4C:74:BF": { vendor: "Apple Inc.", country: "US" },
    "50:32:37": { vendor: "Apple Inc.", country: "US" },
    "54:26:96": { vendor: "Apple Inc.", country: "US" },
    "58:1F:AA": { vendor: "Apple Inc.", country: "US" },
    "58:55:CA": { vendor: "Apple Inc.", country: "US" },
    "5C:59:48": { vendor: "Apple Inc.", country: "US" },
    "60:03:08": { vendor: "Apple Inc.", country: "US" },
    "60:92:4A": { vendor: "Apple Inc.", country: "US" },
    "60:C5:47": { vendor: "Apple Inc.", country: "US" },
    "64:4B:F0": { vendor: "Apple Inc.", country: "US" },
    "64:76:BA": { vendor: "Xiaomi Communications Co Ltd", country: "CN" },
    "64:9A:BE": { vendor: "Apple Inc.", country: "US" },
    "68:A8:6D": { vendor: "Apple Inc.", country: "US" },
    "6C:19:C0": { vendor: "Apple Inc.", country: "US" },
    "6C:3B:E5": { vendor: "Apple Inc.", country: "US" },
    "6C:4D:73": { vendor: "Apple Inc.", country: "US" },
    "70:3E:AC": { vendor: "Apple Inc.", country: "US" },
    "70:56:81": { vendor: "Apple Inc.", country: "US" },
    "70:CD:60": { vendor: "Apple Inc.", country: "US" },
    "74:E1:B6": { vendor: "Apple Inc.", country: "US" },
    "78:31:C1": { vendor: "Apple Inc.", country: "US" },
    "78:A3:E4": { vendor: "Apple Inc.", country: "US" },
    "7C:01:91": { vendor: "Apple Inc.", country: "US" },
    "7C:6D:62": { vendor: "Apple Inc.", country: "US" },
    "7C:D1:C3": { vendor: "Apple Inc.", country: "US" },
    "88:1F:A1": { vendor: "Apple Inc.", country: "US" },
    "88:66:5A": { vendor: "Apple Inc.", country: "US" },
    "88:AE:1D": { vendor: "Apple Inc.", country: "US" },
    "8C:00:6D": { vendor: "Apple Inc.", country: "US" },
    "8C:29:37": { vendor: "Apple Inc.", country: "US" },
    "8C:2D:AA": { vendor: "Apple Inc.", country: "US" },
    "8C:58:77": { vendor: "Apple Inc.", country: "US" },
    "8C:85:90": { vendor: "Apple Inc.", country: "US" },
    "90:8D:6C": { vendor: "Apple Inc.", country: "US" },
    "90:B2:1F": { vendor: "Apple Inc.", country: "US" },
    "94:94:26": { vendor: "Apple Inc.", country: "US" },
    "94:B3:25": { vendor: "Apple Inc.", country: "US" },
    "94:E9:6A": { vendor: "Apple Inc.", country: "US" },
    "98:01:A7": { vendor: "Apple Inc.", country: "US" },
    "98:5A:EB": { vendor: "Apple Inc.", country: "US" },
    "98:B8:E3": { vendor: "Apple Inc.", country: "US" },
    "98:CA:33": { vendor: "Apple Inc.", country: "US" },
    "98:E0:D9": { vendor: "Apple Inc.", country: "US" },
    "9C:04:EB": { vendor: "Apple Inc.", country: "US" },
    "9C:20:7B": { vendor: "Apple Inc.", country: "US" },
    "9C:35:EB": { vendor: "Apple Inc.", country: "US" },
    "9C:B6:D0": { vendor: "Apple Inc.", country: "US" },
    "A0:18:28": { vendor: "Apple Inc.", country: "US" },
    "A4:31:35": { vendor: "Apple Inc.", country: "US" },
    "A4:67:06": { vendor: "Apple Inc.", country: "US" },
    "A4:83:E7": { vendor: "Apple Inc.", country: "US" },
    "A4:B1:97": { vendor: "Apple Inc.", country: "US" },
    "A4:C3:F0": { vendor: "Apple Inc.", country: "US" },
    "A4:D1:8C": { vendor: "Apple Inc.", country: "US" },
    "A4:D9:31": { vendor: "Apple Inc.", country: "US" },
    "AC:1F:6B": { vendor: "Apple Inc.", country: "US" },
    "AC:29:3A": { vendor: "Apple Inc.", country: "US" },
    "AC:87:A3": { vendor: "Apple Inc.", country: "US" },
    "B0:34:95": { vendor: "Apple Inc.", country: "US" },
    "B0:65:BD": { vendor: "Apple Inc.", country: "US" },
    "B0:70:2D": { vendor: "Apple Inc.", country: "US" },
    "B4:8C:9D": { vendor: "Apple Inc.", country: "US" },
    "B4:F0:AB": { vendor: "Apple Inc.", country: "US" },
    "B8:09:8A": { vendor: "Apple Inc.", country: "US" },
    "B8:17:C2": { vendor: "Apple Inc.", country: "US" },
    "B8:41:A4": { vendor: "Apple Inc.", country: "US" },
    "B8:63:B4": { vendor: "Apple Inc.", country: "US" },
    "B8:78:2E": { vendor: "Apple Inc.", country: "US" },
    "B8:8D:12": { vendor: "Apple Inc.", country: "US" },
    "B8:C1:11": { vendor: "Apple Inc.", country: "US" },
    "B8:C7:5D": { vendor: "Apple Inc.", country: "US" },
    "B8:E8:56": { vendor: "Apple Inc.", country: "US" },
    "BC:3B:AF": { vendor: "Apple Inc.", country: "US" },
    "BC:52:B7": { vendor: "Apple Inc.", country: "US" },
    "BC:6C:21": { vendor: "Apple Inc.", country: "US" },
    "BC:79:AD": { vendor: "Apple Inc.", country: "US" },
    "BC:9F:EF": { vendor: "Apple Inc.", country: "US" },
    "C0:63:94": { vendor: "Apple Inc.", country: "US" },
    "C0:97:27": { vendor: "Apple Inc.", country: "US" },
    "C4:2C:03": { vendor: "Apple Inc.", country: "US" },
    "C4:B1:6C": { vendor: "Apple Inc.", country: "US" },
    "C8:1B:95": { vendor: "Apple Inc.", country: "US" },
    "C8:33:4B": { vendor: "Apple Inc.", country: "US" },
    "C8:69:CD": { vendor: "Apple Inc.", country: "US" },
    "C8:85:50": { vendor: "Apple Inc.", country: "US" },
    "C8:9E:43": { vendor: "Apple Inc.", country: "US" },
    "C8:BC:C8": { vendor: "Apple Inc.", country: "US" },
    "C8:D0:83": { vendor: "Apple Inc.", country: "US" },
    "C8:E0:EB": { vendor: "Apple Inc.", country: "US" },
    "CC:08:8D": { vendor: "Apple Inc.", country: "US" },
    "CC:25:EF": { vendor: "Apple Inc.", country: "US" },
    "CC:29:F5": { vendor: "Apple Inc.", country: "US" },
    "CC:68:E6": { vendor: "Apple Inc.", country: "US" },
    "D0:03:4B": { vendor: "Apple Inc.", country: "US" },
    "D0:23:DB": { vendor: "Apple Inc.", country: "US" },
    "D0:25:98": { vendor: "Apple Inc.", country: "US" },
    "D0:4F:7E": { vendor: "Apple Inc.", country: "US" },
    "D0:81:7A": { vendor: "Apple Inc.", country: "US" },
    "D0:A6:37": { vendor: "Apple Inc.", country: "US" },
    "D0:C5:F3": { vendor: "Apple Inc.", country: "US" },
    "D0:D2:B0": { vendor: "Apple Inc.", country: "US" },
    "D0:DF:C7": { vendor: "Apple Inc.", country: "US" },
    "D4:61:9D": { vendor: "Apple Inc.", country: "US" },
    "D4:90:9C": { vendor: "Apple Inc.", country: "US" },
    "D4:A3:3D": { vendor: "Apple Inc.", country: "US" },
    "D4:F4:6F": { vendor: "Apple Inc.", country: "US" },
    "D8:1C:79": { vendor: "Apple Inc.", country: "US" },
    "D8:30:62": { vendor: "Apple Inc.", country: "US" },
    "D8:96:85": { vendor: "Apple Inc.", country: "US" },
    "D8:A2:5E": { vendor: "Apple Inc.", country: "US" },
    "D8:BB:2C": { vendor: "Apple Inc.", country: "US" },
    "DC:0C:5C": { vendor: "Apple Inc.", country: "US" },
    "DC:2B:2A": { vendor: "Apple Inc.", country: "US" },
    "DC:37:44": { vendor: "Apple Inc.", country: "US" },
    "DC:86:D8": { vendor: "Apple Inc.", country: "US" },
    "DC:A9:04": { vendor: "Apple Inc.", country: "US" },
    "DC:D3:A2": { vendor: "Apple Inc.", country: "US" },
    "E0:06:E6": { vendor: "Apple Inc.", country: "US" },
    "E0:33:8E": { vendor: "Apple Inc.", country: "US" },
    "E0:5F:45": { vendor: "Apple Inc.", country: "US" },
    "E0:88:5D": { vendor: "Apple Inc.", country: "US" },
    "E0:9D:FA": { vendor: "Apple Inc.", country: "US" },
    "E0:AC:CB": { vendor: "Apple Inc.", country: "US" },
    "E0:C7:67": { vendor: "Apple Inc.", country: "US" },
    "E0:DB:D1": { vendor: "Apple Inc.", country: "US" },
    "E4:8B:7F": { vendor: "Apple Inc.", country: "US" },
    "E4:9E:12": { vendor: "Apple Inc.", country: "US" },
    "E4:C6:0B": { vendor: "Apple Inc.", country: "US" },
    "E8:04:0B": { vendor: "Apple Inc.", country: "US" },
    "E8:06:88": { vendor: "Apple Inc.", country: "US" },
    "E8:80:2D": { vendor: "Apple Inc.", country: "US" },
    "E8:9F:80": { vendor: "Apple Inc.", country: "US" },
    "EC:35:86": { vendor: "Apple Inc.", country: "US" },
    "F0:B4:79": { vendor: "Apple Inc.", country: "US" },
    "F0:C3:71": { vendor: "Apple Inc.", country: "US" },
    "F0:CB:A1": { vendor: "Apple Inc.", country: "US" },
    "F0:D1:A9": { vendor: "Apple Inc.", country: "US" },
    "F0:DB:E2": { vendor: "Apple Inc.", country: "US" },
    "F4:0F:24": { vendor: "Apple Inc.", country: "US" },
    "F4:1B:A1": { vendor: "Apple Inc.", country: "US" },
    "F4:28:53": { vendor: "Apple Inc.", country: "US" },
    "F4:37:B7": { vendor: "Apple Inc.", country: "US" },
    "F4:5C:89": { vendor: "Apple Inc.", country: "US" },
    "F4:8A:9B": { vendor: "Apple Inc.", country: "US" },
    "F4:9F:54": { vendor: "Apple Inc.", country: "US" },
    "F4:B7:E2": { vendor: "Apple Inc.", country: "US" },
    "F4:C7:14": { vendor: "Apple Inc.", country: "US" },
    "F4:D1:08": { vendor: "Apple Inc.", country: "US" },
    "F4:D9:5F": { vendor: "Apple Inc.", country: "US" },
    "F8:27:93": { vendor: "Apple Inc.", country: "US" },
    "F8:95:C7": { vendor: "Apple Inc.", country: "US" },
    "F8:A9:D0": { vendor: "Apple Inc.", country: "US" },
    "F8:B2:AE": { vendor: "Apple Inc.", country: "US" },
    "F8:E0:79": { vendor: "Apple Inc.", country: "US" },
    "FC:2A:9B": { vendor: "Apple Inc.", country: "US" },
    "FC:5E:5B": { vendor: "Apple Inc.", country: "US" },
    "FC:A6:67": { vendor: "Apple Inc.", country: "US" },
    "FC:D7:33": { vendor: "Apple Inc.", country: "US" },
    "FC:E9:98": { vendor: "Apple Inc.", country: "US" },
  };

  // Normalize MAC address to colon format
  function normalizeMac(mac: string): string | null {
    // Remove all non-hex characters
    const clean = mac.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();

    // Must be 12 hex characters
    if (clean.length !== 12) return null;

    // Format as XX:XX:XX:XX:XX:XX
    return clean.match(/.{2}/g)?.join(":") || null;
  }

  // Validate MAC address
  function validateMac(mac: string): boolean {
    const normalized = normalizeMac(mac);
    return normalized !== null;
  }

  // Get all format variations
  function getFormats(mac: string): typeof formattedMacs {
    const normalized = normalizeMac(mac);
    if (!normalized) return null;

    const compact = normalized.replace(/:/g, "");

    return {
      colon: normalized,
      hyphen: normalized.replace(/:/g, "-"),
      dot: compact.match(/.{4}/g)?.join(".") || compact,
      compact,
    };
  }

  // Lookup vendor
  function lookupVendor(mac: string): void {
    error = null;
    macInfo = null;

    const normalized = normalizeMac(mac);
    if (!normalized) {
      isValid = false;
      error = "Invalid MAC address format";
      return;
    }

    isValid = true;
    formattedMacs = getFormats(normalized);

    const oui = normalized.substring(0, 8);
    const vendorInfo = ouiDatabase[oui];

    if (vendorInfo) {
      macInfo = {
        mac: normalized,
        oui: oui,
        vendor: vendorInfo.vendor,
        address: "",
        country: vendorInfo.country,
      };
    } else {
      macInfo = {
        mac: normalized,
        oui: oui,
        vendor: "Unknown",
        address: "",
        country: "Unknown",
      };
    }
  }

  // Generate random MAC
  function generateRandomMac(): void {
    const hexChars = "0123456789ABCDEF";
    let mac = "";

    // First octet: bit 1 = unicast/multicast, bit 2 = universal/local
    let firstOctet = Math.floor(Math.random() * 256);
    if (generateMulticast) {
      firstOctet |= 0x01; // Set multicast bit
    } else {
      firstOctet &= 0xFE; // Clear multicast bit (unicast)
    }
    if (generateLocal) {
      firstOctet |= 0x02; // Set locally administered bit
    } else {
      firstOctet &= 0xFD; // Clear locally administered bit
    }

    mac = firstOctet.toString(16).padStart(2, "0").toUpperCase();

    // Generate remaining 5 octets
    for (let i = 0; i < 5; i++) {
      const octet = Math.floor(Math.random() * 256);
      mac += ":" + octet.toString(16).padStart(2, "0").toUpperCase();
    }

    generatedMac = mac;
  }

  // Copy to clipboard
  async function copyMac(format: string) {
    if (!formattedMacs) return;
    const value = formattedMacs[format as keyof typeof formattedMacs];
    await navigator.clipboard.writeText(value);
    copied = true;
    toaster.success({ title: "Copied!", description: `${format} format copied` });
    setTimeout(() => (copied = false), 1500);
  }

  // Auto-lookup on input
  $effect(() => {
    if (macInput) {
      lookupVendor(macInput);
    } else {
      macInfo = null;
      formattedMacs = null;
      isValid = false;
    }
  });
</script>

<svelte:head>
  <title>MAC Address Lookup - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Network class="size-8 text-primary-500" />
      MAC Address Lookup
    </h1>
    <p class="text-surface-500 mt-2">
      Identify device vendors and convert MAC address formats
    </p>
  </div>

  <!-- Lookup Section -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4 mb-6">
    <label class="label">
      <span>Enter MAC Address</span>
      <input
        type="text"
        class="input font-mono"
        class:border-error-500={error}
        bind:value={macInput}
        placeholder="00:1A:2B:3C:4D:5E"
      />
    </label>

    <!-- Status -->
    {#if macInput}
      {#if isValid}
        <div class="flex items-center gap-2 text-success-500">
          <CheckCircle class="size-5" />
          <span>Valid MAC Address</span>
        </div>
      {:else if error}
        <div class="flex items-center gap-2 text-error-500">
          <AlertCircle class="size-5" />
          <span>{error}</span>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Results -->
  {#if macInfo}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Vendor Info -->
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
        <h2 class="h2 font-bold">Vendor Information</h2>

        <div class="space-y-3">
          <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
            <span class="text-sm text-surface-500">Vendor</span>
            <p class="text-lg font-medium">{macInfo.vendor}</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <span class="text-sm text-surface-500">OUI</span>
              <p class="font-mono">{macInfo.oui}</p>
            </div>
            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <span class="text-sm text-surface-500">Country</span>
              <p>{macInfo.country}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Format Conversion -->
      {#if formattedMacs}
        <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
          <h2 class="h2 font-bold">Format Conversion</h2>

          <div class="space-y-2">
            <div class="flex justify-between items-center p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div>
                <span class="text-xs text-surface-500">Colon</span>
                <code class="block font-mono text-sm">{formattedMacs.colon}</code>
              </div>
              <button class="btn-icon btn-icon-sm" onclick={() => copyMac('colon')}>
                <Copy class="size-4" />
              </button>
            </div>

            <div class="flex justify-between items-center p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div>
                <span class="text-xs text-surface-500">Hyphen</span>
                <code class="block font-mono text-sm">{formattedMacs.hyphen}</code>
              </div>
              <button class="btn-icon btn-icon-sm" onclick={() => copyMac('hyphen')}>
                <Copy class="size-4" />
              </button>
            </div>

            <div class="flex justify-between items-center p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div>
                <span class="text-xs text-surface-500">Cisco (Dot)</span>
                <code class="block font-mono text-sm">{formattedMacs.dot}</code>
              </div>
              <button class="btn-icon btn-icon-sm" onclick={() => copyMac('dot')}>
                <Copy class="size-4" />
              </button>
            </div>

            <div class="flex justify-between items-center p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div>
                <span class="text-xs text-surface-500">Compact</span>
                <code class="block font-mono text-sm">{formattedMacs.compact}</code>
              </div>
              <button class="btn-icon btn-icon-sm" onclick={() => copyMac('compact')}>
                <Copy class="size-4" />
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Generator Section -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
    <h2 class="h2 font-bold flex items-center gap-2">
      <Shuffle class="size-6 text-primary-500" />
      Random MAC Generator
    </h2>

    <div class="flex flex-wrap gap-4 items-center">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="checkbox" bind:checked={generateMulticast} />
        <span>Multicast</span>
      </label>

      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="checkbox" bind:checked={generateLocal} />
        <span>Locally Administered</span>
      </label>

      <button class="btn variant-filled-primary" onclick={generateRandomMac}>
        Generate
      </button>
    </div>

    {#if generatedMac}
      <div class="flex justify-between items-center p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
        <code class="font-mono text-lg">{generatedMac}</code>
        <button
          class="btn btn-sm variant-soft-surface"
          onclick={async () => {
            await navigator.clipboard.writeText(generatedMac);
            toaster.success({ title: 'Copied!', description: 'MAC copied' });
          }}
        >
          <Copy class="size-4" />
          Copy
        </button>
      </div>
    {/if}

    <p class="text-sm text-surface-500">
      <strong>Note:</strong> Locally administered MACs are suitable for virtualization and testing.
      Unicast + Local is the most common configuration.
    </p>
  </div>
</div>
```

## Homepage Integration

```typescript
{
  id: "mac",
  title: "MAC Lookup",
  desc: "Vendor lookup & format convert",
  icon: Network,
  href: "/tools/mac",
  cat: "network",
}
```

## Testing Checklist

- [ ] MAC validation works
- [ ] Vendor lookup returns results
- [ ] Unknown vendors handled
- [ ] All format conversions work
- [ ] Copy each format works
- [ ] Random MAC generation works
- [ ] Multicast bit correct
- [ ] Local admin bit correct
- [ ] Dark mode styling
- [ ] Mobile responsive

## Estimated Effort

**3-4 hours** - Simple logic, embedded database.

## Notes

- OUI database embedded is simplified; for production, use full IEEE OUI database
- Full database is ~500KB compressed, can be fetched on demand
- Could add API integration for more comprehensive lookups
- Consider adding bulk lookup feature for network administrators
