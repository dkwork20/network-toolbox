<script lang="ts">
  import { Scan, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Server } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  interface PortResult {
    port: number;
    service: string;
    status: "open" | "closed" | "filtered" | "unknown";
    time: number | null;
  }

  // Common ports
  const commonPorts: { port: number; service: string }[] = [
    { port: 21, service: "FTP" },
    { port: 22, service: "SSH" },
    { port: 23, service: "Telnet" },
    { port: 25, service: "SMTP" },
    { port: 53, service: "DNS" },
    { port: 80, service: "HTTP" },
    { port: 110, service: "POP3" },
    { port: 143, service: "IMAP" },
    { port: 443, service: "HTTPS" },
    { port: 445, service: "SMB" },
    { port: 993, service: "IMAPS" },
    { port: 995, service: "POP3S" },
    { port: 1433, service: "MSSQL" },
    { port: 1521, service: "Oracle" },
    { port: 3306, service: "MySQL" },
    { port: 3389, service: "RDP" },
    { port: 5432, service: "PostgreSQL" },
    { port: 5900, service: "VNC" },
    { port: 6379, service: "Redis" },
    { port: 8080, service: "HTTP-Alt" },
    { port: 8443, service: "HTTPS-Alt" },
    { port: 27017, service: "MongoDB" },
  ];

  // State
  let hostname = $state("");
  let customPorts = $state("");
  let results = $state<PortResult[]>([]);
  let isScanning = $state(false);
  let scanProgress = $state(0);

  // Check a single port using fetch timing
  async function checkPort(host: string, port: number): Promise<PortResult> {
    const startTime = performance.now();
    
    try {
      // Try to connect using fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const protocol = port === 443 || port === 993 || port === 995 || port === 8443 ? "https" : "http";
      const url = `${protocol}://${host}:${port}/`;

      const response = await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
        signal: controller.signal,
      }).catch((e) => e);

      clearTimeout(timeoutId);
      const elapsed = performance.now() - startTime;

      // In no-cors mode, we can't actually read the response
      // But we can infer status from timing and errors
      if (response instanceof Error) {
        const errorName = response.name || "";
        if (errorName === "AbortError") {
          return { port, service: getServiceName(port), status: "filtered", time: null };
        }
        // Network error might mean port is closed
        return { port, service: getServiceName(port), status: "closed", time: Math.round(elapsed) };
      }

      // Got a response (even if opaque) - port is likely open
      return { port, service: getServiceName(port), status: "open", time: Math.round(elapsed) };
    } catch {
      return { port, service: getServiceName(port), status: "unknown", time: null };
    }
  }

  function getServiceName(port: number): string {
    const found = commonPorts.find((p) => p.port === port);
    return found?.service || "Unknown";
  }

  // Start scan
  async function startScan() {
    if (!hostname) {
      toaster.error({ title: "Error", description: "Please enter a hostname" });
      return;
    }

    // Determine ports to scan
    let portsToScan: number[] = [];
    
    if (customPorts.trim()) {
      // Parse custom ports
      const portStrings = customPorts.split(",").map((p) => p.trim());
      for (const ps of portStrings) {
        if (ps.includes("-")) {
          const [start, end] = ps.split("-").map((n) => parseInt(n));
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              portsToScan.push(i);
            }
          }
        } else {
          const port = parseInt(ps);
          if (!isNaN(port) && port > 0 && port <= 65535) {
            portsToScan.push(port);
          }
        }
      }
    } else {
      // Use common ports
      portsToScan = commonPorts.map((p) => p.port);
    }

    // Remove duplicates and sort
    portsToScan = [...new Set(portsToScan)].sort((a, b) => a - b);

    results = [];
    isScanning = true;
    scanProgress = 0;

    for (let i = 0; i < portsToScan.length; i++) {
      const port = portsToScan[i];
      scanProgress = Math.round(((i + 1) / portsToScan.length) * 100);

      const result = await checkPort(hostname, port);
      results = [...results, result];
    }

    isScanning = false;
    toaster.success({ title: "Complete", description: `Scanned ${portsToScan.length} ports` });
  }

  // Clear
  function clearAll() {
    hostname = "";
    customPorts = "";
    results = [];
    scanProgress = 0;
  }

  // Stats
  let openCount = $derived(results.filter((r) => r.status === "open").length);
  let closedCount = $derived(results.filter((r) => r.status === "closed").length);
  let sortedResults = $derived([...results].sort((a, b) => a.port - b.port));
