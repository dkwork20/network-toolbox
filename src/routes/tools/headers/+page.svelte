<script lang="ts">
  import { FileSearch, AlertCircle, CheckCircle, Shield, Clock, RefreshCw, ExternalLink } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  interface HeaderInfo {
    name: string;
    value: string;
    status: "good" | "warning" | "missing" | "info";
    description: string;
    recommendation?: string;
  }

  // State
  let url = $state("");
  let headers = $state<HeaderInfo[]>([]);
  let isLoading = $state(false);
  let error = $state("");
  let scanTime = $state<number | null>(null);

  // Security headers to check
  const securityHeaders = [
    {
      name: "Strict-Transport-Security",
      description: "Enforces HTTPS connections",
      recommendation: "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains",
    },
    {
      name: "Content-Security-Policy",
      description: "Prevents XSS attacks by controlling resource loading",
      recommendation: "Add a CSP header to restrict resource sources",
    },
    {
      name: "X-Frame-Options",
      description: "Prevents clickjacking attacks",
      recommendation: "Add: X-Frame-Options: DENY or SAMEORIGIN",
    },
    {
      name: "X-Content-Type-Options",
      description: "Prevents MIME type sniffing",
      recommendation: "Add: X-Content-Type-Options: nosniff",
    },
    {
      name: "X-XSS-Protection",
      description: "Enables browser XSS filter (legacy)",
      recommendation: "Consider Content-Security-Policy instead",
    },
    {
      name: "Referrer-Policy",
      description: "Controls referrer information sent with requests",
      recommendation: "Add: Referrer-Policy: strict-origin-when-cross-origin",
    },
    {
      name: "Permissions-Policy",
      description: "Controls browser features and APIs",
      recommendation: "Add Permissions-Policy to restrict features",
    },
  ];

  // Fetch headers
  async function fetchHeaders() {
    error = "";
    headers = [];

    if (!url) {
      error = "Please enter a URL";
      return;
    }

    // Normalize URL
    let fetchUrl = url.trim();
    if (!fetchUrl.startsWith("http://") && !fetchUrl.startsWith("https://")) {
      fetchUrl = "https://" + fetchUrl;
    }

    isLoading = true;
    const startTime = performance.now();

    try {
      const response = await fetch(fetchUrl, {
        method: "HEAD",
        mode: "cors",
      });

      const responseHeaders = response.headers;
      const result: HeaderInfo[] = [];

      // Check security headers
      for (const secHeader of securityHeaders) {
        const value = responseHeaders.get(secHeader.name);
        if (value) {
          result.push({
            name: secHeader.name,
            value: value,
            status: "good",
            description: secHeader.description,
          });
        } else {
          result.push({
            name: secHeader.name,
            value: "",
            status: "missing",
            description: secHeader.description,
            recommendation: secHeader.recommendation,
          });
        }
      }

      // Get all headers for info
      const allHeaders: string[] = [];
      responseHeaders.forEach((value, key) => {
        if (!result.find((h) => h.name.toLowerCase() === key.toLowerCase())) {
          allHeaders.push(`${key}: ${value}`);
        }
      });

      // Add other important headers
      const importantHeaders = ["Server", "X-Powered-By", "Cache-Control", "Expires", "ETag"];
      for (const header of importantHeaders) {
        const value = responseHeaders.get(header);
        if (value) {
          result.push({
            name: header,
            value: value,
            status: header === "X-Powered-By" ? "warning" : "info",
            description:
              header === "X-Powered-By"
                ? "Reveals server technology (security risk)"
                : `Standard ${header} header`,
            recommendation:
              header === "X-Powered-By"
                ? "Consider removing X-Powered-By header for security"
                : undefined,
          });
        }
      }

      headers = result;
      scanTime = Math.round(performance.now() - startTime);
    } catch (e) {
      error = `Failed to fetch headers: ${e instanceof Error ? e.message : "Unknown error"}. The site may block CORS requests.`;
    }

    isLoading = false;
  }

  // Get status icon
  function getStatusIcon(status: string) {
    switch (status) {
      case "good":
        return CheckCircle;
      case "warning":
      case "missing":
        return AlertCircle;
      default:
        return null;
    }
  }

  // Get status color
  function getStatusColor(status: string): string {
    switch (status) {
      case "good":
        return "text-success-500";
      case "warning":
        return "text-warning-500";
      case "missing":
        return "text-error-500";
      default:
        return "text-surface-500";
    }
  }

  // Calculate security score
  function getSecurityScore(): number {
    if (headers.length === 0) return 0;
    const goodCount = headers.filter((h) => h.status === "good").length;
    const securityHeaderCount = securityHeaders.length;
    return Math.round((goodCount / securityHeaderCount) * 100);
  }

  // Clear
  function clearAll() {
    url = "";
    headers = [];
    error = "";
    scanTime = null;
  }
</script>

