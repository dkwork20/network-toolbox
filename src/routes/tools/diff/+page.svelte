<script lang="ts">
  import { GitCompare, Copy, Check, RefreshCw, Columns, List, Minus, Plus } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";
  import * as Diff from "diff";

  type ViewMode = "split" | "unified";

  // State
  let originalText = $state("");
  let modifiedText = $state("");
  let viewMode = $state<ViewMode>("split");

  let diffResult = $state<Diff.Change[]>([]);
  let copied = $state(false);

  // Compute diff
  function computeDiff() {
    if (!originalText && !modifiedText) {
      diffResult = [];
      return;
    }

    diffResult = Diff.diffLines(originalText, modifiedText);
  }

  // Compute character-level diff for a single line
  function getCharDiff(oldLine: string, newLine: string): { type: 'same' | 'added' | 'removed' | 'changed'; text: string }[] {
    const charDiff = Diff.diffChars(oldLine, newLine);
    return charDiff.map(part => ({
      type: part.added ? 'added' : part.removed ? 'removed' : 'same',
      text: part.value
    }));
  }

  // Check if two lines are similar (have changes but same structure)
  function linesAreSimilar(line1: string, line2: string): boolean {
    if (!line1 || !line2) return false;
    if (line1 === line2) return false;
    const words1 = line1.split(/\s+/);
    const words2 = line2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));
    return commonWords.length > 0 && Math.abs(words1.length - words2.length) <= 2;
  }

  // Highlight character-level differences in a line
  function highlightCharDiff(oldLine: string, newLine: string): string {
    if (!oldLine || !newLine) return escapeHtml(newLine || oldLine || '');
    if (oldLine === newLine) return escapeHtml(oldLine);
    
    const diff = Diff.diffChars(oldLine, newLine);
    return diff.map(part => {
      const escaped = escapeHtml(part.value);
      if (part.added) return `<span class="bg-success-500/40 text-success-600 dark:text-success-400">${escaped}</span>`;
      if (part.removed) return `<span class="bg-error-500/40 text-error-600 dark:text-error-400">${escaped}</span>`;
      return escaped;
    }).join('');
  }

  // Escape HTML special characters
  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Get line count for display
  function getLineCount(text: string): number {
    return text.split("\n").length;
  }

  // Generate unified diff output
  function getUnifiedOutput(): string {
    return diffResult
      .map((part) => {
        const prefix = part.added ? "+" : part.removed ? "-" : " ";
        return part.value
          .split("\n")
          .filter((line) => line.length > 0 || part.value.endsWith("\n"))
          .map((line) => `${prefix}${line}`)
          .join("\n");
      })
      .join("\n");
  }

  // Copy unified diff
  async function copyUnified() {
    await navigator.clipboard.writeText(getUnifiedOutput());
    copied = true;
    toaster.success({ title: "Copied!", description: "Diff copied to clipboard" });
    setTimeout(() => (copied = false), 1500);
  }

  // Clear all
  function clearAll() {
    originalText = "";
    modifiedText = "";
    diffResult = [];
  }

  // Swap texts
  function swapTexts() {
    const temp = originalText;
    originalText = modifiedText;
    modifiedText = temp;
    computeDiff();
  }

  // Load sample
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

  // Auto-compute diff
  $effect(() => {
    computeDiff();
  });

  // Stats
  let additions = $derived(diffResult.filter((d) => d.added).reduce((sum, d) => sum + d.count || 0, 0));
  let deletions = $derived(diffResult.filter((d) => d.removed).reduce((sum, d) => sum + d.count || 0, 0));

  // Build line-by-line diff data for split view
  let splitDiffLines = $derived(() => {
    const originalLines: { text: string; type: 'unchanged' | 'removed' | 'changed'; highlight?: string }[] = [];
    const modifiedLines: { text: string; type: 'unchanged' | 'added' | 'changed'; highlight?: string }[] = [];
    
    let i = 0;
    while (i < diffResult.length) {
      const part = diffResult[i];
      const nextPart = diffResult[i + 1];
      
      if (part.removed) {
        // Check if next part is added (modified line)
        if (nextPart?.added) {
          const oldLines = part.value.split('\n').filter(l => l !== '');
          const newLines = nextPart.value.split('\n').filter(l => l !== '');
          
          const maxLen = Math.max(oldLines.length, newLines.length);
          for (let j = 0; j < maxLen; j++) {
            const oldLine = oldLines[j] || '';
            const newLine = newLines[j] || '';
            
            if (oldLine && newLine && oldLine !== newLine) {
              // Changed line - show character diff
              originalLines.push({ text: oldLine, type: 'changed', highlight: highlightCharDiff(oldLine, newLine) });
              modifiedLines.push({ text: newLine, type: 'changed', highlight: highlightCharDiff(oldLine, newLine) });
            } else if (oldLine) {
              originalLines.push({ text: oldLine, type: 'removed' });
            } else if (newLine) {
              modifiedLines.push({ text: newLine, type: 'added' });
            }
          }
          i += 2;
        } else {
          // Just removed lines
          const lines = part.value.split('\n').filter(l => l !== '');
          lines.forEach(line => originalLines.push({ text: line, type: 'removed' }));
          i++;
        }
      } else if (part.added) {
        const lines = part.value.split('\n').filter(l => l !== '');
        lines.forEach(line => modifiedLines.push({ text: line, type: 'added' }));
        i++;
      } else {
        // Unchanged lines
        const lines = part.value.split('\n').filter(l => l !== '');
        lines.forEach(line => {
          originalLines.push({ text: line, type: 'unchanged' });
          modifiedLines.push({ text: line, type: 'unchanged' });
        });
        i++;
      }
    }
    
    return { original: originalLines, modified: modifiedLines };
  });