</script>

<svelte:head>
  <title>Port Scanner - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-5xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Scan class="size-8 text-primary-500" />
      Port Scanner
      <span class="badge variant-filled-secondary text-xs">V0.10</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Check common ports for open/closed status (browser-based, limited accuracy)
    </p>
  </div>

  <!-- Warning -->
  <div class="alert variant-soft-warning mb-6">
    <AlertTriangle class="size-5" />
    <div>
      <strong>Browser Limitation:</strong> True port scanning requires system-level access.
      This tool uses HTTP timing which has limited accuracy. For production security audits, use dedicated tools like nmap.
    </div>
  </div>

  <!-- Input -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4 mb-6">
    <label class="label">
      <span>Hostname or IP</span>
      <input
        type="text"
        class="input"
        bind:value={hostname}
        placeholder="example.com or 192.168.1.1"
      />
    </label>

    <label class="label">
      <span>Custom Ports (optional)</span>
      <input
        type="text"
        class="input"
        bind:value={customPorts}
        placeholder="Leave empty for common ports, or: 80,443,8080 or 1-100"
      />
      <p class="text-xs text-surface-500">Comma-separated ports or ranges. Leave empty to scan common ports.</p>
    </label>

    <div class="flex gap-2">
      <button
        class="btn variant-filled-primary flex-1"
        onclick={startScan}
        disabled={isScanning || !hostname}
      >
        {#if isScanning}
          <RefreshCw class="size-4 animate-spin" />
          Scanning... {scanProgress}%
        {:else}
          <Scan class="size-4" />
          Start Scan
        {/if}
      </button>
      <button class="btn variant-soft-surface" onclick={clearAll}>
        Clear
      </button>
    </div>

    {#if isScanning}
      <div class="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary-500 transition-all"
          style="width: {scanProgress}%"
        ></div>
      </div>
    {/if}
  </div>

  <!-- Results Stats -->
  {#if results.length > 0}
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="card p-4 bg-success-500/10 text-center">
        <div class="text-3xl font-bold text-success-500">{openCount}</div>
        <div class="text-sm text-surface-500">Open</div>
      </div>
      <div class="card p-4 bg-error-500/10 text-center">
        <div class="text-3xl font-bold text-error-500">{closedCount}</div>
        <div class="text-sm text-surface-500">Closed</div>
      </div>
      <div class="card p-4 bg-surface-100 dark:bg-surface-800 text-center">
        <div class="text-3xl font-bold">{results.length}</div>
        <div class="text-sm text-surface-500">Total Scanned</div>
      </div>
    </div>

    <!-- Results Table -->
    <div class="card p-6 bg-surface-50 dark:bg-surface-900">
      <h2 class="h2 font-bold mb-4">Scan Results</h2>
      <div class="overflow-x-auto">
        <table class="table w-full text-sm">
          <thead>
            <tr>
              <th>Port</th>
              <th>Service</th>
              <th>Status</th>
              <th>Response Time</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedResults as result}
              <tr>
                <td class="font-mono">{result.port}</td>
                <td>{result.service}</td>
                <td>
                  {#if result.status === 'open'}
                    <span class="badge variant-filled-success flex items-center gap-1 w-fit">
                      <CheckCircle class="size-3" /> Open
                    </span>
                  {:else if result.status === 'closed'}
                    <span class="badge variant-filled-error flex items-center gap-1 w-fit">
                      <XCircle class="size-3" /> Closed
                    </span>
                  {:else if result.status === 'filtered'}
                    <span class="badge variant-filled-warning flex items-center gap-1 w-fit">
                      <Clock class="size-3" /> Filtered
                    </span>
                  {:else}
                    <span class="badge variant-soft-surface">Unknown</span>
                  {/if}
                </td>
                <td>
                  {#if result.time}
                    {result.time}ms
                  {:else}
                    -
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- Common Ports Reference -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold">Common Ports Reference</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
      {#each commonPorts.slice(0, 16) as { port, service }}
        <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded text-center">
          <span class="font-mono font-bold">{port}</span>
          <br>
          <span class="text-surface-500">{service}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
