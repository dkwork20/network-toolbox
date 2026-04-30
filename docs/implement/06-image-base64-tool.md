# Image Base64 Encoder/Decoder Tool

## Overview

A comprehensive tool for encoding images to Base64 and decoding Base64 back to images. Supports multiple input methods including URL fetching, drag & drop, paste from clipboard, and direct Base64 input.

## Route

`/tools/image-base64`

## Category

`encoding`

## User Stories

1. As a developer, I want to convert images to Base64 for embedding in HTML/CSS/JSON
2. As a developer, I want to fetch an image from a URL and encode it to Base64
3. As a developer, I want to decode a Base64 string and preview/download the image
4. As a user, I want to drag & drop local images to quickly get their Base64 encoding
5. As a user, I want to paste an image from clipboard and get Base64 encoding

## Features

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Image to Base64 | Encode local images to Base64 | P0 |
| Base64 to Image | Decode Base64 and show preview | P0 |
| Drag & Drop | Drop local images directly | P0 |
| URL Fetch | Fetch image from URL and encode | P0 |
| Clipboard Paste | Paste image from clipboard | P0 |
| Image Preview | Show decoded image preview | P0 |
| Download Image | Download decoded image | P0 |
| Copy Base64 | Copy encoded string | P0 |

### Input Methods

| Method | Description |
|--------|-------------|
| Drag & Drop | Drag image files onto drop zone |
| File Picker | Click to select files |
| URL Input | Enter image URL to fetch |
| Clipboard Paste | Ctrl+V to paste image |
| Base64 Input | Paste Base64 string to decode |

### Output Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| Raw Base64 | Plain Base64 string | APIs, data storage |
| Data URI | `data:image/xxx;base64,...` | HTML img src, CSS url() |
| HTML Image Tag | `<img src="data:...">` | Direct HTML embedding |
| CSS Background | `background-image: url(data:...)` | CSS embedding |
| JSON Ready | `"image": "data:..."` | JSON configs |

### Supported Formats

- **Input**: PNG, JPEG, GIF, WebP, SVG, BMP, ICO
- **Output**: Same as input (no conversion)

## Technical Implementation

### Dependencies

**None** - Uses native browser APIs

```typescript
// File to Base64
const reader = new FileReader();
reader.readAsDataURL(file);
reader.onload = () => {
  const dataUrl = reader.result as string;
  const base64 = dataUrl.split(',')[1];
};

// Base64 to Blob
const byteCharacters = atob(base64);
const byteNumbers = new Array(byteCharacters.length);
for (let i = 0; i < byteCharacters.length; i++) {
  byteNumbers[i] = byteCharacters.charCodeAt(i);
}
const byteArray = new Uint8Array(byteNumbers);
const blob = new Blob([byteArray], { type: mimeType });
```

### File Structure

```
src/routes/tools/image-base64/
└── +page.svelte
```

### Implementation Code

