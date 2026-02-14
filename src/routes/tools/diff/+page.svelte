<script lang="ts">
  import { GitCompare, Copy, Check, RefreshCw, Columns, List, Minus, Plus } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";
  import { onMount } from "svelte";
  import { isToolVerified } from "$lib/data/verified-tools";
  import type { DiffWorkerRequest, DiffWorkerResponse, SplitDiffRow, UnifiedDiffRow } from "$lib/workers/diff.worker";

  type ViewMode = "split" | "unified";
  const isVerified = isToolVerified("diff");

  interface VirtualWindow {
    start: number;
    end: number;
    offsetY: number;
    totalHeight: number;
  }

  const DIFF_DEBOUNCE_MS = 180;
  const LARGE_TEXT_DEBOUNCE_MS = 280;
  const LARGE_TEXT_THRESHOLD = 120_000;
  const SPLIT_ROW_HEIGHT = 24;
  const UNIFIED_ROW_HEIGHT = 24;
  const OVERSCAN_ROWS = 40;

  let originalText = $state("");
  let modifiedText = $state("");
  let viewMode = $state<ViewMode>("split");

  let splitRows = $state<SplitDiffRow[]>([]);
  let unifiedRows = $state<UnifiedDiffRow[]>([]);
  let additions = $state(0);
  let deletions = $state(0);

  let copied = $state(false);
  let isComputing = $state(false);
  let workerError = $state("");
  let charDiffEnabled = $state(true);
  let charDiffAppliedPairs = $state(0);
  let largeFileMode = $state(false);
  let contextLines = $state(3);

  let splitScrollTop = $state(0);
  let splitViewportHeight = $state(620);
  let unifiedScrollTop = $state(0);
  let unifiedViewportHeight = $state(560);

  let diffWorker: Worker | null = null;
  let computeTimer: ReturnType<typeof setTimeout> | null = null;
  let requestId = 0;
  let pendingRecompute = false;

  function createVirtualWindow(
    totalRows: number,
    scrollTop: number,
    viewportHeight: number,
    rowHeight: number,
  ): VirtualWindow {
    if (totalRows <= 0) {
      return { start: 0, end: 0, offsetY: 0, totalHeight: 0 };
    }

    const visibleCount = Math.max(1, Math.ceil(viewportHeight / rowHeight));
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN_ROWS);
    const end = Math.min(totalRows, start + visibleCount + OVERSCAN_ROWS * 2);

    return {
      start,
      end,
      offsetY: start * rowHeight,
      totalHeight: totalRows * rowHeight,
    };
  }

  function observeViewport(node: HTMLDivElement, mode: "split" | "unified") {
    const update = () => {
      if (mode === "split") {
        splitViewportHeight = node.clientHeight;
      } else {
        unifiedViewportHeight = node.clientHeight;
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);

    return {
      update(nextMode: "split" | "unified") {
        mode = nextMode;
        update();
      },
      destroy() {
        observer.disconnect();
      },
    };
  }

  function countLines(text: string): number {
    if (!text) return 0;
    let count = 1;
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) === 10) count += 1;
    }
    return count;
  }

  function getSplitLineClass(type: SplitDiffRow["left"]["type"]): string {
    switch (type) {
      case "removed":
        return "bg-error-500/20 text-error-600 dark:text-error-400";
      case "added":
        return "bg-success-500/20 text-success-600 dark:text-success-400";
      case "changed":
        return "text-surface-700 dark:text-surface-200";
      case "empty":
        return "text-transparent";
      default:
        return "text-surface-500 dark:text-surface-400";
    }
  }

  function getUnifiedLineClass(type: UnifiedDiffRow["type"]): string {
    switch (type) {
      case "removed":
        return "bg-error-500/20 text-error-600 dark:text-error-400 border-l-4 border-error-500";
      case "added":
        return "bg-success-500/20 text-success-600 dark:text-success-400 border-l-4 border-success-500";
      default:
        return "text-surface-500 dark:text-surface-400";
    }
  }

  function resetDiffState() {
    splitRows = [];
    unifiedRows = [];
    additions = 0;
    deletions = 0;
    charDiffEnabled = true;
    charDiffAppliedPairs = 0;
    splitScrollTop = 0;
    unifiedScrollTop = 0;
  }

  function requestDiffComputation() {
    if (!diffWorker) {
      workerError = "Diff worker unavailable. Please refresh this page.";
      return;
    }

    if (isComputing) {
      pendingRecompute = true;
      return;
    }

    requestId += 1;
    const payload: DiffWorkerRequest = {
      id: requestId,
      originalText,
      modifiedText,
      largeFileMode,
      contextLines,
    };

    isComputing = true;
    workerError = "";
    diffWorker.postMessage(payload);
  }

  function scheduleDiff(immediate = false) {
    if (computeTimer) {
      clearTimeout(computeTimer);
      computeTimer = null;
    }

    if (!originalText && !modifiedText) {
      isComputing = false;
      workerError = "";
      resetDiffState();
      return;
    }

    const totalLength = originalText.length + modifiedText.length;
    const delay = immediate ? 0 : totalLength > LARGE_TEXT_THRESHOLD ? LARGE_TEXT_DEBOUNCE_MS : DIFF_DEBOUNCE_MS;

    computeTimer = setTimeout(() => {
      computeTimer = null;
      requestDiffComputation();
    }, delay);
  }

  function getUnifiedOutput(): string {
    return unifiedRows.map((row) => `${row.prefix}${row.text}`).join("\n");
  }

  async function copyUnified() {
    try {
      await navigator.clipboard.writeText(getUnifiedOutput());
      copied = true;
      toaster.success({ title: "Copied!", description: "Diff copied to clipboard" });
      setTimeout(() => {
        copied = false;
      }, 1500);
    } catch {
      toaster.error({ title: "Copy failed", description: "Clipboard is unavailable" });
    }
  }

  function clearAll() {
    originalText = "";
    modifiedText = "";
  }

  function swapTexts() {
    const temp = originalText;
    originalText = modifiedText;
    modifiedText = temp;
  }

  function loadSample() {
    originalText = `function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(1, 2);
console.log(result);`;

    modifiedText = `function calculateSum(a: number, b: number): number {
  // Add type checking
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Invalid arguments');
  }
  return a + b;
}

const result = calculateSum(1, 2);
console.log('Sum:', result);`;
  }

  function handleSplitScroll(event: Event) {
    splitScrollTop = (event.currentTarget as HTMLDivElement).scrollTop;
  }

  function handleUnifiedScroll(event: Event) {
    unifiedScrollTop = (event.currentTarget as HTMLDivElement).scrollTop;
  }

  let originalLineCount = $derived.by(() => countLines(originalText));
  let modifiedLineCount = $derived.by(() => countLines(modifiedText));

  let splitVirtual = $derived.by(() =>
    createVirtualWindow(splitRows.length, splitScrollTop, splitViewportHeight, SPLIT_ROW_HEIGHT),
  );
  let unifiedVirtual = $derived.by(() =>
    createVirtualWindow(unifiedRows.length, unifiedScrollTop, unifiedViewportHeight, UNIFIED_ROW_HEIGHT),
  );

  let visibleSplitRows = $derived.by(() => splitRows.slice(splitVirtual.start, splitVirtual.end));
  let visibleUnifiedRows = $derived.by(() => unifiedRows.slice(unifiedVirtual.start, unifiedVirtual.end));

  $effect(() => {
    originalText;
    modifiedText;
    largeFileMode;
    contextLines;
    scheduleDiff();
  });

  onMount(() => {
    diffWorker = new Worker(new URL("$lib/workers/diff.worker.ts", import.meta.url), { type: "module" });

    diffWorker.onmessage = (event: MessageEvent<DiffWorkerResponse>) => {
      const data = event.data;
      if (data.id !== requestId) return;

      splitRows = data.splitRows;
      unifiedRows = data.unifiedRows;
      additions = data.additions;
      deletions = data.deletions;
      charDiffEnabled = data.meta.charDiffEnabled;
      charDiffAppliedPairs = data.meta.charDiffAppliedPairs;
      workerError = data.error ?? "";
      isComputing = false;

      if (pendingRecompute) {
        pendingRecompute = false;
        scheduleDiff(true);
      }
    };

    diffWorker.onerror = () => {
      workerError = "Diff worker failed. Please refresh this page.";
      isComputing = false;
    };

    scheduleDiff(true);

    return () => {
      if (computeTimer) {
        clearTimeout(computeTimer);
      }
      diffWorker?.terminate();
      diffWorker = null;
    };
  });
