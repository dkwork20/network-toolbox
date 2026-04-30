# Base64 Encoder/Decoder Tool

## Overview

A tool for encoding and decoding Base64 strings. Supports standard Base64, Base64URL (for URLs and JWTs), and handles both text and file inputs.

## Route

`/tools/base64`

## Category

`encoding`

## User Stories

1. As a developer, I want to encode strings to Base64 for API payloads
2. As a developer, I want to decode Base64 strings to inspect their contents
3. As a developer, I want to use Base64URL encoding for JWT tokens
4. As a developer, I want to convert files to Base64 for embedding in configs

## Features

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Text Encoding | Convert text to Base64 | P0 |
| Text Decoding | Convert Base64 back to text | P0 |
| Base64URL Mode | URL-safe encoding (no `+`, `/`, `=`) | P0 |
| UTF-8 Support | Handle Unicode characters | P0 |
| Live Conversion | Real-time encode/decode | P1 |
| Swap Input/Output | Quick reverse operation | P1 |

### File Features

| Feature | Description | Priority |
|---------|-------------|----------|
| File to Base64 | Encode files (images, documents) | P0 |
| Base64 to File | Decode Base64 and download | P1 |
| MIME Type Detection | Detect and display file type | P1 |
| Image Preview | Preview decoded images | P1 |

### Format Options

| Mode | Description |
|------|-------------|
| Standard | `A-Za-z0-9+/` with `=` padding |
| Base64URL | `A-Za-z0-9-_` without padding |
| URL Encoded | Standard Base64 then URL-encoded |

## Technical Implementation

### Dependencies

**None** - Uses native browser APIs

```typescript
// Standard encoding
const encoded = btoa(text);
const decoded = atob(encoded);

// UTF-8 safe encoding
const encoded = btoa(unescape(encodeURIComponent(text)));
const decoded = decodeURIComponent(escape(atob(encoded)));

// Base64URL conversion
const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
```

### File Structure

```
src/routes/tools/base64/
└── +page.svelte
```

### Implementation Code