```svelte
<script lang="ts">
  import { Image, Link, Upload, Download, Copy, Check, RefreshCw, FileCode, Code, Clipboard, X, AlertCircle } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  type OutputFormat = "raw" | "datauri" | "html" | "css" | "json";

  // State
  let inputMode = $state<"file" | "url" | "base64">("file");
  let imageUrl = $state("");
  let base64Input = $state("");

  // File state
  let droppedFile = $state<File | null>(null);
  let imagePreview = $state<string | null>(null);
  let base64Output = $state<string>("");
  let mimeType = $state<string>("");
  let fileName = $state<string>("image");
  let fileSize = $state<number>(0);
  let imageWidth = $state<number>(0);
  let imageHeight = $state<number>(0);

  // Output format
  let outputFormat = $state<OutputFormat>("datauri");
  let copied = $state(false);

  // Error state
  let error = $state<string>("");
  let isLoading = $state(false);

  // Format output based on selected format
  function getFormattedOutput(): string {
    if (!base64Output) return "";

    const dataUri = `data:${mimeType};base64,${base64Output}`;

    switch (outputFormat) {
      case "raw":
        return base64Output;
      case "datauri":
        return dataUri;
      case "html":
        return `<img src="${dataUri}" alt="${fileName}" />`;
      case "css":
        return `background-image: url("${dataUri}");`;
      case "json":
        return `"${dataUri}"`;
      default:
        return base64Output;
    }
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
    error = "";
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        await processFile(file);
      } else {
        error = "Please drop an image file";
      }
    }
  }

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      error = "Please select an image file";
      return;
    }

    error = "";
    isLoading = true;
    droppedFile = file;
    fileName = file.name.replace(/\.[^/.]+$/, "");
    fileSize = file.size;
    mimeType = file.type;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      imagePreview = dataUrl;
      base64Output = dataUrl.split(",")[1];

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        imageWidth = img.width;
        imageHeight = img.height;
        isLoading = false;
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      error = "Failed to read file";
      isLoading = false;
    };
    reader.readAsDataURL(file);
  }

  // URL fetching
  async function fetchFromUrl() {
    if (!imageUrl) {
      error = "Please enter an image URL";
      return;
    }

    error = "";
    isLoading = true;

    try {
      // Try to fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        throw new Error("URL does not point to an image");
      }

      mimeType = blob.type;
      fileName = imageUrl.split("/").pop()?.split("?")[0] || "image";

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        imagePreview = dataUrl;
        base64Output = dataUrl.split(",")[1];
        fileSize = blob.size;

        const img = new Image();
        img.onload = () => {
          imageWidth = img.width;
          imageHeight = img.height;
          isLoading = false;
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        error = "Failed to process image";
        isLoading = false;
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      // Handle CORS or other errors
      error = `Failed to fetch image: ${e instanceof Error ? e.message : 'Unknown error'}. The image may be blocked by CORS policy.`;
      isLoading = false;
    }
  }

  // Clipboard paste
  async function handlePaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          await processFile(file);
          inputMode = "file";
        }
        break;
      }
    }
  }

  // Base64 decode
  function decodeBase64() {
    if (!base64Input) {
      error = "Please enter a Base64 string";
      return;
    }

    error = "";

    try {
      let base64 = base64Input.trim();

      // Handle data URI
      if (base64.startsWith("data:")) {
        const match = base64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64 = match[2];
        }
      }

      // Detect MIME type if not set
      if (!mimeType) {
        mimeType = detectMimeType(base64);
      }

      // Validate Base64
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64.replace(/\s/g, ''))) {
        throw new Error("Invalid Base64 string");
      }

      base64Output = base64;
      imagePreview = `data:${mimeType};base64,${base64}`;

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        imageWidth = img.width;
        imageHeight = img.height;

        // Estimate file size
        const byteLength = atob(base64).length;
        fileSize = byteLength;
        isLoading = false;
      };
      img.onerror = () => {
        error = "Failed to decode image. Invalid Base64 data.";
        imagePreview = null;
        isLoading = false;
      };
      img.src = imagePreview;
    } catch (e) {
      error = `Failed to decode: ${e instanceof Error ? e.message : 'Invalid Base64'}`;
    }
  }

  // Detect MIME type from Base64 header
  function detectMimeType(base64: string): string {
    const signatures: Record<string, string> = {
      "/9j/": "image/jpeg",
      "iVBOR": "image/png",
      "R0lGO": "image/gif",
      "UklGR": "image/webp",
      "AAABA": "image/x-icon",
      "PHN2Z": "image/svg+xml",
    };

    const header = base64.substring(0, 5);
    for (const [sig, mime] of Object.entries(signatures)) {
      if (header.startsWith(sig)) {
        return mime;
      }
    }

    return "image/png"; // Default
  }

  // Download image
  function downloadImage() {
    if (!imagePreview || !mimeType) return;

    const extension = mimeType.split("/")[1] || "png";
    const link = document.createElement("a");
    link.href = imagePreview;
    link.download = `${fileName || 'image'}.${extension}`;
    link.click();
  }

  // Copy to clipboard
  async function copyOutput() {
    const output = getFormattedOutput();
    await navigator.clipboard.writeText(output);
    copied = true;
    toaster.success({ title: "Copied!", description: "Base64 copied to clipboard" });
    setTimeout(() => (copied = false), 1500);
  }

  // Clear all
  function clearAll() {
    droppedFile = null;
    imagePreview = null;
    base64Output = "";
    base64Input = "";
    imageUrl = "";
    mimeType = "";
    fileName = "image";
    fileSize = 0;
    imageWidth = 0;
    imageHeight = 0;
    error = "";
  }

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Global paste listener
  $effect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  });
</script>

<svelte:head>
  <title>Image Base64 Encoder/Decoder - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-6xl" onpaste={handlePaste}>
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Image class="size-8 text-primary-500" />
      Image Base64 Encoder/Decoder
    </h1>
    <p class="text-surface-500 mt-2">
      Convert images to Base64 and back. Supports drag & drop, URL fetch, and paste from clipboard.
    </p>
  </div>

  <!-- Input Mode Selection -->
  <div class="flex flex-wrap gap-2 mb-6">
    <button
      class="btn {inputMode === 'file' ? 'variant-filled-primary' : 'variant-soft-surface'}"
      onclick={() => (inputMode = 'file')}
    >
      <Upload class="size-4" />
      Upload File
    </button>
    <button
      class="btn {inputMode === 'url' ? 'variant-filled-primary' : 'variant-soft-surface'}"
      onclick={() => (inputMode = 'url')}
    >
      <Link class="size-4" />
      From URL
    </button>
    <button
      class="btn {inputMode === 'base64' ? 'variant-filled-primary' : 'variant-soft-surface'}"
      onclick={() => (inputMode = 'base64')}
    >
      <Code class="size-4" />
      Decode Base64
    </button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Input Section -->
    <div class="space-y-6">
      {#if inputMode === 'file'}
        <!-- File Drop Zone -->
        <div
          class="card p-8 bg-surface-50 dark:bg-surface-900 border-2 border-dashed border-surface-500/30 rounded-lg text-center transition-colors hover:border-primary-500/50 cursor-pointer"
          ondragover={(e) => e.preventDefault()}
          ondrop={handleFileDrop}
        >
          <input
            type="file"
            id="image-input"
            class="hidden"
            accept="image/*"
            onchange={handleFileSelect}
          />
          <label for="image-input" class="cursor-pointer">
            <Upload class="size-16 mx-auto text-surface-400 mb-4" />
            <p class="text-lg font-medium mb-2">Drop an image here</p>
            <p class="text-surface-500">or click to browse</p>
            <p class="text-sm text-surface-400 mt-4">
              Supports: PNG, JPEG, GIF, WebP, SVG, BMP, ICO
            </p>
          </label>
        </div>

        <!-- Clipboard hint -->
        <div class="flex items-center gap-2 text-sm text-surface-500">
          <Clipboard class="size-4" />
          <span>You can also paste an image directly (Ctrl+V)</span>
        </div>
      {:else if inputMode === 'url'}
        <!-- URL Input -->
        <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
          <label class="label">
            <span>Image URL</span>
            <div class="flex gap-2">
              <input
                type="url"
                class="input flex-1"
                bind:value={imageUrl}
                placeholder="https://example.com/image.png"
              />
              <button class="btn variant-filled-primary" onclick={fetchFromUrl} disabled={isLoading}>
                {#if isLoading}
                  <RefreshCw class="size-4 animate-spin" />
                {:else}
                  Fetch
                {/if}
              </button>
            </div>
          </label>
          <p class="text-xs text-surface-500">
            Note: The image server must allow CORS. Some servers may block this request.
          </p>
        </div>
      {:else if inputMode === 'base64'}
        <!-- Base64 Input -->
        <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
          <label class="label">
            <span>Base64 String</span>
            <textarea
              class="textarea font-mono text-sm min-h-[200px]"
              bind:value={base64Input}
              placeholder="Paste your Base64 string here...&#10;&#10;Can be raw Base64 or data URI format"
            ></textarea>
          </label>
          <button class="btn variant-filled-primary w-full" onclick={decodeBase64}>
            Decode & Preview
          </button>
        </div>
      {/if}

      <!-- Error Display -->
      {#if error}
        <div class="alert alert-error flex items-center gap-2">
          <AlertCircle class="size-5" />
          <span>{error}</span>
        </div>
      {/if}
    </div>

    <!-- Preview & Output Section -->
    <div class="space-y-6">
      <!-- Image Preview -->
      {#if imagePreview}
        <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="h2 font-bold">Preview</h2>
            <button class="btn btn-sm variant-soft-surface" onclick={clearAll}>
              <X class="size-4" />
              Clear
            </button>
          </div>

          <!-- Image Info -->
          <div class="flex flex-wrap gap-4 text-sm text-surface-500">
            <span>Format: {mimeType}</span>
            <span>Size: {formatFileSize(fileSize)}</span>
            <span>Dimensions: {imageWidth} x {imageHeight}</span>
          </div>

          <!-- Image -->
          <div class="bg-surface-100 dark:bg-surface-800 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
            <img
              src={imagePreview}
              alt="Preview"
              class="max-w-full max-h-[400px] rounded shadow"
            />
          </div>

          <!-- Download -->
          <button class="btn variant-filled-secondary w-full" onclick={downloadImage}>
            <Download class="size-4" />
            Download Image
          </button>
        </div>
      {/if}

      <!-- Base64 Output -->
      {#if base64Output}
        <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="h2 font-bold">Base64 Output</h2>
            <div class="flex gap-2">
              <button class="btn btn-sm variant-soft-surface" onclick={copyOutput}>
                {#if copied}
                  <Check class="size-4 text-success-500" />
                {:else}
                  <Copy class="size-4" />
                {/if}
                Copy
              </button>
            </div>
          </div>

          <!-- Output Format Selection -->
          <div class="flex flex-wrap gap-2">
            <button
              class="btn btn-sm {outputFormat === 'raw' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
              onclick={() => (outputFormat = 'raw')}
            >
              Raw
            </button>
            <button
              class="btn btn-sm {outputFormat === 'datauri' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
              onclick={() => (outputFormat = 'datauri')}
            >
              Data URI
            </button>
            <button
              class="btn btn-sm {outputFormat === 'html' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
              onclick={() => (outputFormat = 'html')}
            >
              HTML
            </button>
            <button
              class="btn btn-sm {outputFormat === 'css' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
              onclick={() => (outputFormat = 'css')}
            >
              CSS
            </button>
            <button
              class="btn btn-sm {outputFormat === 'json' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
              onclick={() => (outputFormat = 'json')}
            >
              JSON
            </button>
          </div>

          <!-- Output Text -->
          <div class="relative">
            <textarea
              class="textarea font-mono text-xs min-h-[150px]"
              readonly
              value={getFormattedOutput()}
            ></textarea>
          </div>

          <p class="text-xs text-surface-500">
            Base64 size: {formatFileSize(base64Output.length)} ({base64Output.length.toLocaleString()} chars)
          </p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Usage Examples -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold">Usage Examples</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
        <h3 class="font-medium mb-2">HTML Embedding</h3>
        <code class="text-xs block">
          &lt;img src="data:image/png;base64,..." alt="Embedded Image" /&gt;
        </code>
      </div>

      <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
        <h3 class="font-medium mb-2">CSS Background</h3>
        <code class="text-xs block">
          .element {"{"} background-image: url("data:image/png;base64,..."); {"}"}
        </code>
      </div>

      <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
        <h3 class="font-medium mb-2">JSON API</h3>
        <code class="text-xs block">
          {"{"} "avatar": "data:image/png;base64,..." {"}"}
        </code>
      </div>

      <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
        <h3 class="font-medium mb-2">Markdown</h3>
        <code class="text-xs block">
          ![Alt text](data:image/png;base64,...)
        </code>
      </div>
    </div>

    <p class="text-sm text-surface-500">
      <strong>Note:</strong> Large images may significantly increase file sizes. Consider using optimized images for embedding.
    </p>
  </div>
</div>
```

