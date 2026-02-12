# IP Range Calculator Tool

## Overview

A tool for converting between different IP address notations including CIDR, IP range, netmask, and wildcard mask. Provides comprehensive network information.

## Route

`/tools/iprange`

## Category

`network`

## User Stories

1. As a network engineer, I want to convert between CIDR and IP range
2. As a network engineer, I want to calculate network masks from CIDR notation
3. As a developer, I want to get all information about a subnet at once

## Features

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| CIDR Input | Enter CIDR notation | P0 |
| Range Input | Enter start/end IPs | P0 |
| Netmask Input | Enter subnet mask | P0 |
| All Info Display | Show all conversions | P0 |
| Copy Each Value | Copy individual fields | P1 |
| Host Count | Calculate usable hosts | P0 |

### Output Information

| Field | Description | Example |
|-------|-------------|---------|
| Network Address | First IP in subnet | 192.168.1.0 |
| Broadcast Address | Last IP in subnet | 192.168.1.255 |
| First Usable Host | First assignable IP | 192.168.1.1 |
| Last Usable Host | Last assignable IP | 192.168.1.254 |
| Total Hosts | Total IP addresses | 256 |
| Usable Hosts | Assignable IPs | 254 |
| Netmask | Subnet mask | 255.255.255.0 |
| Wildcard Mask | Inverse of netmask | 0.0.0.255 |
| CIDR | Prefix length | /24 |
| IP Range | Start - End | 192.168.1.0 - 192.168.1.255 |

## Technical Implementation

### Dependencies

**None** - Uses existing `ip.ts` utilities

### File Structure

```
src/routes/tools/iprange/
└── +page.svelte
```

### Implementation Code

