<script lang="ts">
  import { Link, ArrowUpDown, Copy, Check, RefreshCw, Plus, Trash2, Search } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  type Mode = "encode" | "decode" | "parse" | "build";

  let inputText = $state("");
  let outputText = $state("");
  let mode = $state<Mode>("encode");
  let copied = $state(false);
  let error = $state("");

  // URL parsing state
  let parsedUrl = $state<{
    protocol: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
    queryParams: [string, string][];
  } | null>(null);

  // Query string builder state
  let queryParams = $state<[string, string][]>([["", ""]]);

  // Main conversion
  function convert() {
    error = "";
    outputText = "";
    parsedUrl = null;

    try {
      switch (mode) {
        case "encode":
          outputText = encodeURIComponent(inputText);
          break;

        case "decode":
          outputText = decodeURIComponent(inputText);
          break;

        case "parse":
          parseUrl();
          break;

        case "build":
          buildQueryString();
          break;
      }
    } catch {
      error = `Invalid input for ${mode}`;
    }
  }

  function parseUrl() {
    let urlToParse = inputText.trim();
    if (!urlToParse.match(/^https?:\/\//i)) {
      urlToParse = "https://" + urlToParse;
    }

    const url = new URL(urlToParse);
    const queryParams: [string, string][] = [];
    url.searchParams.forEach((value, key) => {
      queryParams.push([key, value]);
    });

    parsedUrl = {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      queryParams,
    };
  }

  function buildQueryString() {
    const params = new URLSearchParams();
    queryParams.forEach(([key, value]) => {
      if (key.trim()) {
        params.append(key.trim(), value);
      }
    });
    outputText = params.toString();
  }

  function addQueryParam() {
    queryParams = [...queryParams, ["", ""]];
  }

  function removeQueryParam(index: number) {
    queryParams = queryParams.filter((_, i) => i !== index);
  }

  function updateQueryParam(index: number, field: 0 | 1, value: string) {
    const updated = [...queryParams];
    updated[index][field] = value;
    queryParams = updated;
    if (mode === "build") buildQueryString();
  }

  function swapInOut() {
    const temp = inputText;
    inputText = outputText;
    outputText = temp;
    mode = mode === "encode" ? "decode" : mode === "decode" ? "encode" : mode;
    convert();
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(outputText);
    copied = true;
    toaster.success({ title: "Copied!", description: "Output copied to clipboard" });
    setTimeout(() => (copied = false), 1500);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    toaster.success({ title: "Copied!", description: "Copied to clipboard" });
  }

  function clearAll() {
    inputText = "";
    outputText = "";
    error = "";
    parsedUrl = null;
    queryParams = [["", ""]];
  }

  // Auto-convert on input change
  $effect(() => {
    if (inputText || mode === "build") {
      convert();
    }
  });

  // Auto-convert on query params change
  $effect(() => {
    if (mode === "build") {
      buildQueryString();
    }
  });
</script>

<svelte:head>
  <title>URL Encoder/Decoder - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-5xl pb-20">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Link class="size-8 text-primary-500" />
      URL Encoder/Decoder
      <span class="badge variant-filled-secondary text-xs">V0.6</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Encode, decode, parse URLs and build query strings
    </p>
  </div>

  <!-- Mode Selection -->
  <div class="flex flex-wrap gap-2 mb-6">
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
    <button
      class="btn {mode === 'parse' ? 'variant-filled-primary' : 'variant-soft-surface'}"
      onclick={() => { mode = 'parse'; convert(); }}
    >
      <Search class="size-4" />
      Parse URL
    </button>
    <button
      class="btn {mode === 'build' ? 'variant-filled-primary' : 'variant-soft-surface'}"
      onclick={() => { mode = 'build'; convert(); }}
    >
      Build Query
    </button>
  </div>

  {#if mode === 'encode' || mode === 'decode'}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Input -->
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
        <span class="font-medium">Input</span>
        <textarea
          class="textarea font-mono text-sm min-h-[200px]"
          bind:value={inputText}
          placeholder={mode === 'encode' ? 'Enter text to URL encode...' : 'Enter URL-encoded text to decode...'}
        ></textarea>
      </div>

      <!-- Output -->
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
        <div class="flex justify-between items-center">
          <span class="font-medium">Output</span>
          <div class="flex gap-2">
            <button class="btn btn-sm variant-soft-surface" onclick={swapInOut}>
              <ArrowUpDown class="size-4" />
              Swap
            </button>
            <button class="btn btn-sm variant-soft-surface" onclick={clearAll}>
              <RefreshCw class="size-4" />
            </button>
          </div>
        </div>
        <div class="relative">
          <textarea
            class="textarea font-mono text-sm min-h-[200px]"
            readonly
            value={outputText}
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
      </div>
    </div>

    {#if error}
      <p class="text-sm text-error-500 mt-4">{error}</p>
    {/if}
  {/if}

  {#if mode === 'parse'}
    <div class="space-y-6">
      <!-- URL Input -->
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
        <span class="font-medium">Enter URL to Parse</span>
        <input
          type="text"
          class="input font-mono"
          bind:value={inputText}
          placeholder="https://example.com:8080/path?query=value#hash"
        />
      </div>

      <!-- Parsed Result -->
      {#if parsedUrl}
        <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
          <h2 class="h2 font-bold">URL Components</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Protocol -->
            <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm text-surface-500">Protocol</span>
                <button
                  class="btn-icon btn-icon-sm"
                  onclick={() => copyText(parsedUrl!.protocol)}
                >
                  <Copy class="size-3" />
                </button>
              </div>
              <code class="font-mono">{parsedUrl.protocol}</code>
            </div>

            <!-- Hostname -->
            <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm text-surface-500">Hostname</span>
                <button
                  class="btn-icon btn-icon-sm"
                  onclick={() => copyText(parsedUrl!.hostname)}
                >
                  <Copy class="size-3" />
                </button>
              </div>
              <code class="font-mono">{parsedUrl.hostname}</code>
            </div>

            <!-- Port -->
            <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm text-surface-500">Port</span>
                <button
                  class="btn-icon btn-icon-sm"
                  onclick={() => copyText(parsedUrl!.port)}
                >
                  <Copy class="size-3" />
                </button>
              </div>
              <code class="font-mono">{parsedUrl.port || '(default)'}</code>
            </div>

            <!-- Pathname -->
            <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm text-surface-500">Pathname</span>
                <button
                  class="btn-icon btn-icon-sm"
                  onclick={() => copyText(parsedUrl!.pathname)}
                >
                  <Copy class="size-3" />
                </button>
              </div>
              <code class="font-mono break-all">{parsedUrl.pathname}</code>
            </div>
          </div>

          <!-- Query Parameters -->
          {#if parsedUrl.queryParams.length > 0}
            <div class="mt-4">
              <h3 class="font-medium mb-2">Query Parameters</h3>
              <div class="space-y-2">
                {#each parsedUrl.queryParams as [key, value]}
                  <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg flex justify-between items-center">
                    <div class="font-mono text-sm">
                      <span class="text-primary-500">{key}</span>=<span class="text-secondary-500">{value}</span>
                    </div>
                    <button
                      class="btn-icon btn-icon-sm"
                      onclick={() => copyText(`${key}=${value}`)}
                    >
                      <Copy class="size-3" />
                    </button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Hash -->
          {#if parsedUrl.hash}
            <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="flex justify-between items-center mb-1">
                <span class="text-sm text-surface-500">Hash / Fragment</span>
                <button
                  class="btn-icon btn-icon-sm"
                  onclick={() => copyText(parsedUrl!.hash)}
                >
                  <Copy class="size-3" />
                </button>
              </div>
              <code class="font-mono">{parsedUrl.hash}</code>
            </div>
          {/if}
        </div>
      {/if}

      {#if error}
        <p class="text-sm text-error-500">{error}</p>
      {/if}
    </div>
  {/if}

  {#if mode === 'build'}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Query Parameters Input -->
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
        <div class="flex justify-between items-center">
          <span class="font-medium">Query Parameters</span>
          <button class="btn btn-sm variant-soft-surface" onclick={addQueryParam}>
            <Plus class="size-4" />
            Add
          </button>
        </div>

        <div class="space-y-3">
          {#each queryParams as [key, value], index}
            <div class="flex gap-2 items-center">
              <input
                type="text"
                class="input flex-1"
                placeholder="Key"
                value={key}
                oninput={(e) => updateQueryParam(index, 0, e.currentTarget.value)}
              />
              <span class="text-surface-500">=</span>
              <input
                type="text"
                class="input flex-1"
                placeholder="Value"
                value={value}
                oninput={(e) => updateQueryParam(index, 1, e.currentTarget.value)}
              />
              <button
                class="btn-icon btn-icon-sm variant-soft-error"
                onclick={() => removeQueryParam(index)}
                disabled={queryParams.length === 1}
              >
                <Trash2 class="size-4" />
              </button>
            </div>
          {/each}
        </div>
      </div>

      <!-- Output -->
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
        <div class="flex justify-between items-center">
          <span class="font-medium">Query String</span>
          <button class="btn btn-sm variant-soft-surface" onclick={clearAll}>
            <RefreshCw class="size-4" />
            Clear
          </button>
        </div>
        <div class="relative">
          <textarea
            class="textarea font-mono text-sm min-h-[200px]"
            readonly
            value={outputText}
            placeholder="Query string will appear here..."
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
          <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
            <span class="text-sm text-surface-500">Full URL Preview:</span>
            <code class="font-mono text-xs break-all block mt-1">
              https://example.com/path?{outputText}
            </code>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
