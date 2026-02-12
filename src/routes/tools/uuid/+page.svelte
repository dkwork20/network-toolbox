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

<svelte:head>
  <title>UUID Generator - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl pb-20">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Fingerprint class="size-8 text-primary-500" />
      UUID Generator
      <span class="badge variant-filled-error text-xs animate-pulse">NEW</span>
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
          <span class="break-all">{formatUUID(uuid)}</span>
          <button
            class="btn-icon btn-icon-sm ml-2 shrink-0"
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
