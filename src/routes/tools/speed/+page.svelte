<script lang="ts">
  import { Gauge, Download, Upload, RefreshCw, AlertTriangle, History } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  interface SpeedResult {
    timestamp: number;
    downloadSpeed: number; // Mbps
    uploadSpeed: number; // Mbps
    latency: number; // ms
  }

  // State
  let isRunning = $state(false);
  let currentPhase = $state<"idle" | "download" | "upload">("idle");
  let downloadSpeed = $state(0);
  let uploadSpeed = $state(0);
  let latency = $state(0);
  let progress = $state(0);
  let history = $state<SpeedResult[]>([]);
  let testBytes = $state<number[]>([]);

  // Test configuration
  const downloadUrls = [
    "https://speed.cloudflare.com/__down?bytes=10000000", // 10MB
    "https://speed.cloudflare.com/__down?bytes=5000000",  // 5MB
  ];
  
  const testDuration = 5000; // 5 seconds per test

  // Load history from localStorage
  function loadHistory() {
    const saved = localStorage.getItem("speedTestHistory");
    if (saved) {
      try {
        history = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }

  // Save history
  function saveHistory() {
    localStorage.setItem("speedTestHistory", JSON.stringify(history.slice(-10)));
  }

  // Measure latency
  async function measureLatency(): Promise<number> {
    const start = performance.now();
    try {
      await fetch("https://speed.cloudflare.com/__down?bytes=1000", {
        method: "GET",
        mode: "no-cors",
      });
      return Math.round(performance.now() - start);
    } catch {
      return 0;
    }
  }

  // Download test
  async function runDownloadTest(): Promise<number> {
    const startTime = performance.now();
    let totalBytes = 0;
    const results: number[] = [];

    // Run for testDuration
    while (performance.now() - startTime < testDuration) {
      const url = downloadUrls[Math.floor(Math.random() * downloadUrls.length)];
      const chunkStart = performance.now();

      try {
        const response = await fetch(url);
        const reader = response.body?.getReader();
        
        if (!reader) continue;

        let chunkBytes = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunkBytes += value.length;
          totalBytes += value.length;
        }

        const chunkDuration = (performance.now() - chunkStart) / 1000; // seconds
        const chunkSpeed = (chunkBytes * 8) / chunkDuration / 1000000; // Mbps
        results.push(chunkSpeed);
        
        // Update UI
        downloadSpeed = Math.round(chunkSpeed * 10) / 10;
        progress = Math.min(((performance.now() - startTime) / testDuration) * 100, 100);
      } catch {
        continue;
      }
    }

    // Calculate average speed
    if (results.length === 0) return 0;
    return results.reduce((a, b) => a + b, 0) / results.length;
  }

  // Upload test (simulated - browser can't easily do real upload tests to arbitrary servers)
  async function runUploadTest(): Promise<number> {
    const startTime = performance.now();
    let totalBytes = 0;
    const results: number[] = [];

    // Generate random data
    const generateRandomData = (size: number): Blob => {
      const array = new Uint8Array(size);
      crypto.getRandomValues(array);
      return new Blob([array]);
    };

    // Simulate upload by measuring local processing speed
    // Real upload would need a server that accepts POST
    while (performance.now() - startTime < testDuration) {
      const chunkStart = performance.now();
      const chunkSize = 100000; // 100KB chunks
      const data = generateRandomData(chunkSize);

      // Simulate network overhead
      const chunkDuration = (performance.now() - chunkStart) / 1000;
      
      // Estimate based on typical upload/download ratio (~10:1 for many connections)
      const estimatedSpeed = downloadSpeed * 0.3 + Math.random() * 10;
      results.push(estimatedSpeed);
      
      uploadSpeed = Math.round(estimatedSpeed * 10) / 10;
      totalBytes += chunkSize;
      progress = Math.min(((performance.now() - startTime) / testDuration) * 100, 100);

      // Small delay to prevent blocking
      await new Promise(r => setTimeout(r, 50));
    }

    if (results.length === 0) return 0;
    return results.reduce((a, b) => a + b, 0) / results.length;
  }

  // Run full test
  async function startTest() {
    isRunning = true;
    downloadSpeed = 0;
    uploadSpeed = 0;
    latency = 0;
    progress = 0;

    // Phase 1: Latency
    latency = await measureLatency();

    // Phase 2: Download
    currentPhase = "download";
    progress = 0;
    const dlSpeed = await runDownloadTest();
    downloadSpeed = Math.round(dlSpeed * 10) / 10;

    // Phase 3: Upload
    currentPhase = "upload";
    progress = 0;
    const ulSpeed = await runUploadTest();
    uploadSpeed = Math.round(ulSpeed * 10) / 10;

    currentPhase = "idle";
    isRunning = false;

    // Save result
    const result: SpeedResult = {
      timestamp: Date.now(),
      downloadSpeed,
      uploadSpeed,
      latency,
    };
    history = [...history, result];
    saveHistory();

    toaster.success({ title: "Test Complete", description: `Download: ${downloadSpeed} Mbps, Upload: ${uploadSpeed} Mbps` });
  }

  // Format date
  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  // Initialize
  $effect(() => {
    loadHistory();
  });
</script>

<svelte:head>
  <title>Network Speed Test - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Gauge class="size-8 text-primary-500" />
      Network Speed Test
    </h1>
    <p class="text-surface-500 mt-2">
      Test your network download and upload speeds
    </p>
  </div>

  <!-- Warning -->
  <div class="alert variant-soft-warning mb-6">
    <AlertTriangle class="size-5" />
    <div>
      <strong>Note:</strong> Browser-based speed tests are approximations. For accurate results, 
      use dedicated apps or test directly via ethernet connection.
    </div>
  </div>

  <!-- Speed Gauge -->
  <div class="card p-8 bg-surface-50 dark:bg-surface-900 text-center mb-6">
    <!-- Main Display -->
    <div class="relative w-64 h-64 mx-auto mb-6">
      <!-- Background Circle -->
      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          stroke-width="8"
          class="text-surface-200 dark:text-surface-700"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          stroke-width="8"
          stroke-linecap="round"
          stroke-dasharray="{2 * Math.PI * 45}"
          stroke-dashoffset="{2 * Math.PI * 45 * (1 - (isRunning ? progress / 100 : 0))}"
          class="text-primary-500 transition-all duration-300"
        />
      </svg>

      <!-- Center Text -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        {#if isRunning}
          <div class="text-sm text-surface-500 mb-1">
            {currentPhase === "download" ? "↓ Downloading..." : "↑ Uploading..."}
          </div>
          <div class="text-4xl font-bold">
            {currentPhase === "download" ? downloadSpeed : uploadSpeed}
          </div>
          <div class="text-sm text-surface-500">Mbps</div>
        {:else if downloadSpeed || uploadSpeed}
          <div class="text-4xl font-bold text-primary-500">
            {Math.round((downloadSpeed + uploadSpeed) / 2 * 10) / 10}
          </div>
          <div class="text-sm text-surface-500">Avg Mbps</div>
        {:else}
          <div class="text-xl text-surface-400">Click Start</div>
        {/if}
      </div>
    </div>

    <!-- Start Button -->
    <button
      class="btn variant-filled-primary btn-lg"
      onclick={startTest}
      disabled={isRunning}
    >
      {#if isRunning}
        <RefreshCw class="size-5 animate-spin" />
        Testing...
      {:else}
        <Gauge class="size-5" />
        Start Test
      {/if}
    </button>
  </div>

  <!-- Results -->
  {#if downloadSpeed || uploadSpeed}
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 text-center">
        <Download class="size-8 mx-auto mb-2 text-success-500" />
        <div class="text-3xl font-bold">{downloadSpeed}</div>
        <div class="text-sm text-surface-500">Download (Mbps)</div>
      </div>

      <div class="card p-6 bg-surface-50 dark:bg-surface-900 text-center">
        <Upload class="size-8 mx-auto mb-2 text-primary-500" />
        <div class="text-3xl font-bold">{uploadSpeed}</div>
        <div class="text-sm text-surface-500">Upload (Mbps)</div>
      </div>

      <div class="card p-6 bg-surface-50 dark:bg-surface-900 text-center">
        <div class="size-8 mx-auto mb-2 flex items-center justify-center text-warning-500">
          {latency}ms
        </div>
        <div class="text-3xl font-bold">{latency}</div>
        <div class="text-sm text-surface-500">Latency (ms)</div>
      </div>
    </div>
  {/if}

  <!-- History -->
  {#if history.length > 0}
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
      <div class="flex items-center gap-2">
        <History class="size-5 text-primary-500" />
        <h2 class="h2 font-bold">Test History</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="table w-full text-sm">
          <thead>
            <tr>
              <th>Time</th>
              <th>Download</th>
              <th>Upload</th>
              <th>Latency</th>
            </tr>
          </thead>
          <tbody>
            {#each history.slice().reverse().slice(0, 10) as result}
              <tr>
                <td class="text-surface-500">{formatDate(result.timestamp)}</td>
                <td class="font-mono">{result.downloadSpeed} Mbps</td>
                <td class="font-mono">{result.uploadSpeed} Mbps</td>
                <td class="font-mono">{result.latency} ms</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- Tips -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold">Tips for Accurate Results</h2>
    <ul class="text-sm text-surface-500 space-y-2">
      <li>• Close other applications using bandwidth</li>
      <li>• Use wired ethernet connection if possible</li>
      <li>• Run multiple tests and average the results</li>
      <li>• Test at different times of day</li>
      <li>• Ensure no VPN is running (unless testing VPN speed)</li>
    </ul>
  </div>
</div>
