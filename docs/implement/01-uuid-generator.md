# UUID Generator Tool

## Overview

A tool for generating Universally Unique Identifiers (UUIDs) for configuration files, database IDs, session tokens, and testing purposes.

## Route

`/tools/uuid`

## Category

`encoding` (new category for encoding/data tools)

## User Stories

1. As a developer, I want to generate UUID v4 strings quickly for my configurations
2. As a developer, I want to generate multiple UUIDs at once for batch operations
3. As a developer, I want to copy UUIDs in different formats (uppercase, lowercase, with/without hyphens)

## Features

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Single UUID Generation | Generate one UUID v4 on page load | P0 |
| Bulk Generation | Generate 1-100 UUIDs at once | P0 |
| Copy to Clipboard | Copy individual or all UUIDs | P0 |
| Format Options | Uppercase/lowercase toggle | P1 |
| Hyphen Toggle | With/without hyphens (compact format) | P1 |
| Clear/Regenerate | Reset and generate new set | P0 |

### Optional Features

| Feature | Description | Priority |
|---------|-------------|----------|
| UUID v1 | Time-based UUID (requires timestamp) | P2 |
| UUID v5 | Namespace-based UUID | P2 |
| Export | Download as TXT/JSON | P2 |

## Technical Implementation

### Dependencies

**None** - Uses native Web Crypto API

```typescript
// Native API
const uuid = crypto.randomUUID(); // Returns v4 UUID
```

### File Structure

```
src/routes/tools/uuid/
└── +page.svelte
```

### Implementation Code

```svelte
<script lang="ts">
  import { Fingerprint, Copy, RefreshCw, Download, Check } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  let uuids = $state<string[]>([]);
  let count = $state(5);
  let uppercase = $state(false);
  let noHyphens = $state(false);
  let copiedIndex = $state<number | null>(null);

  function generateUUIDs() {
    uuids = Array.from({ length: count }, () => crypto.randomUUID());
  }

  function formatUUID(uuid: string): string {
    let result = uuid;
    if (uppercase) result = result.toUpperCase();
    if (noHyphens) result = result.replace(/-/g, "");
    return result;
  }

  async function copyUUID(index: number) {
    const formatted = formatUUID(uuids[index]);
    await navigator.clipboard.writeText(formatted);
    copiedIndex = index;
    toaster.success({ title: "Copied!", description: "UUID copied to clipboard" });
    setTimeout(() => (copiedIndex = null), 1500);
  }

  async function copyAll() {
    const all = uuids.map(formatUUID).join("\n");
    await navigator.clipboard.writeText(all);
    toaster.success({ title: "Copied!", description: `${uuids.length} UUIDs copied` });
  }

  function downloadAsFile() {
    const content = uuids.map(formatUUID).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uuids.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Generate initial UUIDs on mount
  $effect(() => {
    if (uuids.length === 0) generateUUIDs();
  });
</script>

<div class="container mx-auto p-4 max-w-4xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Fingerprint class="size-8 text-primary-500" />
      UUID Generator
    </h1>
    <p class="text-surface-500 mt-2">
      Generate RFC 4122 compliant UUID v4 identifiers
    </p>
  </div>

  <!-- Controls -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
    <div class="flex flex-wrap gap-4 items-end">
      <label class="label">
        <span>Count</span>
        <input
          type="number"
          class="input w-24"
          bind:value={count}
          min={1}
          max={100}
        />
      </label>

      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="checkbox" bind:checked={uppercase} />
        <span>Uppercase</span>
      </label>

      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="checkbox" bind:checked={noHyphens} />
        <span>No Hyphens</span>
      </label>

      <button class="btn variant-filled-primary" onclick={generateUUIDs}>
        <RefreshCw class="size-4" />
        Generate
      </button>
    </div>

    <div class="flex gap-2">
      <button class="btn variant-soft-surface" onclick={copyAll}>
        <Copy class="size-4" />
        Copy All
      </button>
      <button class="btn variant-soft-surface" onclick={downloadAsFile}>
        <Download class="size-4" />
        Download
      </button>
    </div>
  </div>

  <!-- Results -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6">
    <div class="space-y-2">
      {#each uuids as uuid, index}
        <div
          class="flex items-center justify-between p-3 bg-surface-100 dark:bg-surface-800 rounded-lg font-mono text-sm"
        >
          <span>{formatUUID(uuid)}</span>
          <button
            class="btn-icon btn-icon-sm"
            onclick={() => copyUUID(index)}
          >
            {#if copiedIndex === index}
              <Check class="size-4 text-success-500" />
            {:else}
              <Copy class="size-4" />
            {/if}
          </button>
        </div>
      {/each}
    </div>

    {#if uuids.length === 0}
      <div class="text-center text-surface-500 py-8">
        Click "Generate" to create UUIDs
      </div>
    {/if}
  </div>
</div>
```

## Homepage Integration

Add to `src/routes/+page.svelte` tools array:

```typescript
{
  id: "uuid",
  title: "UUID Generator",
  desc: "Generate unique IDs",
  icon: Fingerprint,
  href: "/tools/uuid",
  cat: "encoding",
}
```

Add new category:

```typescript
const categories = [
  { id: "network", label: "Network Tools" },
  { id: "encoding", label: "Encoding & Data" }, // New
  { id: "utility", label: "Utilities" },
  { id: "dev", label: "Developer" },
];
```

## Navbar Integration

Add to `src/lib/components/Navbar.svelte` in the appropriate dropdown menu.

## Testing Checklist

- [ ] Generates valid UUID v4 format
- [ ] Uppercase conversion works
- [ ] Hyphen removal works
- [ ] Copy single UUID works
- [ ] Copy all UUIDs works
- [ ] Download creates valid .txt file
- [ ] Count limits enforced (1-100)
- [ ] Dark mode styling correct
- [ ] Mobile responsive layout

## Estimated Effort

**2-3 hours** - Simple implementation with no external dependencies.

## Notes

- Uses native `crypto.randomUUID()` which is supported in all modern browsers
- No need for uuid npm package
- Consider adding UUID validation in future for paste-and-validate feature
