<script lang="ts">
  import { toaster } from "$lib/toaster.svelte";
  import { Activity, RefreshCw, CheckCircle, XCircle, Clock } from "@lucide/svelte";

  interface LatencyResult {
    name: string;
    url: string;
    latency: number | null;
    status: "pending" | "success" | "error";
  }

  let localIps = $state<Set<string>>(new Set());
  let publicIps = $state<Set<string>>(new Set());
  let scanning = $state(false);
  let error = $state("");

  // Latency check state
  let latencyResults = $state<LatencyResult[]>([
    { name: "Cloudflare", url: "https://1.1.1.1/cdn-cgi/trace", latency: null, status: "pending" },
    { name: "Google", url: "https://www.google.com/generate_204", latency: null, status: "pending" },
    { name: "AWS US-East", url: "https://ec2.us-east-1.amazonaws.com", latency: null, status: "pending" },
    { name: "AWS EU-West", url: "https://ec2.eu-west-1.amazonaws.com", latency: null, status: "pending" },
    { name: "Azure", url: "https://azure.microsoft.com", latency: null, status: "pending" },
  ]);
  let latencyChecking = $state(false);
  let averageLatency = $state<number | null>(null);

  async function startScan() {
    scanning = true;
    localIps = new Set();
    publicIps = new Set();
    error = "";

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      pc.createDataChannel(""); // create a bogus data channel

      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          scanning = false;
          pc.close();
          return;
        }

        // Parse candidate
        // Format: candidate:842163049 1 udp 1677729535 192.168.1.5 56502 typ host generation 0 ufrag ...
        const parts = e.candidate.candidate.split(" ");
        if (parts.length >= 5) {
          const ip = parts[4];
          const type = parts[7]; // host, srflx, relay

          // Identify type
          if (type === "host") {
            // Check if actually private or public (some people have public host IPs)
            // Simple regex for private
            if (
              /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)/.test(
                ip,
              ) ||
              ip.endsWith(".local")
            ) {
              localIps = new Set(localIps.add(ip));
            } else if (ip.includes(":")) {
              // IPv6
              // Assume host IPv6 might be global unicast (public-ish) but listed as 'host'
              // Link local fe80...
              if (ip.startsWith("fe80") || ip === "::1") {
                localIps = new Set(localIps.add(ip));
              } else {
                // Global IPv6
                publicIps = new Set(publicIps.add(ip));
              }
            } else {
              // Public IPv4 'host'
              publicIps = new Set(publicIps.add(ip));
            }
          } else if (type === "srflx") {
            publicIps = new Set(publicIps.add(ip));
          }
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Timeout to stop scanning if valid end fails
      setTimeout(() => {
        if (scanning) {
          scanning = false;
          pc.close();
        }
      }, 5000);
    } catch (err: any) {
      error = err.message || "Failed to start WebRTC";
      scanning = false;
    }
  }

  async function checkLatency() {
    latencyChecking = true;
    averageLatency = null;

    // Reset all results
    latencyResults = latencyResults.map((r) => ({
      ...r,
      latency: null,
      status: "pending" as const,
    }));

    const results: number[] = [];

    // Check each endpoint
    for (let i = 0; i < latencyResults.length; i++) {
      const result = latencyResults[i];
      const start = performance.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(result.url, {
          method: "HEAD",
          mode: "no-cors",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const end = performance.now();
        const latency = Math.round(end - start);

        latencyResults[i] = {
          ...result,
          latency,
          status: "success",
        };
        results.push(latency);
      } catch (err) {
        latencyResults[i] = {
          ...result,
          latency: null,
          status: "error",
        };
      }
    }

    // Calculate average
    if (results.length > 0) {
      averageLatency = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
    }

    latencyChecking = false;
  }

  function getLatencyColor(latency: number | null): string {
    if (latency === null) return "text-surface-500";
    if (latency < 100) return "text-success-500";
    if (latency < 200) return "text-warning-500";
    return "text-error-500";
  }

  function getLatencyLabel(latency: number | null): string {
    if (latency === null) return "—";
    return `${latency}ms`;
  }
</script>

<svelte:head>
  <title>Network Diagnostics - NetOps Solutions</title>
</svelte:head>

<div
  class="container mx-auto p-4 max-w-4xl h-full flex flex-col overflow-y-auto pb-20"
>
  <div class="mb-6">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Activity class="size-8 text-primary-500" />
      Network Diagnostics
      <span class="badge variant-filled-secondary text-xs">V0.4</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Test WebRTC IP leaks and measure network latency
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Panel 1: WebRTC Test -->
    <div
      class="card p-6 bg-surface-50 dark:bg-surface-900 border border-surface-500/20 space-y-4"
    >
      <h3 class="h3 font-bold">WebRTC IP Leak Test</h3>
      <p class="text-sm text-surface-500">
        This test uses your browser's WebRTC capability to discover local LAN
        IPs and your public IP (via STUN). This attempts to simulate what a
        website can see even through some VPN configurations.
      </p>

      <button
        class="btn variant-filled-primary font-bold"
        onclick={startScan}
        disabled={scanning}
      >
        {#if scanning}
          <RefreshCw class="size-4 animate-spin" />
          Scanning...
        {:else}
          Start Scan
        {/if}
      </button>

      {#if error}
        <div class="alert variant-filled-error p-2 text-sm">{error}</div>
      {/if}

      <div class="space-y-4 pt-4">
        <div>
          <h4 class="font-bold text-sm text-surface-500 uppercase mb-2">
            Local / LAN IPs
          </h4>
          {#if localIps.size > 0}
            <div class="flex flex-wrap gap-2">
              {#each Array.from(localIps) as ip}
                <span class="badge variant-soft-secondary font-mono">{ip}</span>
              {/each}
            </div>
          {:else}
            <span class="text-xs text-surface-500 italic">None detected yet...</span>
          {/if}
        </div>
        <div>
          <h4 class="font-bold text-sm text-surface-500 uppercase mb-2">
            Public / STUN IPs
          </h4>
          {#if publicIps.size > 0}
            <div class="flex flex-wrap gap-2">
              {#each Array.from(publicIps) as ip}
                <span class="badge variant-filled-error font-mono">{ip}</span>
              {/each}
            </div>
          {:else}
            <span class="text-xs text-surface-500 italic">None detected yet...</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Panel 2: Latency Check -->
    <div
      class="card p-6 bg-surface-50 dark:bg-surface-900 border border-surface-500/20 space-y-4"
    >
      <h3 class="h3 font-bold flex items-center gap-2">
        <Clock class="size-5 text-primary-500" />
        Latency Check
      </h3>
      <p class="text-sm text-surface-500">
        Measure round-trip time to various CDN and cloud providers.
      </p>

      <button
        class="btn variant-filled-primary font-bold"
        onclick={checkLatency}
        disabled={latencyChecking}
      >
        {#if latencyChecking}
          <RefreshCw class="size-4 animate-spin" />
          Checking...
        {:else}
          Check Latency
        {/if}
      </button>

      <!-- Results -->
      <div class="space-y-2 pt-2">
        {#each latencyResults as result}
          <div
            class="flex justify-between items-center p-3 bg-surface-100 dark:bg-surface-800 rounded-lg"
          >
            <span class="font-medium text-sm">{result.name}</span>
            <div class="flex items-center gap-2">
              {#if result.status === "pending"}
                <span class="text-xs text-surface-500">—</span>
              {:else if result.status === "success"}
                <span class="font-mono text-sm {getLatencyColor(result.latency)}">
                  {getLatencyLabel(result.latency)}
                </span>
                <CheckCircle class="size-4 text-success-500" />
              {:else}
                <span class="text-xs text-error-500">Failed</span>
                <XCircle class="size-4 text-error-500" />
              {/if}
            </div>
          </div>
        {/each}
      </div>

      {#if averageLatency !== null}
        <div class="p-4 bg-primary-500/10 rounded-lg text-center">
          <div class="text-2xl font-bold text-primary-500">{averageLatency}ms</div>
          <div class="text-xs text-surface-500">Average Latency</div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Legend -->
  <div class="mt-6 p-4 bg-surface-50 dark:bg-surface-900 rounded-lg">
    <h4 class="font-medium mb-2">Latency Legend</h4>
    <div class="flex gap-6 text-sm">
      <span class="flex items-center gap-2">
        <span class="w-3 h-3 rounded bg-success-500"></span>
        <span class="text-success-500">&lt;100ms</span> Excellent
      </span>
      <span class="flex items-center gap-2">
        <span class="w-3 h-3 rounded bg-warning-500"></span>
        <span class="text-warning-500">100-200ms</span> Good
      </span>
      <span class="flex items-center gap-2">
        <span class="w-3 h-3 rounded bg-error-500"></span>
        <span class="text-error-500">&gt;200ms</span> Slow
      </span>
    </div>
  </div>
</div>