## Homepage Integration

```typescript
{
  id: "image-base64",
  title: "Image Base64",
  desc: "Encode/Decode images to Base64",
  icon: Image,
  href: "/tools/image-base64",
  cat: "encoding",
}
```

## Testing Checklist

- [ ] File upload works
- [ ] Drag & drop works
- [ ] URL fetch works (with CORS handling)
- [ ] Clipboard paste works
- [ ] Base64 decode works
- [ ] Image preview displays correctly
- [ ] MIME type detection works
- [ ] Output formats generate correct strings
- [ ] Copy to clipboard works
- [ ] Download image works
- [ ] Image dimensions detected
- [ ] File size displayed
- [ ] Error handling for invalid inputs
- [ ] CORS error message helpful
- [ ] Dark mode styling
- [ ] Mobile responsive

## Estimated Effort

**6-8 hours** - Multiple input methods, error handling, and output formats.

## Notes

### CORS Limitations

URL fetching may fail due to CORS restrictions. Consider these solutions:
1. Document the limitation in UI
2. Suggest using a CORS proxy (with privacy warning)
3. Provide a fallback message

### Size Considerations

- Large images (>1MB) will produce huge Base64 strings
- Consider adding a warning for files > 100KB
- Could add image compression option using Canvas API

### MIME Type Detection

The tool detects MIME type from:
1. File.type property (file upload)
2. Content-Type header (URL fetch)
3. Base64 signature headers (decode)

### Future Enhancements

- Image resize/compression before encoding
- Format conversion (PNG → JPEG)
- Multiple image batch processing
- Base64 size optimization (remove padding)
- SVG minification option
