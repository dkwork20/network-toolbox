<script lang="ts">
  import { Hash, Copy, Check, Upload, FileText, RefreshCw } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  type Algorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

  let inputText = $state("");
  let inputFile = $state<File | null>(null);
  let inputMode = $state<"text" | "file">("text");
  let selectedAlgorithms = $state<Algorithm[]>(["SHA-256", "SHA-512"]);
  let hashes = $state<Map<Algorithm, string>>(new Map());
  let isProcessing = $state(false);
  let copiedAlgo = $state<Algorithm | null>(null);
  let compareMode = $state(false);
  let compareHash = $state("");

  const algorithms: Algorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

  async function calculateHash(data: ArrayBuffer, algorithm: Algorithm): Promise<string> {
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
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
    }
  });
</script>

<svelte:head>
  <title>Hash Calculator - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl pb-20">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Hash class="size-8 text-primary-500" />
      Hash Calculator
      <span class="badge variant-filled-secondary text-xs">V0.7</span>
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
