# Hash Calculator Tool

## Overview

A tool for calculating cryptographic hashes of text or files. Supports multiple hash algorithms for data integrity verification, password hashing, and security purposes.

## Route

`/tools/hash`

## Category

`encoding`

## User Stories

1. As a developer, I want to calculate SHA-256 hash of a string for data integrity
2. As a developer, I want to verify file integrity by comparing hashes
3. As a user, I want to hash sensitive data before sharing

## Features

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Text Input | Enter text to hash | P0 |
| File Upload | Drag & drop or select file | P0 |
| Multiple Algorithms | SHA-1, SHA-256, SHA-384, SHA-512 | P0 |
| Copy to Clipboard | Copy individual hash | P0 |
| Hash Comparison | Compare two hashes | P1 |
| Real-time Hashing | Hash on input change | P1 |

### Algorithm Support

| Algorithm | Use Case | Output Length |
|-----------|----------|---------------|
| SHA-1 | Legacy systems (deprecated) | 40 hex chars |
| SHA-256 | General purpose, recommended | 64 hex chars |
| SHA-384 | Higher security | 96 hex chars |
| SHA-512 | Maximum security | 128 hex chars |
| MD5 | Legacy, not recommended | 32 hex chars |

## Technical Implementation

### Dependencies

**None** - Uses native Web Crypto API

```typescript
// Native API
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
```

### File Structure

```
src/routes/tools/hash/
└── +page.svelte
```

### Implementation Code