<svelte:head>
  <title>HTTP Headers Analyzer - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-5xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <FileSearch class="size-8 text-primary-500" />
      HTTP Headers Analyzer
      <span class="badge variant-filled-secondary text-xs">V0.10</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Analyze HTTP security headers and get recommendations for improvements
    </p>
  </div>

  <!-- Input -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4 mb-6">
    <label class="label">
      <span>Website URL</span>
      <div class="flex gap-2">
        <input
          type="text"
          class="input flex-1"
          bind:value={url}
          placeholder="example.com or https://example.com"
          onkeydown={(e) => e.key === "Enter" && fetchHeaders()}
        />
        <button class="btn variant-filled-primary" onclick={fetchHeaders} disabled={isLoading}>
          {#if isLoading}
            <RefreshCw class="size-4 animate-spin" />
          {:else}
            <Shield class="size-4" />
          {/if}
          Analyze
        </button>
        <button class="btn variant-soft-surface" onclick={clearAll}>
          Clear
        </button>
      </div>
    </label>

    <p class="text-xs text-surface-500">
      Note: Some sites may block CORS requests. Results are limited to headers exposed by the server.
    </p>
  </div>

  <!-- Error -->
  {#if error}
    <div class="alert variant-filled-error mb-6">
      <AlertCircle class="size-5" />
      <span>{error}</span>
    </div>
  {/if}

  <!-- Results -->
  {#if headers.length > 0}
    <!-- Security Score -->
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="h2 font-bold">Security Score</h2>
          <p class="text-surface-500 text-sm">
            {scanTime}ms scan time
          </p>
        </div>
        <div class="text-right">
          <div class="text-5xl font-bold {getSecurityScore() >= 70 ? 'text-success-500' : getSecurityScore() >= 40 ? 'text-warning-500' : 'text-error-500'}">
            {getSecurityScore()}%
          </div>
          <p class="text-sm text-surface-500">
            {headers.filter((h) => h.status === "good").length}/{securityHeaders.length} security headers
          </p>
        </div>
      </div>

      <div class="mt-4 h-4 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
        <div
          class="h-full transition-all {getSecurityScore() >= 70 ? 'bg-success-500' : getSecurityScore() >= 40 ? 'bg-warning-500' : 'bg-error-500'}"
          style="width: {getSecurityScore()}%"
        ></div>
      </div>
    </div>

    <!-- Headers List -->
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
      <h2 class="h2 font-bold">Security Headers</h2>

      <div class="space-y-3">
        {#each headers as header}
          <div
            class="p-4 rounded-lg {header.status === 'good' ? 'bg-success-500/10' : header.status === 'missing' ? 'bg-error-500/10' : header.status === 'warning' ? 'bg-warning-500/10' : 'bg-surface-100 dark:bg-surface-800'}"
          >
            <div class="flex items-start gap-3">
              {#if getStatusIcon(header.status)}
                <svelte:component
                  this={getStatusIcon(header.status)}
                  class="size-5 mt-0.5 {getStatusColor(header.status)}"
                />
              {/if}
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{header.name}</span>
                  {#if header.status === 'good'}
                    <span class="badge variant-filled-success text-xs">Present</span>
                  {:else if header.status === 'missing'}
                    <span class="badge variant-filled-error text-xs">Missing</span>
                  {:else if header.status === 'warning'}
                    <span class="badge variant-filled-warning text-xs">Warning</span>
                  {/if}
                </div>

                <p class="text-sm text-surface-500 mt-1">{header.description}</p>

                {#if header.value}
                  <code class="text-xs bg-surface-200 dark:bg-surface-700 px-2 py-1 rounded mt-2 block break-all">
                    {header.value}
                  </code>
                {/if}

                {#if header.recommendation}
                  <p class="text-sm text-primary-500 mt-2">
                    💡 {header.recommendation}
                  </p>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Info Section -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold">About Security Headers</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <h3 class="font-medium mb-2">Essential Headers</h3>
        <ul class="space-y-1 text-surface-500">
          <li><strong>Strict-Transport-Security</strong> - Forces HTTPS</li>
          <li><strong>Content-Security-Policy</strong> - Prevents XSS</li>
          <li><strong>X-Frame-Options</strong> - Prevents clickjacking</li>
          <li><strong>X-Content-Type-Options</strong> - Prevents MIME sniffing</li>
        </ul>
      </div>
      <div>
        <h3 class="font-medium mb-2">Additional Headers</h3>
        <ul class="space-y-1 text-surface-500">
          <li><strong>Referrer-Policy</strong> - Controls referrer data</li>
          <li><strong>Permissions-Policy</strong> - Restricts browser features</li>
          <li><strong>X-XSS-Protection</strong> - Legacy XSS filter</li>
          <li><strong>Cache-Control</strong> - Caching directives</li>
        </ul>
      </div>
    </div>

    <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
      <h3 class="font-medium mb-2">CORS Limitation</h3>
      <p class="text-sm text-surface-500">
        Due to browser security (CORS), this tool can only analyze headers that the server explicitly exposes.
        For a complete security audit, use a server-side tool or security scanner.
      </p>
    </div>
  </div>
</div>
