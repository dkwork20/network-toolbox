<script lang="ts">
  import { Binary, ArrowUpDown, Copy, Check, Upload, Download, RefreshCw, FileCode, Image as ImageIcon, Link, Code, Clipboard, X, AlertCircle } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  type Mode = "encode" | "decode";
  type Format = "standard" | "url" | "urlEncoded";
  type ImageOutputFormat = "raw" | "datauri" | "html" | "css" | "json";
  type ImageInputMode = "file" | "url" | "base64";

  // Text encoding state
  let inputText = $state("");
  let outputText = $state("");
  let mode = $state<Mode>("encode");
  let format = $state<Format>("standard");
  let copied = $state(false);
  let error = $state("");

  // Image/Base64 file handling
  let imageInputMode = $state<ImageInputMode>("file");
  let imageUrl = $state("");
  let base64DecodeInput = $state("");
  let inputFile = $state<File | null>(null);
  let base64FromFile = $state("");
  let detectedMimeType = $state("");
  let imagePreview = $state<string | null>(null);
  let imageWidth = $state(0);
  let imageHeight = $state(0);
  let imageOutputFormat = $state<ImageOutputFormat>("datauri");
  let imageCopied = $state(false);
  let imageError = $state("");
  let isLoading = $state(false);

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

  // Main text conversion
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
    } catch {
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
  }

  // === Image/Base64 File Handling ===

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Get formatted output for image base64
  function getImageFormattedOutput(): string {
    if (!base64FromFile) return "";

    const dataUri = `data:${detectedMimeType};base64,${base64FromFile}`;
    const fileName = inputFile?.name?.replace(/\.[^/.]+$/, "") || "image";

    switch (imageOutputFormat) {
      case "raw":
        return base64FromFile;
      case "datauri":
        return dataUri;
      case "html":
        return `<img src="${dataUri}" alt="${fileName}" />`;
      case "css":
        return `background-image: url("${dataUri}");`;
      case "json":
        return `"${dataUri}"`;
      default:
        return base64FromFile;
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

    return "image/png";
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
    imageError = "";
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  }

  async function processFile(file: File) {
    imageError = "";
    isLoading = true;
    inputFile = file;
    detectedMimeType = file.type || detectMimeType("");

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      imagePreview = dataUrl;
      base64FromFile = dataUrl.split(",")[1];

      // Get image dimensions if it's an image
      if (file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
          imageWidth = img.width;
          imageHeight = img.height;
          isLoading = false;
        };
        img.onerror = () => {
          isLoading = false;
        };
        img.src = dataUrl;
      } else {
        imageWidth = 0;
        imageHeight = 0;
        isLoading = false;
      }
    };
    reader.onerror = () => {
      imageError = "Failed to read file";
      isLoading = false;
    };
    reader.readAsDataURL(file);
  }

  // URL fetching
  async function fetchFromUrl() {
    if (!imageUrl) {
      imageError = "Please enter an image URL";
      return;
    }

    imageError = "";
    isLoading = true;

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        throw new Error("URL does not point to an image");
      }

      detectedMimeType = blob.type;
      inputFile = new File([blob], imageUrl.split("/").pop()?.split("?")[0] || "image.png", { type: blob.type });

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        imagePreview = dataUrl;
        base64FromFile = dataUrl.split(",")[1];

        const img = new Image();
        img.onload = () => {
          imageWidth = img.width;
          imageHeight = img.height;
          isLoading = false;
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      imageError = `Failed to fetch: ${e instanceof Error ? e.message : 'Unknown error'}. May be blocked by CORS.`;
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
          imageInputMode = "file";
        }
        break;
      }
    }
  }

  // Base64 decode to image
  function decodeBase64ToImage() {
    if (!base64DecodeInput) {
      imageError = "Please enter a Base64 string";
      return;
    }

    imageError = "";

    try {
      let base64 = base64DecodeInput.trim();

      // Handle data URI
      if (base64.startsWith("data:")) {
        const match = base64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          detectedMimeType = match[1];
          base64 = match[2];
        }
      }

      // Detect MIME type if not set
      if (!detectedMimeType || detectedMimeType === "application/octet-stream") {
        detectedMimeType = detectMimeType(base64);
      }

      // Validate Base64
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64.replace(/\s/g, ''))) {
        throw new Error("Invalid Base64 string");
      }

      base64FromFile = base64;
      imagePreview = `data:${detectedMimeType};base64,${base64}`;

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        imageWidth = img.width;
        imageHeight = img.height;
      };
      img.onerror = () => {
        imageError = "Failed to decode. Invalid Base64 image data.";
        imagePreview = null;
      };
      img.src = imagePreview;
    } catch (e) {
      imageError = `Failed to decode: ${e instanceof Error ? e.message : 'Invalid Base64'}`;
    }
  }

  // Download image
  function downloadImage() {
    if (!imagePreview || !detectedMimeType) return;

    const extension = detectedMimeType.split("/")[1] || "png";
    const link = document.createElement("a");
    link.href = imagePreview;
    link.download = `image.${extension}`;
    link.click();
  }

  // Copy image base64 output
  async function copyImageOutput() {
    const output = getImageFormattedOutput();
    await navigator.clipboard.writeText(output);
    imageCopied = true;
    toaster.success({ title: "Copied!", description: "Base64 copied to clipboard" });
    setTimeout(() => (imageCopied = false), 1500);
  }

  // Clear image section
  function clearImageSection() {
    inputFile = null;
    base64FromFile = "";
    detectedMimeType = "";
    imagePreview = null;
    imageWidth = 0;
    imageHeight = 0;
    imageUrl = "";
    base64DecodeInput = "";
    imageError = "";
  }

  // Global paste listener
  $effect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  });

  // Auto-convert on input change
  $effect(() => {
    if (inputText) {
      convert();
    } else {
      outputText = "";
    }
  });
