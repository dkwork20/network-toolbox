<script lang="ts">
  import { Activity, Clock, Trash2, RefreshCw, Plus, Download, TrendingUp, TrendingDown } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";
  import { onMount } from "svelte";

  interface LatencyResult {
    target: string;
    latencies: number[];
    timestamps: number[];
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    lastCheck: number;
  }

  // State
  let targets = $state<string[]>([]);
  let newTarget = $state("");
  let results = $state<Map<string, LatencyResult>>(new Map());
  let isChecking = $state(false);
  let autoCheck = $state(false);
  let checkInterval = $state(30);
  let initialized = $state(false);

  // Default endpoints for latency checking
  const defaultEndpoints = [
    { name: "Cloudflare", url: "https://1.1.1.1/dns-query" },
    { name: "Google DNS", url: "https://dns.google/resolve?name=google.com" },
    { name: "AWS US-East", url: "https://ec2.us-east-1.amazonaws.com" },
    { name: "AWS EU-West", url: "https://ec2.eu-west-1.amazonaws.com" },
    { name: "Azure", url: "https://azure.microsoft.com" },
  ];

  // Load from localStorage
  function loadFromStorage(): string[] {
    const saved = localStorage.getItem("latencyTargets");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load targets", e);
      }
    }
    return [];
  }

  // Save to localStorage
  function saveToStorage() {
    localStorage.setItem("latencyTargets", JSON.stringify(targets));
  }

  // Measure latency
  async function measureLatency(url: string): Promise<number | null> {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
        signal: controller.signal,
      }).catch(() => {});

      clearTimeout(timeoutId);
      return Math.round(performance.now() - startTime);
    } catch {
      return null;
    }
  }

  // Check single target
  async function checkTarget(target: string) {
    const latency = await measureLatency(target);
    const existing = results.get(target);

    if (existing) {
      const newLatencies = [...existing.latencies, latency || 0];
      const newTimestamps = [...existing.timestamps, Date.now()];
      if (newLatencies.length > 50) {
        newLatencies.shift();
        newTimestamps.shift();
      }
      const validLatencies = newLatencies.filter((l) => l > 0);
      const avgLatency = validLatencies.length
        ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
        : 0;
      const minLatency = validLatencies.length ? Math.min(...validLatencies) : 0;
      const maxLatency = validLatencies.length ? Math.max(...validLatencies) : 0;
      
      const updatedResult: LatencyResult = {
        ...existing,
        latencies: newLatencies,
        timestamps: newTimestamps,
        avgLatency,
        minLatency,
        maxLatency,
        lastCheck: Date.now(),
      };
      
      const newMap = new Map(results);
      newMap.set(target, updatedResult);
      results = newMap;
    } else {
      const newResult: LatencyResult = {
        target,
        latencies: [latency || 0],
        timestamps: [Date.now()],
        avgLatency: latency || 0,
        minLatency: latency || 0,
        maxLatency: latency || 0,
        lastCheck: Date.now(),
      };
      const newMap = new Map(results);
      newMap.set(target, newResult);
      results = newMap;
    }
  }

  // Check all targets
  async function checkAll() {
    if (isChecking || targets.length === 0) return;
    isChecking = true;
    for (const target of targets) {
      await checkTarget(target);
    }
    isChecking = false;
  }

  // Add target
  function addTarget() {
    if (!newTarget) return;

    let url = newTarget.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    if (!targets.includes(url)) {
      targets = [...targets, url];
      saveToStorage();
      checkTarget(url);
    }

    newTarget = "";
  }

  // Remove target
  function removeTarget(target: string) {
    targets = targets.filter((t) => t !== target);
    const newMap = new Map(results);
    newMap.delete(target);
    results = newMap;
    saveToStorage();
  }

  // Load defaults
  function loadDefaults() {
    for (const endpoint of defaultEndpoints) {
      if (!targets.includes(endpoint.url)) {
        targets = [...targets, endpoint.url];
      }
    }
    saveToStorage();
    checkAll();
  }

  // Clear history
  function clearHistory() {
    results = new Map();
    toaster.success({ title: "Cleared", description: "All history cleared" });
  }

  // Export to CSV
  function exportCSV() {
    let csv = "Target,Timestamp,Latency (ms)\n";
    results.forEach((result, target) => {
      for (let i = 0; i < result.latencies.length; i++) {
        csv += `"${target}",${result.timestamps[i]},${result.latencies[i]}\n`;
      }
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `latency-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Format time ago
  function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  // Initialize on mount (run once)
  onMount(() => {
    if (initialized) return;
    initialized = true;
    
    const savedTargets = loadFromStorage();
    if (savedTargets.length > 0) {
      targets = savedTargets;
      checkAll();
    } else {
      loadDefaults();
    }
  });

  // Auto-check interval
  let intervalId: number | null = null;
  $effect(() => {
    if (autoCheck && checkInterval > 0) {
      intervalId = window.setInterval(checkAll, checkInterval * 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  });
</script>

<svelte:head>
  <title>Ping/Latency Monitor - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-5xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Activity class="size-8 text-primary-500" />
      Ping/Latency Monitor
      <span class="badge variant-filled-secondary text-xs">V0.10</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Measure and track network latency to multiple endpoints
    </p>
  </div>

  <!-- Controls -->
  <div class="card p-4 bg-surface-50 dark:bg-surface-900 mb-6">
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="flex gap-2">
        <button class="btn variant-filled-primary" onclick={checkAll} disabled={isChecking}>
          {#if isChecking}
            <RefreshCw class="size-4 animate-spin" />
          {:else}
            <Activity class="size-4" />
          {/if}
          Check Now
        </button>
        <button class="btn variant-soft-surface" onclick={loadDefaults}>
          Load Defaults
        </button>
        <button class="btn variant-soft-surface" onclick={clearHistory}>
          <Trash2 class="size-4" />
          Clear
        </button>
        <button class="btn variant-soft-surface" onclick={exportCSV}>
          <Download class="size-4" />
          Export
        </button>
      </div>

      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" class="checkbox" bind:checked={autoCheck} />
          <span class="text-sm">Auto-check</span>
        </label>
        {#if autoCheck}
          <select class="select select-sm" bind:value={checkInterval}>
            <option value={10}>Every 10s</option>
            <option value={30}>Every 30s</option>
            <option value={60}>Every 1m</option>
            <option value={300}>Every 5m</option>
          </select>
        {/if}
      </div>
    </div>
  </div>

  <!-- Add Target -->
  <div class="card p-4 bg-surface-50 dark:bg-surface-900 mb-6">
    <div class="flex gap-2">
      <input
        type="text"
        class="input flex-1"
        bind:value={newTarget}
        placeholder="Add endpoint URL (e.g., https://api.example.com)"
        onkeydown={(e) => e.key === "Enter" && addTarget()}
      />
      <button class="btn variant-soft-surface" onclick={addTarget}>
        <Plus class="size-4" />
        Add
      </button>
    </div>
  </div>

  <!-- Results Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each Array.from(results.entries()) as [target, result]}
      <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-3">
        <div class="flex justify-between items-start">
          <div class="flex-1 min-w-0">
            <h3 class="font-medium truncate" title={target}>{target.replace(/^https?:\/\//, "").split("/")[0]}</h3>
            <p class="text-xs text-surface-500">{timeAgo(result.lastCheck)}</p>
          </div>
          <button
            class="btn-icon btn-icon-sm variant-ghost-surface"
            onclick={() => removeTarget(target)}
          >
            <Trash2 class="size-4" />
          </button>
        </div>

        <!-- Current Latency -->
        <div class="text-center py-2">
          <div class="text-4xl font-bold {result.latencies[result.latencies.length - 1] < 100 ? 'text-success-500' : result.latencies[result.latencies.length - 1] < 300 ? 'text-warning-500' : 'text-error-500'}">
            {result.latencies[result.latencies.length - 1] > 0 ? result.latencies[result.latencies.length - 1] : '--'}
            <span class="text-lg font-normal text-surface-500">ms</span>
          </div>
          {#if result.latencies[result.latencies.length - 2] && result.latencies[result.latencies.length - 1] > 0}
            <div class="flex items-center justify-center gap-1 text-sm">
              {#if result.latencies[result.latencies.length - 1] < result.latencies[result.latencies.length - 2]}
                <TrendingDown class="size-4 text-success-500" />
                <span class="text-success-500">-{result.latencies[result.latencies.length - 2] - result.latencies[result.latencies.length - 1]}ms</span>
              {:else if result.latencies[result.latencies.length - 1] > result.latencies[result.latencies.length - 2]}
                <TrendingUp class="size-4 text-error-500" />
                <span class="text-error-500">+{result.latencies[result.latencies.length - 1] - result.latencies[result.latencies.length - 2]}ms</span>
              {:else}
                <span class="text-surface-500">No change</span>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-2 text-xs text-center">
          <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded">
            <div class="font-bold">{result.minLatency || '--'}</div>
            <div class="text-surface-500">Min</div>
          </div>
          <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded">
            <div class="font-bold">{result.avgLatency || '--'}</div>
            <div class="text-surface-500">Avg</div>
          </div>
          <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded">
            <div class="font-bold">{result.maxLatency || '--'}</div>
            <div class="text-surface-500">Max</div>
          </div>
        </div>

        <!-- Mini Graph -->
        <div class="h-12 flex items-end gap-0.5">
          {#each result.latencies.slice(-30) as latency, i}
            <div
              class="flex-1 rounded-t transition-all {latency > 0 ? (latency < 100 ? 'bg-success-500' : latency < 300 ? 'bg-warning-500' : 'bg-error-500') : 'bg-surface-300'}"
              style="height: {latency > 0 ? Math.min((latency / Math.max(result.maxLatency, 1)) * 100, 100) : 5}%"
              title={`${latency}ms`}
            ></div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if results.size === 0}
    <div class="text-center py-12 text-surface-500">
      <Activity class="size-16 mx-auto mb-4 opacity-50" />
      <p>No targets added yet.</p>
      <button class="btn variant-soft-surface mt-4" onclick={loadDefaults}>
        Load Default Endpoints
      </button>
    </div>
  {/if}
</div>