</script>

<svelte:head>
  <title>Diff Viewer - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-7xl pb-20">
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <GitCompare class="size-8 text-primary-500" />
      Diff Viewer
      <span class="badge preset-filled-secondary-500 text-xs">V0.8</span>
      {#if isVerified}
        <span class="badge preset-tonal-success text-xs">Verified</span>
      {/if}
    </h1>
    <p class="text-surface-500 mt-2">Compare two text snippets and see the differences</p>
  </div>

  <div class="card p-4 bg-surface-50 dark:bg-surface-900 mb-6 space-y-3">
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="flex gap-2">
        <button
          class="btn btn-sm bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface"
          onclick={loadSample}
        >
          Load Sample
        </button>
        <button class="btn btn-sm preset-tonal-surface" onclick={swapTexts}>
          <RefreshCw class="size-4 rotate-90" />
          Swap
        </button>
        <button class="btn btn-sm preset-tonal-surface" onclick={clearAll}>Clear</button>
      </div>

      <div class="flex gap-2">
        <button
          class="btn btn-sm {viewMode === 'split' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
          onclick={() => (viewMode = "split")}
        >
          <Columns class="size-4" />
          Split
        </button>
        <button
          class="btn btn-sm {viewMode === 'unified' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
          onclick={() => (viewMode = "unified")}
        >
          <List class="size-4" />
          Unified
        </button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-4 text-sm text-surface-500">
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" class="checkbox checkbox-sm" bind:checked={largeFileMode} />
        Large file mode
      </label>

      {#if largeFileMode}
        <label class="flex items-center gap-2">
          Context lines
          <select class="select select-sm" bind:value={contextLines}>
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
        </label>
      {/if}

      <span>Original: {originalLineCount} lines</span>
      <span>Modified: {modifiedLineCount} lines</span>
      {#if isComputing}
        <span class="badge preset-tonal-secondary">Computing diff...</span>
      {/if}
      {#if largeFileMode}
        <span class="badge preset-tonal-primary">Large mode: showing changed blocks + context</span>
      {/if}
      {#if !charDiffEnabled && splitRows.length > 0}
        <span class="badge preset-tonal-warning">Character highlight reduced for large input</span>
      {/if}
    </div>

    {#if workerError}
      <div class="preset-filled-error-500 text-white rounded p-2 text-sm">{workerError}</div>
    {/if}
  </div>

  {#if splitRows.length > 0}
    <div class="flex items-center gap-6 mb-4 text-sm">
      <span class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-success-500"></span>
        <Plus class="size-4 text-success-500" />
        {additions} additions
      </span>
      <span class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-error-500"></span>
        <Minus class="size-4 text-error-500" />
        {deletions} deletions
      </span>
      <span class="text-surface-500">{splitRows.length} rendered rows</span>
      {#if charDiffAppliedPairs > 0}
        <span class="text-surface-500">{charDiffAppliedPairs} rows with character-level highlight</span>
      {/if}
    </div>
  {/if}

  {#if viewMode === "split"}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
        <span class="font-medium text-surface-500">Original</span>
        <textarea
          class="textarea font-mono text-sm min-h-[400px]"
          bind:value={originalText}
          placeholder="Enter original text..."
        ></textarea>
      </div>

      <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
        <span class="font-medium text-surface-500">Modified</span>
        <textarea
          class="textarea font-mono text-sm min-h-[400px]"
          bind:value={modifiedText}
          placeholder="Enter modified text..."
        ></textarea>
      </div>
    </div>

    {#if splitRows.length > 0}
      <div class="card p-4 mt-6 bg-surface-50 dark:bg-surface-900">
        <div class="grid grid-cols-2 gap-4 mb-2 font-medium">
          <h3>Diff - Original</h3>
          <h3>Diff - Modified</h3>
        </div>

        <div
          class="font-mono text-sm max-h-[860px] overflow-auto bg-surface-100 dark:bg-surface-800 rounded"
          onscroll={handleSplitScroll}
          use:observeViewport={"split"}
        >
          <div style={`height: ${splitVirtual.totalHeight}px;`}>
            <div class="grid grid-cols-2 gap-x-4 gap-y-0" style={`transform: translateY(${splitVirtual.offsetY}px);`}>
              {#each visibleSplitRows as row (row.id)}
                {#if row.left.type === "changed" && row.left.html}
                  <pre class={`m-0 h-6 leading-6 px-2 whitespace-pre ${getSplitLineClass(row.left.type)}`}>{@html row
                      .left.html}</pre>
                {:else}
                  <pre class={`m-0 h-6 leading-6 px-2 whitespace-pre ${getSplitLineClass(row.left.type)}`}>{row.left
                      .text || " "}</pre>
                {/if}

                {#if row.right.type === "changed" && row.right.html}
                  <pre class={`m-0 h-6 leading-6 px-2 whitespace-pre ${getSplitLineClass(row.right.type)}`}>{@html row
                      .right.html}</pre>
                {:else}
                  <pre class={`m-0 h-6 leading-6 px-2 whitespace-pre ${getSplitLineClass(row.right.type)}`}>{row.right
                      .text || " "}</pre>
                {/if}
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
  {:else}
    <div class="grid grid-cols-1 gap-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
          <span class="font-medium text-surface-500">Original</span>
          <textarea
            class="textarea font-mono text-sm min-h-[200px]"
            bind:value={originalText}
            placeholder="Enter original text..."
          ></textarea>
        </div>

        <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
          <span class="font-medium text-surface-500">Modified</span>
          <textarea
            class="textarea font-mono text-sm min-h-[200px]"
            bind:value={modifiedText}
            placeholder="Enter modified text..."
          ></textarea>
        </div>
      </div>

      {#if unifiedRows.length > 0}
        <div class="card p-4 bg-surface-50 dark:bg-surface-900">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium">Unified Diff</h3>
            <button class="btn btn-sm preset-tonal-surface" onclick={copyUnified}>
              {#if copied}
                <Check class="size-4 text-success-500" />
              {:else}
                <Copy class="size-4" />
              {/if}
              Copy
            </button>
          </div>

          <div
            class="font-mono text-sm overflow-auto max-h-[480px] bg-surface-100 dark:bg-surface-800 rounded"
            onscroll={handleUnifiedScroll}
            use:observeViewport={"unified"}
          >
            <div style={`height: ${unifiedVirtual.totalHeight}px;`}>
              <div style={`transform: translateY(${unifiedVirtual.offsetY}px);`}>
                {#each visibleUnifiedRows as row (row.id)}
                  <pre
                    class={`m-0 h-6 leading-6 px-2 whitespace-pre ${getUnifiedLineClass(row.type)}`}>{row.prefix}{row.text ||
                      " "}</pre>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <div class="flex items-center gap-6 mt-6 text-sm text-surface-500">
    <span class="flex items-center gap-2">
      <span class="w-4 h-4 rounded bg-success-500/30"></span>
      Added
    </span>
    <span class="flex items-center gap-2">
      <span class="w-4 h-4 rounded bg-error-500/30"></span>
      Removed
    </span>
    <span class="flex items-center gap-2">
      <span class="w-4 h-4 rounded bg-surface-200 dark:bg-surface-700"></span>
      Unchanged
    </span>
  </div>
</div>