```svelte
<script lang="ts">
  import { Calculator, Copy, Check, RefreshCw, ArrowRightLeft } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";
  import { parseCidr, ipToBigInt, bigIntToIp, isValidCidr } from "$lib/utils/ip";

  type InputMode = "cidr" | "range" | "netmask";

  // State
  let inputMode = $state<InputMode>("cidr");
  let cidrInput = $state("");
  let startIp = $state("");
  let endIp = $state("");
  let ipInput = $state("");
  let netmaskInput = $state("");

  // Results
  let results = $state<{
    networkAddress: string;
    broadcastAddress: string;
    firstHost: string;
    lastHost: string;
    totalHosts: bigint;
    usableHosts: bigint;
    netmask: string;
    wildcardMask: string;
    cidr: string;
    ipRange: string;
    prefixLength: number;
  } | null>(null);

  let error = $state<string | null>(null);
  let copiedField = $state<string | null>(null);

  // Calculate from CIDR
  function calculateFromCidr() {
    error = null;
    results = null;

    if (!cidrInput) return;

    if (!isValidCidr(cidrInput)) {
      error = "Invalid CIDR notation";
      return;
    }

    try {
      const parsed = parseCidr(cidrInput);
      if (!parsed) {
        error = "Failed to parse CIDR";
        return;
      }

      const { start, end, prefix, version } = parsed;

      // Calculate netmask
      const maskBits = BigInt(prefix);
      const allOnes = version === 4 ? 0xFFFFFFFFn : (1n << 128n) - 1n;
      const netmaskValue = allOnes ^ ((1n << (BigInt(version === 4 ? 32 : 128) - maskBits)) - 1n);

      // Calculate wildcard mask
      const wildcardValue = allOnes ^ netmaskValue;

      // Calculate addresses
      const networkAddress = start;
      const broadcastAddress = end;

      // First and last usable hosts (for /31 and /32, all addresses are usable)
      let firstHost: bigint;
      let lastHost: bigint;

      if (prefix >= (version === 4 ? 31 : 127)) {
        firstHost = start;
        lastHost = end;
      } else {
        firstHost = start + 1n;
        lastHost = end - 1n;
      }

      const totalHosts = end - start + 1n;
      const usableHosts = prefix >= (version === 4 ? 31 : 127) ? totalHosts : totalHosts - 2n;

      const convertIp = version === 4 ? bigIntToIp : (n: bigint) => n.toString(16);

      results = {
        networkAddress: convertIp(networkAddress),
        broadcastAddress: convertIp(broadcastAddress),
        firstHost: convertIp(firstHost),
        lastHost: convertIp(lastHost),
        totalHosts,
        usableHosts,
        netmask: version === 4 ? convertIp(netmaskValue) : `/${prefix}`,
        wildcardMask: version === 4 ? convertIp(wildcardValue) : "N/A for IPv6",
        cidr: cidrInput,
        ipRange: `${convertIp(start)} - ${convertIp(end)}`,
        prefixLength: prefix,
      };
    } catch (e) {
      error = e instanceof Error ? e.message : "Calculation error";
    }
  }

  // Calculate from IP range
  function calculateFromRange() {
    error = null;
    results = null;

    if (!startIp || !endIp) {
      error = "Enter both start and end IP addresses";
      return;
    }

    try {
      const start = ipToBigInt(startIp);
      const end = ipToBigInt(endIp);

      if (start > end) {
        error = "Start IP must be less than or equal to end IP";
        return;
      }

      // Find the smallest CIDR that contains this range
      // This is simplified - for production, would need proper range-to-CIDR algorithm
      const range = end - start + 1n;
      let prefix = 32;
      for (let i = 0; i <= 32; i++) {
        if ((1n << BigInt(32 - i)) >= range) {
          prefix = i;
          break;
        }
      }

      cidrInput = `${startIp}/${prefix}`;
      calculateFromCidr();
    } catch (e) {
      error = "Invalid IP address format";
    }
  }

  // Calculate from IP + netmask
  function calculateFromNetmask() {
    error = null;
    results = null;

    if (!ipInput || !netmaskInput) {
      error = "Enter both IP address and netmask";
      return;
    }

    try {
      const ip = ipToBigInt(ipInput);
      const mask = ipToBigInt(netmaskInput);

      // Count bits in mask
      let prefix = 0;
      let temp = mask;
      while (temp !== 0n) {
        prefix += Number(temp & 1n);
        temp >>= 1n;
      }

      // Calculate network address
      const network = ip & mask;

      cidrInput = `${bigIntToIp(network)}/${prefix}`;
      calculateFromCidr();
    } catch (e) {
      error = "Invalid IP address or netmask format";
    }
  }

  // Calculate based on input mode
  function calculate() {
    switch (inputMode) {
      case "cidr":
        calculateFromCidr();
        break;
      case "range":
        calculateFromRange();
        break;
      case "netmask":
        calculateFromNetmask();
        break;
    }
  }

  // Copy field
  async function copyField(field: string, value: string) {
    await navigator.clipboard.writeText(value);
    copiedField = field;
    toaster.success({ title: "Copied!", description: `${field} copied` });
    setTimeout(() => (copiedField = null), 1500);
  }

  // Clear all
  function clearAll() {
    cidrInput = "";
    startIp = "";
    endIp = "";
    ipInput = "";
    netmaskInput = "";
    results = null;
    error = null;
  }

  // Auto-calculate
  $effect(() => {
    calculate();
  });
</script>

<svelte:head>
  <title>IP Range Calculator - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Calculator class="size-8 text-primary-500" />
      IP Range Calculator
    </h1>
    <p class="text-surface-500 mt-2">
      Convert between CIDR, IP range, and subnet mask notations
    </p>
  </div>

  <!-- Input Mode Selection -->
  <div class="card p-4 bg-surface-50 dark:bg-surface-900 mb-6">
    <div class="flex flex-wrap gap-2">
      <button
        class="btn btn-sm {inputMode === 'cidr' ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => (inputMode = 'cidr')}
      >
        CIDR Notation
      </button>
      <button
        class="btn btn-sm {inputMode === 'range' ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => (inputMode = 'range')}
      >
        IP Range
      </button>
      <button
        class="btn btn-sm {inputMode === 'netmask' ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => (inputMode = 'netmask')}
      >
        IP + Netmask
      </button>
    </div>
  </div>

  <!-- Input Section -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4 mb-6">
    {#if inputMode === 'cidr'}
      <label class="label">
        <span>CIDR Notation</span>
        <input
          type="text"
          class="input font-mono"
          bind:value={cidrInput}
          placeholder="192.168.1.0/24"
        />
      </label>
    {:else if inputMode === 'range'}
      <div class="grid grid-cols-2 gap-4">
        <label class="label">
          <span>Start IP</span>
          <input
            type="text"
            class="input font-mono"
            bind:value={startIp}
            placeholder="192.168.1.0"
          />
        </label>
        <label class="label">
          <span>End IP</span>
          <input
            type="text"
            class="input font-mono"
            bind:value={endIp}
            placeholder="192.168.1.255"
          />
        </label>
      </div>
    {:else if inputMode === 'netmask'}
      <div class="grid grid-cols-2 gap-4">
        <label class="label">
          <span>IP Address</span>
          <input
            type="text"
            class="input font-mono"
            bind:value={ipInput}
            placeholder="192.168.1.100"
          />
        </label>
        <label class="label">
          <span>Subnet Mask</span>
          <input
            type="text"
            class="input font-mono"
            bind:value={netmaskInput}
            placeholder="255.255.255.0"
          />
        </label>
      </div>
    {/if}

    <button class="btn btn-sm variant-ghost-surface" onclick={clearAll}>
      <RefreshCw class="size-4" />
      Clear
    </button>

    {#if error}
      <p class="text-sm text-error-500">{error}</p>
    {/if}
  </div>

  <!-- Results -->
  {#if results}
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
      <h2 class="h2 font-bold">Network Information</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each [
          { label: "Network Address", value: results.networkAddress, key: "network" },
          { label: "Broadcast Address", value: results.broadcastAddress, key: "broadcast" },
          { label: "First Usable Host", value: results.firstHost, key: "first" },
          { label: "Last Usable Host", value: results.lastHost, key: "last" },
          { label: "Subnet Mask", value: results.netmask, key: "netmask" },
          { label: "Wildcard Mask", value: results.wildcardMask, key: "wildcard" },
          { label: "CIDR", value: results.cidr, key: "cidr" },
          { label: "IP Range", value: results.ipRange, key: "range" },
        ] as item}
          <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm text-surface-500">{item.label}</span>
              <button
                class="btn-icon btn-icon-sm"
                onclick={() => copyField(item.label, item.value)}
              >
                {#if copiedField === item.label}
                  <Check class="size-4 text-success-500" />
                {:else}
                  <Copy class="size-4" />
                {/if}
              </button>
            </div>
            <code class="font-mono">{item.value}</code>
          </div>
        {/each}
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4 mt-4">
        <div class="p-4 bg-primary-500/10 rounded-lg text-center">
          <div class="text-3xl font-bold text-primary-500">
            {results.totalHosts.toString()}
          </div>
          <div class="text-sm text-surface-500">Total IP Addresses</div>
        </div>
        <div class="p-4 bg-secondary-500/10 rounded-lg text-center">
          <div class="text-3xl font-bold text-secondary-500">
            {results.usableHosts.toString()}
          </div>
          <div class="text-sm text-surface-500">Usable Hosts</div>
        </div>
      </div>

      <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg text-center">
        <span class="text-sm text-surface-500">Prefix Length: </span>
        <span class="font-bold">/{results.prefixLength}</span>
      </div>
    </div>
  {/if}

  <!-- Common CIDR Reference -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold">Quick Reference</h2>
    <div class="overflow-x-auto">
      <table class="table w-full text-sm">
        <thead>
          <tr>
            <th>CIDR</th>
            <th>Netmask</th>
            <th>Usable Hosts</th>
            <th>Common Use</th>
          </tr>
        </thead>
        <tbody>
          {#each [
            { cidr: "/8", mask: "255.0.0.0", hosts: "16.7M", use: "Class A Network" },
            { cidr: "/16", mask: "255.255.0.0", hosts: "65,534", use: "Class B Network" },
            { cidr: "/24", mask: "255.255.255.0", hosts: "254", use: "Small LAN" },
            { cidr: "/25", mask: "255.255.255.128", hosts: "126", use: "Half Subnet" },
            { cidr: "/26", mask: "255.255.255.192", hosts: "62", use: "Quarter Subnet" },
            { cidr: "/27", mask: "255.255.255.224", hosts: "30", use: "Small Office" },
            { cidr: "/28", mask: "255.255.255.240", hosts: "14", use: "Point-to-Point" },
            { cidr: "/29", mask: "255.255.255.248", hosts: "6", use: "Small Network" },
            { cidr: "/30", mask: "255.255.255.252", hosts: "2", use: "Point-to-Point Link" },
            { cidr: "/32", mask: "255.255.255.255", hosts: "1", use: "Single Host" },
          ] as ref}
            <tr class="cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800" onclick={() => { cidrInput = `192.168.1.0${ref.cidr}`; inputMode = 'cidr'; }}>
              <td class="font-mono">{ref.cidr}</td>
              <td class="font-mono">{ref.mask}</td>
              <td>{ref.hosts}</td>
              <td class="text-surface-500">{ref.use}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
```

## Homepage Integration

```typescript
{
  id: "iprange",
  title: "IP Range Calculator",
  desc: "CIDR, range, netmask converter",
  icon: Calculator,
  href: "/tools/iprange",
  cat: "network",
}
```

## Testing Checklist

- [ ] CIDR input calculates correctly
- [ ] IP range input calculates correctly
- [ ] Netmask input calculates correctly
- [ ] Network address correct
- [ ] Broadcast address correct
- [ ] Usable hosts count correct
- [ ] Copy individual fields works
- [ ] Quick reference clickable
- [ ] Error handling for invalid input
- [ ] Dark mode styling
- [ ] Mobile responsive

## Estimated Effort

**4-5 hours** - Reuses existing IP utilities.

## Notes

- Reuses `parseCidr`, `ipToBigInt`, `bigIntToIp` from `$lib/utils/ip`
- IPv6 support depends on existing utility functions
- Could add visual subnet breakdown like existing subnet tool
