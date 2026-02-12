# Diff Viewer Tool

## Overview

A tool for comparing two text or code snippets, highlighting additions, deletions, and modifications. Supports side-by-side and unified diff views.

## Route

`/tools/diff`

## Category

`dev`

## User Stories

1. As a developer, I want to compare two versions of code
2. As a developer, I want to see line-by-line differences highlighted
3. As a developer, I want to understand what was added, removed, or changed

## Features

### Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Side-by-Side View | Two-panel comparison | P0 |
| Unified Diff View | Single-panel with changes | P0 |
| Line Numbers | Show line numbers | P0 |
| Highlight Changes | Color-code additions/deletions | P0 |
| Line-by-Line | Match lines for comparison | P1 |
| Copy Merged | Copy merged result | P2 |

### View Modes

| Mode | Description |
|------|-------------|
| Split | Original and modified side by side |
| Unified | Combined view with +/- markers |
| Line-by-Line | Each pair on separate row |

### Highlight Colors

| Type | Light Mode | Dark Mode |
|------|------------|-----------|
| Addition | Green background | Dark green |
| Deletion | Red background | Dark red |
| Modification | Yellow background | Dark yellow |

## Technical Implementation

### Dependencies

```bash
npm install diff
npm install -D @types/diff
```

### File Structure

```
src/routes/tools/diff/
└── +page.svelte
```

### Implementation Code

```svelte
<script lang="ts">
  import { GitCompare, Copy, Check, RefreshCw, Columns, List, Minus, Plus, Edit3 } from "@lucide/svelte";
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
</script>

<svelte:head>
  <title>Diff Viewer - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-7xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <GitCompare class="size-8 text-primary-500" />
      Diff Viewer
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
        <label class="font-medium text-surface-500">Original</label>
        <textarea
          class="textarea font-mono text-sm min-h-[400px]"
          bind:value={originalText}
          placeholder="Enter original text..."
        ></textarea>
      </div>

      <!-- Modified -->
      <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
        <label class="font-medium text-surface-500">Modified</label>
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
          <div class="font-mono text-sm">
            {#each diffResult as part}
              {#if part.removed}
                <pre class="bg-error-500/20 text-error-600 dark:text-error-400 p-1 -mx-1">{part.value}</pre>
              {:else if !part.added}
                <pre class="text-surface-600 dark:text-surface-300">{part.value}</pre>
              {/if}
            {/each}
          </div>
        </div>

        <div class="card p-4 bg-surface-50 dark:bg-surface-900 overflow-auto">
          <h3 class="font-medium mb-2">Diff - Modified</h3>
          <div class="font-mono text-sm">
            {#each diffResult as part}
              {#if part.added}
                <pre class="bg-success-500/20 text-success-600 dark:text-success-400 p-1 -mx-1">{part.value}</pre>
              {:else if !part.removed}
                <pre class="text-surface-600 dark:text-surface-300">{part.value}</pre>
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
          <label class="font-medium text-surface-500">Original</label>
          <textarea
            class="textarea font-mono text-sm min-h-[200px]"
            bind:value={originalText}
            placeholder="Enter original text..."
          ></textarea>
        </div>

        <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
          <label class="font-medium text-surface-500">Modified</label>
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
            {#each diffResult as part}
              {#if part.added}
                <pre class="bg-success-500/20 text-success-600 dark:text-success-400 p-1 -mx-1 border-l-4 border-success-500">{part.value}</pre>
              {:else if part.removed}
                <pre class="bg-error-500/20 text-error-600 dark:text-error-400 p-1 -mx-1 border-l-4 border-error-500">{part.value}</pre>
              {:else}
                <pre class="text-surface-600 dark:text-surface-300">{part.value}</pre>
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
```

## Homepage Integration

```typescript
{
  id: "diff",
  title: "Diff Viewer",
  desc: "Compare text differences",
  icon: GitCompare,
  href: "/tools/diff",
  cat: "dev",
}
```

## Dependencies

```bash
npm install diff
npm install -D @types/diff
```

## Testing Checklist

- [ ] Split view displays correctly
- [ ] Unified view displays correctly
- [ ] Additions highlighted in green
- [ ] Deletions highlighted in red
- [ ] Line counts accurate
- [ ] Swap function works
- [ ] Copy unified diff works
- [ ] Sample loads correctly
- [ ] Stats show correct counts
- [ ] Dark mode styling
- [ ] Mobile responsive

## Estimated Effort

**3-4 hours** - `diff` library handles comparison logic.

## Notes

- `diff` library provides multiple diff algorithms (lines, words, chars)
- Could add word-level or character-level diff option
- Consider adding merge functionality
- Could support file upload for comparison