```svelte
<script lang="ts">
  import { Binary, ArrowUpDown, Copy, Check, Upload, Download, RefreshCw, FileCode, Image } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  type Mode = "encode" | "decode";
  type Format = "standard" | "url" | "urlEncoded";

  let inputText = $state("");
  let outputText = $state("");
  let mode = $state<Mode>("encode");
  let format = $state<Format>("standard");
  let copied = $state(false);
  let error = $state("");

  // File handling
  let inputFile = $state<File | null>(null);
  let base64FromFile = $state("");
  let detectedMimeType = $state("");
  let showImagePreview = $state(false);

  // Base64 URL encoding/decoding
  function toBase64URL(base64: string): string {
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function fromBase64URL(base64url: string): string {
    let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) {
      base64 += "=".repeat(4 - pad);
    }
    return base64;
  }

  // UTF-8 safe encoding
  function utf8ToBase64(str: string): string {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      return btoa(str);
    }
  }

  function base64ToUtf8(base64: string): string {
    try {
      return decodeURIComponent(escape(atob(base64)));
    } catch {
      return atob(base64);
    }
  }

  // Main conversion
  function convert() {
    error = "";
    try {
      if (mode === "encode") {
        let result = utf8ToBase64(inputText);
        if (format === "url") {
          result = toBase64URL(result);
        } else if (format === "urlEncoded") {
          result = encodeURIComponent(result);
        }
        outputText = result;
      } else {
        let base64 = inputText;
        if (format === "url") {
          base64 = fromBase64URL(base64);
        } else if (format === "urlEncoded") {
          base64 = decodeURIComponent(base64);
        }
        outputText = base64ToUtf8(base64);
      }
    } catch (e) {
      error = `Invalid input for ${mode === 'encode' ? 'encoding' : 'decoding'}`;
      outputText = "";
    }
  }

  function swapInOut() {
    const temp = inputText;
    inputText = outputText;
    outputText = temp;
    mode = mode === "encode" ? "decode" : "encode";
    convert();
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(outputText);
    copied = true;
    toaster.success({ title: "Copied!", description: "Output copied to clipboard" });
    setTimeout(() => (copied = false), 1500);
  }

  function clearAll() {
    inputText = "";
    outputText = "";
    error = "";
    inputFile = null;
    base64FromFile = "";
    detectedMimeType = "";
  }

  // File handling
  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  }

  async function handleFileDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  }

  async function processFile(file: File) {
    inputFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64 = result.split(",")[1];
      base64FromFile = base64;
      detectedMimeType = file.type;
      showImagePreview = file.type.startsWith("image/");
    };
    reader.readAsDataURL(file);
  }

  function downloadBase64AsFile() {
    if (!base64FromFile || !detectedMimeType) return;

    const byteCharacters = atob(base64FromFile);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: detectedMimeType });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = inputFile?.name || "download";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Auto-convert on input change
  $effect(() => {
    if (inputText) {
      convert();
    } else {
      outputText = "";
    }
  });
</script>

<div class="container mx-auto p-4 max-w-5xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Binary class="size-8 text-primary-500" />
      Base64 Encoder/Decoder
    </h1>
    <p class="text-surface-500 mt-2">
      Convert between text and Base64, including Base64URL for URLs and JWTs
    </p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Input Section -->
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
      <!-- Mode & Format -->
      <div class="flex flex-wrap gap-2">
        <button
          class="btn {mode === 'encode' ? 'variant-filled-primary' : 'variant-soft-surface'}"
          onclick={() => { mode = 'encode'; convert(); }}
        >
          Encode
        </button>
        <button
          class="btn {mode === 'decode' ? 'variant-filled-primary' : 'variant-soft-surface'}"
          onclick={() => { mode = 'decode'; convert(); }}
        >
          Decode
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="btn btn-sm {format === 'standard' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
          onclick={() => { format = 'standard'; convert(); }}
        >
          Standard
        </button>
        <button
          class="btn btn-sm {format === 'url' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
          onclick={() => { format = 'url'; convert(); }}
        >
          Base64URL
        </button>
        <button
          class="btn btn-sm {format === 'urlEncoded' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
          onclick={() => { format = 'urlEncoded'; convert(); }}
        >
          URL Encoded
        </button>
      </div>

      <!-- Text Input -->
      <textarea
        class="textarea font-mono text-sm min-h-[200px]"
        bind:value={inputText}
        placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
      ></textarea>

      {#if error}
        <p class="text-sm text-error-500">{error}</p>
      {/if}
    </div>

    <!-- Output Section -->
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
      <div class="flex justify-between items-center">
        <span class="font-medium">Output ({mode === 'encode' ? 'Base64' : 'Text'})</span>
        <div class="flex gap-2">
          <button class="btn btn-sm variant-soft-surface" onclick={swapInOut} title="Swap Input/Output">
            <ArrowUpDown class="size-4" />
            Swap
          </button>
          <button class="btn btn-sm variant-soft-surface" onclick={clearAll}>
            <RefreshCw class="size-4" />
            Clear
          </button>
        </div>
      </div>

      <div class="relative">
        <textarea
          class="textarea font-mono text-sm min-h-[200px]"
          readonly
          value={outputText}
          placeholder="Output will appear here..."
        ></textarea>
        {#if outputText}
          <button
            class="btn-icon btn-icon-sm absolute top-2 right-2"
            onclick={copyOutput}
          >
            {#if copied}
              <Check class="size-4 text-success-500" />
            {:else}
              <Copy class="size-4" />
            {/if}
          </button>
        {/if}
      </div>

      {#if outputText}
        <p class="text-sm text-surface-500">
          Length: {outputText.length} characters
        </p>
      {/if}
    </div>
  </div>

  <!-- File to Base64 Section -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold flex items-center gap-2">
      <FileCode class="size-6 text-primary-500" />
      File to Base64
    </h2>

    <div
      class="border-2 border-dashed border-surface-500/30 rounded-lg p-8 text-center transition-colors hover:border-primary-500/50"
      ondragover={(e) => e.preventDefault()}
      ondrop={handleFileDrop}
    >
      <input
        type="file"
        id="file-input-base64"
        class="hidden"
        onchange={handleFileSelect}
      />
      <label for="file-input-base64" class="cursor-pointer">
        <Upload class="size-12 mx-auto text-surface-400 mb-4" />
        <p class="text-surface-500">
          Drag & drop a file here, or click to select
        </p>
      </label>
    </div>

    {#if inputFile && base64FromFile}
      <div class="space-y-4">
        <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
          <p class="font-medium">{inputFile.name}</p>
          <p class="text-sm text-surface-500">
            Type: {detectedMimeType || 'unknown'} |
            Size: {(inputFile.size / 1024).toFixed(2)} KB |
            Base64: {(base64FromFile.length / 1024).toFixed(2)} KB
          </p>
        </div>

        <!-- Image Preview -->
        {#if showImagePreview}
          <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
            <p class="font-medium mb-2 flex items-center gap-2">
              <Image class="size-4" />
              Preview
            </p>
            <img
              src="data:{detectedMimeType};base64,{base64FromFile}"
              alt="Preview"
              class="max-w-full max-h-64 rounded"
            />
          </div>
        {/if}

        <!-- Base64 Output -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium">Base64 Output</span>
            <div class="flex gap-2">
              <button
                class="btn btn-sm variant-soft-surface"
                onclick={() => navigator.clipboard.writeText(base64FromFile)}
              >
                <Copy class="size-4" />
                Copy
              </button>
              <button
                class="btn btn-sm variant-soft-surface"
                onclick={() => navigator.clipboard.writeText(`data:${detectedMimeType};base64,${base64FromFile}`)}
              >
                <Copy class="size-4" />
                Copy with MIME
              </button>
            </div>
          </div>
          <textarea
            class="textarea font-mono text-xs"
            rows="4"
            readonly
            value={base64FromFile}
          ></textarea>
        </div>
      </div>
    {/if}
  </div>
</div>
```

## Homepage Integration

```typescript
{
  id: "base64",
  title: "Base64 Encoder",
  desc: "Encode/Decode Base64 & files",
  icon: Binary,
  href: "/tools/base64",
  cat: "encoding",
}
```

## Testing Checklist

- [ ] Standard Base64 encoding works
- [ ] Standard Base64 decoding works
- [ ] Base64URL encoding/decoding works
- [ ] UTF-8 characters handled correctly
- [ ] File upload works
- [ ] File drag & drop works
- [ ] Image preview shows for images
- [ ] Copy to clipboard works
- [ ] Swap function works
- [ ] Error handling for invalid input
- [ ] Dark mode styling
- [ ] Mobile responsive

## Estimated Effort

**4-6 hours** - Native APIs handle most functionality.

## Notes

- `btoa()` and `atob()` are well-supported in all browsers
- UTF-8 handling requires the `unescape(encodeURIComponent())` pattern
- Large files may cause performance issues; consider chunked processing for files > 10MB
- Could add data URL prefix option for embedding in CSS/HTML