</script>

<svelte:head>
  <title>Diff Viewer - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-7xl pb-20">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <GitCompare class="size-8 text-primary-500" />
      Diff Viewer
      <span class="badge variant-filled-secondary text-xs">V0.8</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Compare two text snippets and see the differences
    </p>
  </div>

  <!-- Controls -->
  <div class="card p-4 bg-surface-50 dark:bg-surface-900 mb-6">
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="flex gap-2">
        <button class="btn btn-sm variant-ghost-surface" onclick={loadSample}>
          Load Sample
        </button>
        <button class="btn btn-sm variant-soft-surface" onclick={swapTexts}>
          <RefreshCw class="size-4 rotate-90" />
          Swap
        </button>
        <button class="btn btn-sm variant-soft-surface" onclick={clearAll}>
          Clear
        </button>
      </div>

      <div class="flex gap-2">
        <button
          class="btn btn-sm {viewMode === 'split' ? 'variant-filled-primary' : 'variant-soft-surface'}"
          onclick={() => (viewMode = 'split')}
        >
          <Columns class="size-4" />
          Split
        </button>
        <button
          class="btn btn-sm {viewMode === 'unified' ? 'variant-filled-primary' : 'variant-soft-surface'}"
          onclick={() => (viewMode = 'unified')}
        >
          <List class="size-4" />
          Unified
        </button>
      </div>
    </div>
  </div>

  <!-- Stats -->
  {#if diffResult.length > 0}
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
    </div>
  {/if}

  {#if viewMode === 'split'}
    <!-- Split View -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Original -->
      <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
        <span class="font-medium text-surface-500">Original</span>
        <textarea
          class="textarea font-mono text-sm min-h-[400px]"
          bind:value={originalText}
          placeholder="Enter original text..."
        ></textarea>
      </div>

      <!-- Modified -->
      <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
        <span class="font-medium text-surface-500">Modified</span>
        <textarea
          class="textarea font-mono text-sm min-h-[400px]"
          bind:value={modifiedText}
          placeholder="Enter modified text..."
        ></textarea>
      </div>
    </div>

    <!-- Split Diff Output -->
    {#if diffResult.length > 0}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div class="card p-4 bg-surface-50 dark:bg-surface-900 overflow-auto">
          <h3 class="font-medium mb-2">Diff - Original</h3>
          <div class="font-mono text-sm space-y-0.5">
            {#each splitDiffLines().original as line}
              {#if line.type === 'removed'}
                <pre class="bg-error-500/20 text-error-600 dark:text-error-400 px-1 -mx-1 rounded">{line.text}</pre>
              {:else if line.type === 'changed' && line.highlight}
                <pre class="text-surface-600 dark:text-surface-300 px-1 -mx-1 rounded">{@html line.highlight}</pre>
              {:else if line.type === 'unchanged'}
                <pre class="text-surface-500 dark:text-surface-400">{line.text}</pre>
              {/if}
            {/each}
          </div>
        </div>

        <div class="card p-4 bg-surface-50 dark:bg-surface-900 overflow-auto">
          <h3 class="font-medium mb-2">Diff - Modified</h3>
          <div class="font-mono text-sm space-y-0.5">
            {#each splitDiffLines().modified as line}
              {#if line.type === 'added'}
                <pre class="bg-success-500/20 text-success-600 dark:text-success-400 px-1 -mx-1 rounded">{line.text}</pre>
              {:else if line.type === 'changed' && line.highlight}
                <pre class="text-surface-600 dark:text-surface-300 px-1 -mx-1 rounded">{@html line.highlight}</pre>
              {:else if line.type === 'unchanged'}
                <pre class="text-surface-500 dark:text-surface-400">{line.text}</pre>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    {/if}
  {:else}
    <!-- Unified View -->
    <div class="grid grid-cols-1 gap-4">
      <!-- Inputs Side by Side -->
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

      <!-- Unified Diff Output -->
      {#if diffResult.length > 0}
        <div class="card p-4 bg-surface-50 dark:bg-surface-900">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium">Unified Diff</h3>
            <button class="btn btn-sm variant-soft-surface" onclick={copyUnified}>
              {#if copied}
                <Check class="size-4 text-success-500" />
              {:else}
                <Copy class="size-4" />
              {/if}
              Copy
            </button>
          </div>
          <div class="font-mono text-sm overflow-auto max-h-[400px] bg-surface-100 dark:bg-surface-800 rounded p-4">
            {#each splitDiffLines().original as line, i}
              {@const modLine = splitDiffLines().modified[i]}
              {#if line.type === 'removed'}
                <pre class="bg-error-500/20 text-error-600 dark:text-error-400 px-2 -mx-2 border-l-4 border-error-500">-{line.text}</pre>
              {:else if modLine?.type === 'added'}
                <pre class="bg-success-500/20 text-success-600 dark:text-success-400 px-2 -mx-2 border-l-4 border-success-500">+{modLine.text}</pre>
              {:else if line.type === 'changed' && line.highlight}
                <pre class="text-surface-600 dark:text-surface-300 px-2 -mx-2"> {@html line.highlight.replace(/^</, '&lt;').replace(/>$/, '&gt;')}</pre>
              {:else}
                <pre class="text-surface-500 dark:text-surface-400 px-2 -mx-2"> {line.text}</pre>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Legend -->
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