```svelte
<script lang="ts">
  import { Hash, Copy, Check, Upload, FileText, RefreshCw, GitCompare } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  type Algorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512" | "MD5";

  let inputText = $state("");
  let inputFile = $state<File | null>(null);
  let inputMode = $state<"text" | "file">("text");
  let selectedAlgorithms = $state<Algorithm[]>(["SHA-256", "SHA-512"]);
  let hashes = $state<Map<Algorithm, string>>(new Map());
  let isProcessing = $state(false);
  let copiedAlgo = $state<Algorithm | null>(null);
  let compareMode = $state(false);
  let compareHash = $state("");
  let fileContent = $state<string | null>(null);

  const algorithms: Algorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512", "MD5"];

  async function calculateHash(data: ArrayBuffer, algorithm: Algorithm): Promise<string> {
    if (algorithm === "MD5") {
      // MD5 not in Web Crypto, use simple implementation
      return calculateMD5(new Uint8Array(data));
    }

    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // Simple MD5 implementation for completeness
  async function calculateMD5(data: Uint8Array): Promise<string> {
    // Using a lightweight MD5 implementation
    // For production, consider using a library like spark-md5
    const { default: MD5 } = await import("spark-md5");
    const spark = new MD5.ArrayBuffer();
    spark.append(data.buffer);
    return spark.end();
  }

  async function calculateAllHashes() {
    if (!inputText && !inputFile) {
      hashes = new Map();
      return;
    }

    isProcessing = true;
    const newHashes = new Map<Algorithm, string>();

    try {
      let data: ArrayBuffer;

      if (inputMode === "text") {
        data = new TextEncoder().encode(inputText).buffer;
      } else if (inputFile) {
        data = await inputFile.arrayBuffer();
      } else {
        return;
      }

      for (const algo of selectedAlgorithms) {
        const hash = await calculateHash(data, algo);
        newHashes.set(algo, hash);
      }

      hashes = newHashes;
    } catch (error) {
      toaster.error({ title: "Error", description: "Failed to calculate hash" });
    }

    isProcessing = false;
  }

  async function copyHash(algo: Algorithm) {
    const hash = hashes.get(algo);
    if (hash) {
      await navigator.clipboard.writeText(hash);
      copiedAlgo = algo;
      toaster.success({ title: "Copied!", description: `${algo} hash copied` });
      setTimeout(() => (copiedAlgo = null), 1500);
    }
  }

  function handleFileDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      inputFile = files[0];
      inputMode = "file";
      calculateAllHashes();
    }
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      inputFile = files[0];
      inputMode = "file";
      calculateAllHashes();
    }
  }

  function toggleAlgorithm(algo: Algorithm) {
    if (selectedAlgorithms.includes(algo)) {
      selectedAlgorithms = selectedAlgorithms.filter(a => a !== algo);
    } else {
      selectedAlgorithms = [...selectedAlgorithms, algo];
    }
    calculateAllHashes();
  }

  function checkMatch(algo: Algorithm): boolean | null {
    const hash = hashes.get(algo);
    if (!hash || !compareHash) return null;
    return hash.toLowerCase() === compareHash.toLowerCase();
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Auto-calculate on text change
  $effect(() => {
    if (inputMode === "text" && inputText) {
      calculateAllHashes();
    }
  });

  // Clear file when switching to text mode
  $effect(() => {
    if (inputMode === "text") {
      inputFile = null;
      fileContent = null;
    }
  });
</script>

<div class="container mx-auto p-4 max-w-4xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Hash class="size-8 text-primary-500" />
      Hash Calculator
    </h1>
    <p class="text-surface-500 mt-2">
      Calculate cryptographic hashes for text or files
    </p>
  </div>

  <!-- Input Section -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
    <!-- Mode Toggle -->
    <div class="flex gap-2">
      <button
        class="btn {inputMode === 'text' ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => (inputMode = 'text')}
      >
        <FileText class="size-4" />
        Text Input
      </button>
      <button
        class="btn {inputMode === 'file' ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => (inputMode = 'file')}
      >
        <Upload class="size-4" />
        File Upload
      </button>
    </div>

    <!-- Text Input -->
    {#if inputMode === 'text'}
      <textarea
        class="textarea font-mono text-sm"
        rows="6"
        bind:value={inputText}
        placeholder="Enter text to hash..."
      ></textarea>
    {:else}
      <!-- File Drop Zone -->
      <div
        class="border-2 border-dashed border-surface-500/30 rounded-lg p-8 text-center transition-colors hover:border-primary-500/50"
        ondragover={(e) => e.preventDefault()}
        ondrop={handleFileDrop}
      >
        <input
          type="file"
          id="file-input"
          class="hidden"
          onchange={handleFileSelect}
        />
        <label for="file-input" class="cursor-pointer">
          <Upload class="size-12 mx-auto text-surface-400 mb-4" />
          <p class="text-surface-500">
            Drag & drop a file here, or click to select
          </p>
        </label>

        {#if inputFile}
          <div class="mt-4 p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
            <p class="font-medium">{inputFile.name}</p>
            <p class="text-sm text-surface-500">{formatFileSize(inputFile.size)}</p>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Algorithm Selection -->
    <div class="space-y-2">
      <label class="label"><span>Select Algorithms</span></label>
      <div class="flex flex-wrap gap-2">
        {#each algorithms as algo}
          <button
            class="btn btn-sm {selectedAlgorithms.includes(algo) ? 'variant-filled-primary' : 'variant-soft-surface'}"
            onclick={() => toggleAlgorithm(algo)}
          >
            {algo}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Results -->
  {#if hashes.size > 0}
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="h2 font-bold">Results</h2>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" class="checkbox" bind:checked={compareMode} />
          <span>Compare Mode</span>
        </label>
      </div>

      <!-- Compare Input -->
      {#if compareMode}
        <div class="space-y-2">
          <label class="label"><span>Hash to Compare</span></label>
          <input
            type="text"
            class="input font-mono"
            bind:value={compareHash}
            placeholder="Paste hash to compare..."
          />
        </div>
      {/if}

      <!-- Hash Results -->
      <div class="space-y-3">
        {#each Array.from(hashes.entries()) as [algo, hash]}
          <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium">{algo}</span>
              <div class="flex items-center gap-2">
                {#if compareMode && compareHash}
                  {#if checkMatch(algo)}
                    <span class="text-sm text-success-500 font-medium">Match!</span>
                  {:else}
                    <span class="text-sm text-error-500 font-medium">No Match</span>
                  {/if}
                {/if}
                <button
                  class="btn-icon btn-icon-sm"
                  onclick={() => copyHash(algo)}
                >
                  {#if copiedAlgo === algo}
                    <Check class="size-4 text-success-500" />
                  {:else}
                    <Copy class="size-4" />
                  {/if}
                </button>
              </div>
            </div>
            <code class="text-xs break-all text-surface-600 dark:text-surface-300">
              {hash}
            </code>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if isProcessing}
    <div class="text-center py-4">
      <RefreshCw class="size-6 animate-spin text-primary-500 mx-auto" />
      <p class="text-surface-500 mt-2">Calculating...</p>
    </div>
  {/if}
</div>
```

## Optional Dependency

For MD5 support, install `spark-md5`:

```bash
npm install spark-md5
npm install -D @types/spark-md5
```

## Homepage Integration

```typescript
{
  id: "hash",
  title: "Hash Calculator",
  desc: "SHA-256, SHA-512 & more",
  icon: Hash,
  href: "/tools/hash",
  cat: "encoding",
}
```

## Testing Checklist

- [ ] SHA-256 calculation correct
- [ ] SHA-512 calculation correct
- [ ] File upload works
- [ ] Drag & drop works
- [ ] Copy to clipboard works
- [ ] Compare mode highlights matches
- [ ] Large file handling (progress indicator?)
- [ ] Dark mode styling
- [ ] Mobile responsive

## Estimated Effort

**4-6 hours** - Straightforward with native APIs, MD5 adds complexity.

## Notes

- Web Crypto API is available in all modern browsers
- SHA-1 and MD5 are included for compatibility but not recommended for security
- For very large files, consider chunked reading with progress
- Could add HMAC support in future with `crypto.subtle.sign()`
