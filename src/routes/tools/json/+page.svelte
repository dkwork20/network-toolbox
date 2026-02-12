<script lang="ts">
  import { FileJson, Copy, Check, RefreshCw, Minimize2, Maximize2, SortAsc, AlertCircle, CheckCircle } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  type IndentType = 2 | 4 | "tab";

  let inputJson = $state("");
  let outputJson = $state("");
  let indentSize = $state<IndentType>(2);
  let sortKeys = $state(false);
  let isValid = $state(false);
  let error = $state<{ message: string; line?: number } | null>(null);
  let copied = $state(false);
  let inputStats = $state<{ keys: number; depth: number; size: string } | null>(null);

  // Parse and validate
  function parseJson(input: string): { data: unknown; error: string | null } {
    try {
      const data = JSON.parse(input);
      return { data, error: null };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid JSON";
      const lineMatch = message.match(/position (\d+)/);
      let line: number | undefined;
      if (lineMatch) {
        const pos = parseInt(lineMatch[1]);
        line = input.substring(0, pos).split('\n').length;
      }
      error = { message, line };
      return { data: null, error: message };
    }
  }

  // Format JSON
  function format() {
    error = null;
    const { data, error: parseError } = parseJson(inputJson);

    if (parseError) {
      isValid = false;
      outputJson = "";
      return;
    }

    isValid = true;

    // Sort keys if enabled
    const processed = sortKeys ? sortObjectKeys(data) : data;

    const indent = indentSize === "tab" ? "\t" : indentSize;
    outputJson = JSON.stringify(processed, null, indent);

    // Calculate stats
    calculateStats(data);
  }

  // Minify JSON
  function minify() {
    error = null;
    const { data, error: parseError } = parseJson(inputJson);

    if (parseError) {
      isValid = false;
      outputJson = "";
      return;
    }

    isValid = true;
    outputJson = JSON.stringify(data);
    calculateStats(data);
  }

  // Sort object keys recursively
  function sortObjectKeys(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    } else if (obj !== null && typeof obj === "object") {
      const sorted: Record<string, unknown> = {};
      Object.keys(obj)
        .sort()
        .forEach(key => {
          sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
        });
      return sorted;
    }
    return obj;
  }

  // Calculate JSON statistics
  function calculateStats(data: unknown) {
    const jsonStr = JSON.stringify(data);
    const size = new Blob([jsonStr]).size;

    let keyCount = 0;
    let maxDepth = 0;

    function traverse(obj: unknown, depth: number) {
      maxDepth = Math.max(maxDepth, depth);
      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item, depth + 1));
      } else if (obj !== null && typeof obj === "object") {
        keyCount += Object.keys(obj).length;
        Object.values(obj).forEach(val => traverse(val, depth + 1));
      }
    }

    traverse(data, 0);

    inputStats = {
      keys: keyCount,
      depth: maxDepth,
      size: formatSize(size)
    };
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  // Copy to clipboard
  async function copyOutput() {
    await navigator.clipboard.writeText(outputJson);
    copied = true;
    toaster.success({ title: "Copied!", description: "JSON copied to clipboard" });
    setTimeout(() => (copied = false), 1500);
  }

  // Clear all
  function clearAll() {
    inputJson = "";
    outputJson = "";
    error = null;
    isValid = false;
    inputStats = null;
  }

  // Load sample
  function loadSample() {
    inputJson = JSON.stringify({
      name: "NetOps Solutions",
      version: "1.0.0",
      tools: [
        { id: "ip", name: "IP Calculator", category: "network" },
        { id: "dns", name: "DNS Lookup", category: "network" },
        { id: "jwt", name: "JWT Debugger", category: "dev" }
      ],
      config: {
        theme: "dark",
        language: "en",
        features: {
          autoSave: true,
          notifications: false
        }
      }
    }, null, 2);
  }

  // Auto-format on input change
  $effect(() => {
    if (inputJson) {
      format();
    }
  });

  // Re-format when options change
  $effect(() => {
    if (inputJson && isValid) {
      format();
    }
  });
</script>

<svelte:head>
  <title>JSON Formatter - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-6xl pb-20">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <FileJson class="size-8 text-primary-500" />
      JSON Formatter
      <span class="badge variant-filled-secondary text-xs">V0.6</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Format, validate, minify, and explore JSON data
    </p>
  </div>

  <!-- Controls -->
  <div class="card p-4 bg-surface-50 dark:bg-surface-900 mb-6">
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="flex flex-wrap gap-2">
        <button class="btn variant-filled-primary" onclick={format}>
          <Maximize2 class="size-4" />
          Format
        </button>
        <button class="btn variant-soft-surface" onclick={minify}>
          <Minimize2 class="size-4" />
          Minify
        </button>
        <button class="btn variant-soft-surface" onclick={clearAll}>
          <RefreshCw class="size-4" />
          Clear
        </button>
        <button class="btn variant-ghost-surface" onclick={loadSample}>
          Load Sample
        </button>
      </div>

      <div class="flex flex-wrap gap-4 items-center">
        <label class="flex items-center gap-2">
          <span class="text-sm">Indent:</span>
          <select class="select select-sm" bind:value={indentSize}>
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </label>

        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" class="checkbox" bind:checked={sortKeys} />
          <span class="text-sm">Sort Keys</span>
        </label>
      </div>
    </div>
  </div>

  <!-- Status -->
  {#if inputJson}
    <div class="flex items-center gap-4 mb-4">
      {#if isValid}
        <div class="flex items-center gap-2 text-success-500">
          <CheckCircle class="size-5" />
          <span>Valid JSON</span>
        </div>
      {:else if error}
        <div class="flex items-center gap-2 text-error-500">
          <AlertCircle class="size-5" />
          <span>{error.message}</span>
          {#if error.line}
            <span class="text-sm">(line {error.line})</span>
          {/if}
        </div>
      {/if}

      {#if inputStats}
        <div class="flex items-center gap-4 text-sm text-surface-500 ml-auto">
          <span>{inputStats.keys} keys</span>
          <span>Depth: {inputStats.depth}</span>
          <span>{inputStats.size}</span>
        </div>
      {/if}
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Input -->
    <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
      <label class="font-medium">Input JSON</label>
      <textarea
        class="textarea font-mono text-sm min-h-[400px]"
        class:text-error-500={!isValid && inputJson}
        bind:value={inputJson}
        placeholder="Paste your JSON here..."
      ></textarea>
    </div>

    <!-- Output -->
    <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
      <div class="flex justify-between items-center">
        <label class="font-medium">Output</label>
        {#if outputJson}
          <button class="btn btn-sm variant-soft-surface" onclick={copyOutput}>
            {#if copied}
              <Check class="size-4 text-success-500" />
            {:else}
              <Copy class="size-4" />
            {/if}
            Copy
          </button>
        {/if}
      </div>
      <textarea
        class="textarea font-mono text-sm min-h-[400px]"
        readonly
        value={outputJson}
        placeholder="Formatted JSON will appear here..."
      ></textarea>
    </div>
  </div>
</div>