</script>

<svelte:head>
  <title>Base64 Encoder/Decoder - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-5xl pb-20" onpaste={handlePaste}>
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Binary class="size-8 text-primary-500" />
      Base64 Encoder/Decoder
      <span class="badge variant-filled-error text-xs animate-pulse">NEW</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Convert between text and Base64, encode/decode images and files
    </p>
  </div>

  <!-- Text Encoding Section -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4 mb-6">
    <h2 class="h2 font-bold">Text Encoding</h2>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Input -->
      <div class="space-y-4">
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
          class="textarea font-mono text-sm min-h-[150px]"
          bind:value={inputText}
          placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 to decode...'}
        ></textarea>

        {#if error}
          <p class="text-sm text-error-500">{error}</p>
        {/if}
      </div>

      <!-- Output -->
      <div class="space-y-4">
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
            class="textarea font-mono text-sm min-h-[150px]"
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
  </div>

  <!-- Image/File to Base64 Section -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
    <h2 class="h2 font-bold flex items-center gap-2">
      <ImageIcon class="size-6 text-primary-500" />
      Image & File to Base64
    </h2>

    <!-- Input Mode Selection -->
    <div class="flex flex-wrap gap-2">
      <button
        class="btn btn-sm {imageInputMode === 'file' ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => (imageInputMode = 'file')}
      >
        <Upload class="size-4" />
        Upload File
      </button>
      <button
        class="btn btn-sm {imageInputMode === 'url' ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => (imageInputMode = 'url')}
      >
        <Link class="size-4" />
        From URL
      </button>
      <button
        class="btn btn-sm {imageInputMode === 'base64' ? 'variant-filled-primary' : 'variant-soft-surface'}"
        onclick={() => (imageInputMode = 'base64')}
      >
        <Code class="size-4" />
        Decode Base64
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Input Side -->
      <div class="space-y-4">
        {#if imageInputMode === 'file'}
          <div
            class="border-2 border-dashed border-surface-500/30 rounded-lg p-8 text-center transition-colors hover:border-primary-500/50 cursor-pointer"
            role="button"
            tabindex="0"
            ondragover={(e) => e.preventDefault()}
            ondrop={handleFileDrop}
          >
            <input
              type="file"
              id="file-input-base64"
              class="hidden"
              accept="image/*"
              onchange={handleFileSelect}
            />
            <label for="file-input-base64" class="cursor-pointer">
              <Upload class="size-12 mx-auto text-surface-400 mb-4" />
              <p class="text-surface-500">
                Drag & drop an image, or click to select
              </p>
              <p class="text-xs text-surface-400 mt-2">
                Supports: PNG, JPEG, GIF, WebP, SVG, BMP, ICO
              </p>
            </label>
          </div>
          <p class="text-sm text-surface-500 flex items-center gap-2">
            <Clipboard class="size-4" />
            You can also paste an image directly (Ctrl+V)
          </p>
        {:else if imageInputMode === 'url'}
          <div class="space-y-2">
            <label class="label"><span>Image URL</span></label>
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
            <p class="text-xs text-surface-500">
              Note: Image server must allow CORS. Some may block this request.
            </p>
          </div>
        {:else if imageInputMode === 'base64'}
          <div class="space-y-2">
            <label class="label"><span>Base64 String</span></label>
            <textarea
              class="textarea font-mono text-sm min-h-[150px]"
              bind:value={base64DecodeInput}
              placeholder="Paste your Base64 string here...&#10;&#10;Can be raw Base64 or data URI format"
            ></textarea>
            <button class="btn variant-filled-primary w-full" onclick={decodeBase64ToImage}>
              Decode & Preview
            </button>
          </div>
        {/if}

        {#if imageError}
          <div class="alert alert-error flex items-center gap-2">
            <AlertCircle class="size-5" />
            <span>{imageError}</span>
          </div>
        {/if}
      </div>

      <!-- Preview Side -->
      <div class="space-y-4">
        {#if imagePreview}
          <div class="flex justify-between items-center">
            <span class="font-medium">Preview</span>
            <button class="btn btn-sm variant-soft-surface" onclick={clearImageSection}>
              <X class="size-4" />
              Clear
            </button>
          </div>

          <!-- File Info -->
          <div class="flex flex-wrap gap-4 text-sm text-surface-500">
            <span>Format: {detectedMimeType}</span>
            {#if inputFile}
              <span>Size: {formatFileSize(inputFile.size)}</span>
            {/if}
            {#if imageWidth && imageHeight}
              <span>Dimensions: {imageWidth} x {imageHeight}</span>
            {/if}
          </div>

          <!-- Image Preview -->
          <div class="bg-surface-100 dark:bg-surface-800 rounded-lg p-4 flex items-center justify-center min-h-[150px]">
            <img
              src={imagePreview}
              alt="Preview"
              class="max-w-full max-h-[200px] rounded shadow"
            />
          </div>

          <!-- Download -->
          <button class="btn variant-filled-secondary w-full" onclick={downloadImage}>
            <Download class="size-4" />
            Download Image
          </button>
        {:else}
          <div class="border-2 border-dashed border-surface-500/20 rounded-lg p-8 text-center text-surface-400 min-h-[200px] flex items-center justify-center">
            <span>Image preview will appear here</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Base64 Output -->
    {#if base64FromFile}
      <div class="space-y-3 border-t border-surface-500/20 pt-4 mt-4">
        <div class="flex justify-between items-center">
          <span class="font-medium">Base64 Output</span>
          <div class="flex gap-2">
            <button class="btn btn-sm variant-soft-surface" onclick={copyImageOutput}>
              {#if imageCopied}
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
            class="btn btn-sm {imageOutputFormat === 'raw' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
            onclick={() => (imageOutputFormat = 'raw')}
          >
            Raw
          </button>
          <button
            class="btn btn-sm {imageOutputFormat === 'datauri' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
            onclick={() => (imageOutputFormat = 'datauri')}
          >
            Data URI
          </button>
          <button
            class="btn btn-sm {imageOutputFormat === 'html' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
            onclick={() => (imageOutputFormat = 'html')}
          >
            HTML
          </button>
          <button
            class="btn btn-sm {imageOutputFormat === 'css' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
            onclick={() => (imageOutputFormat = 'css')}
          >
            CSS
          </button>
          <button
            class="btn btn-sm {imageOutputFormat === 'json' ? 'variant-filled-secondary' : 'variant-soft-surface'}"
            onclick={() => (imageOutputFormat = 'json')}
          >
            JSON
          </button>
        </div>

        <textarea
          class="textarea font-mono text-xs"
          rows="4"
          readonly
          value={getImageFormattedOutput()}
        ></textarea>

        <p class="text-xs text-surface-500">
          Base64 size: {formatFileSize(base64FromFile.length)} ({base64FromFile.length.toLocaleString()} chars)
        </p>
      </div>
    {/if}
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
        <h3 class="font-medium mb-2">JWT Tokens</h3>
        <code class="text-xs block">
          Use Base64URL format for JWT header/payload
        </code>
      </div>
    </div>
  </div>
</div>
