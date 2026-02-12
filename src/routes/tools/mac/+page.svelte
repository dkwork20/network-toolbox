<script lang="ts">
  import { Network, Copy, Check, RefreshCw, Shuffle, AlertCircle, CheckCircle } from "@lucide/svelte";
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
    "00:50:56": { vendor: "VMware, Inc.", country: "US" },
    "00:A0:C9": { vendor: "Intel Corporation", country: "US" },
    "00:E0:4C": { vendor: "Realtek Semiconductor Corp.", country: "TW" },
    "04:D1:3A": { vendor: "Apple Inc.", country: "US" },
    "08:00:27": { vendor: "Oracle VirtualBox", country: "US" },
    "0C:4D:E9": { vendor: "Amazon Technologies Inc.", country: "US" },
    "10:9A:DD": { vendor: "Apple Inc.", country: "US" },
    "64:76:BA": { vendor: "Xiaomi Communications Co Ltd", country: "CN" },
    "DC:A9:04": { vendor: "Raspberry Pi Foundation", country: "GB" },
    "B8:27:EB": { vendor: "Raspberry Pi Foundation", country: "GB" },
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

<div class="container mx-auto p-4 max-w-4xl pb-20">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Network class="size-8 text-primary-500" />
      MAC Address Lookup
      <span class="badge variant-filled-error text-xs animate-pulse">NEW</span>
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
