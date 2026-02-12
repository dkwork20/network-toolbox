<script lang="ts">
  import { Search, Globe, MapPin, Building, Calendar, AlertCircle, RefreshCw, ExternalLink } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  interface WhoisInfo {
    domain: string;
    registrar: string;
    createdDate: string;
    updatedDate: string;
    expiryDate: string;
    status: string[];
    nameservers: string[];
    registrant: {
      name: string;
      organization: string;
      country: string;
      city: string;
    };
    dnssec: string;
    raw?: string;
  }

  // State
  let query = $state("");
  let queryType = $state<"domain" | "ip">("domain");
  let whoisInfo = $state<WhoisInfo | null>(null);
  let isLoading = $state(false);
  let error = $state("");

  // Public Whois APIs (free, rate-limited)
  const whoisApis = [
    "https://api.ip-api.com/json/", // For IP
    "https://ipapi.co/", // For IP
  ];

  // Check if string is IP
  function isIp(str: string): boolean {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(str) || /^[0-9a-fA-F:]+$/.test(str);
  }

  // Lookup
  async function lookup() {
    error = "";
    whoisInfo = null;

    if (!query) {
      error = "Please enter a domain or IP address";
      return;
    }

    const cleanQuery = query.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    isLoading = true;

    try {
      if (isIp(cleanQuery)) {
        // IP lookup using ip-api.com
        const response = await fetch(`https://ip-api.com/json/${cleanQuery}`);
        const data = await response.json();

        if (data.status === "fail") {
          throw new Error(data.message || "IP lookup failed");
        }

        whoisInfo = {
          domain: cleanQuery,
          registrar: data.isp || "Unknown",
          createdDate: "-",
          updatedDate: "-",
          expiryDate: "-",
          status: [],
          nameservers: [],
          registrant: {
            name: data.org || "Unknown",
            organization: data.org || "Unknown",
            country: data.country || "Unknown",
            city: data.city || "Unknown",
          },
          dnssec: "-",
        };
      } else {
        // Domain lookup - use RDAP or external API
        // For browser, we'll use a proxy service
        // Note: Direct WHOIS is not possible from browser due to CORS
        
        // Try using whoisjs.com API (free, no key required)
        const response = await fetch(`https://api.whoify.com/v1/whois/${cleanQuery}`);
        
        if (!response.ok) {
          // Fallback: Show limited info
          whoisInfo = {
            domain: cleanQuery,
            registrar: "Unable to fetch (API rate limited)",
            createdDate: "Unknown",
            updatedDate: "Unknown",
            expiryDate: "Unknown",
            status: [],
            nameservers: [],
            registrant: {
              name: "Unknown",
              organization: "Unknown",
              country: "Unknown",
              city: "Unknown",
            },
            dnssec: "Unknown",
          };
          
          // Show tip
          toaster.warning({
            title: "Limited Results",
            description: "Browser-based WHOIS is limited. Use terminal `whois` for full results.",
          });
        } else {
          const data = await response.json();
          
          whoisInfo = {
            domain: cleanQuery,
            registrar: data.registrar || data.registrar_name || "Unknown",
            createdDate: data.created_date || data.creation_date || "Unknown",
            updatedDate: data.updated_date || "Unknown",
            expiryDate: data.expiry_date || data.expiration_date || "Unknown",
            status: data.status || [],
            nameservers: data.name_servers || [],
            registrant: {
              name: data.registrant_name || "Unknown",
              organization: data.registrant_organization || "Unknown",
              country: data.registrant_country || "Unknown",
              city: data.registrant_city || "Unknown",
            },
            dnssec: data.dnssec || "Unknown",
          };
        }
      }
    } catch (e) {
      error = `Lookup failed: ${e instanceof Error ? e.message : "Unknown error"}. Try using terminal \`whois\` command.`;
    }

    isLoading = false;
  }

  // Clear
  function clearAll() {
    query = "";
    whoisInfo = null;
    error = "";
  }
</script>

<svelte:head>
  <title>Whois Lookup - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Search class="size-8 text-primary-500" />
      Whois Lookup
    </h1>
    <p class="text-surface-500 mt-2">
      Look up domain registration info and IP geolocation
    </p>
  </div>

  <!-- Warning -->
  <div class="alert variant-soft-warning mb-6">
    <AlertCircle class="size-5" />
    <div>
      <strong>Browser Limitation:</strong> Full WHOIS queries require system-level access.
      This tool uses public APIs with rate limits. For complete results, use terminal `whois`.
    </div>
  </div>

  <!-- Input -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4 mb-6">
    <label class="label">
      <span>Domain or IP Address</span>
      <div class="flex gap-2">
        <input
          type="text"
          class="input flex-1"
          bind:value={query}
          placeholder="example.com or 8.8.8.8"
          onkeydown={(e) => e.key === "Enter" && lookup()}
        />
        <button class="btn variant-filled-primary" onclick={lookup} disabled={isLoading}>
          {#if isLoading}
            <RefreshCw class="size-4 animate-spin" />
          {:else}
            <Search class="size-4" />
          {/if}
          Lookup
        </button>
        <button class="btn variant-soft-surface" onclick={clearAll}>
          Clear
        </button>
      </div>
    </label>

    <div class="flex gap-4">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="radio" class="radio" name="queryType" value="domain" bind:group={queryType} />
        <span class="text-sm">Domain</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="radio" class="radio" name="queryType" value="ip" bind:group={queryType} />
        <span class="text-sm">IP Address</span>
      </label>
    </div>
  </div>

  <!-- Error -->
  {#if error}
    <div class="alert variant-filled-error mb-6">
      <AlertCircle class="size-5" />
      <span>{error}</span>
    </div>
  {/if}

  <!-- Results -->
  {#if whoisInfo}
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
      <div class="flex items-center gap-3 mb-4">
        <Globe class="size-6 text-primary-500" />
        <h2 class="h2 font-bold">{whoisInfo.domain}</h2>
      </div>

      <!-- Domain Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-3">
          <h3 class="font-medium flex items-center gap-2">
            <Building class="size-4" />
            Registration
          </h3>

          <div class="space-y-2 text-sm">
            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="text-surface-500">Registrar</div>
              <div class="font-medium">{whoisInfo.registrar}</div>
            </div>

            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="text-surface-500">Created</div>
              <div class="font-mono">{whoisInfo.createdDate}</div>
            </div>

            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="text-surface-500">Expires</div>
              <div class="font-mono">{whoisInfo.expiryDate}</div>
            </div>

            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="text-surface-500">DNSSEC</div>
              <div>{whoisInfo.dnssec}</div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="font-medium flex items-center gap-2">
            <MapPin class="size-4" />
            Registrant
          </h3>

          <div class="space-y-2 text-sm">
            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="text-surface-500">Organization</div>
              <div class="font-medium">{whoisInfo.registrant.organization}</div>
            </div>

            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="text-surface-500">Country</div>
              <div>{whoisInfo.registrant.country}</div>
            </div>

            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="text-surface-500">City</div>
              <div>{whoisInfo.registrant.city}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Nameservers -->
      {#if whoisInfo.nameservers.length > 0}
        <div class="mt-4">
          <h3 class="font-medium mb-2">Name Servers</h3>
          <div class="flex flex-wrap gap-2">
            {#each whoisInfo.nameservers as ns}
              <span class="badge variant-soft-surface font-mono text-xs">{ns}</span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Status -->
      {#if whoisInfo.status.length > 0}
        <div class="mt-4">
          <h3 class="font-medium mb-2">Status</h3>
          <div class="flex flex-wrap gap-2">
            {#each whoisInfo.status as status}
              <span class="badge variant-soft-primary text-xs">{status}</span>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- External Links -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold">External Resources</h2>
    <div class="flex flex-wrap gap-2">
      <a
        href="https://lookup.icann.org/en/lookup"
        target="_blank"
        rel="noreferrer"
        class="btn btn-sm variant-soft-surface"
      >
        <ExternalLink class="size-4" />
        ICANN Lookup
      </a>
      <a
        href="https://www.whois.com/whois/"
        target="_blank"
        rel="noreferrer"
        class="btn btn-sm variant-soft-surface"
      >
        <ExternalLink class="size-4" />
        Whois.com
      </a>
      <a
        href="https://ipinfo.io/"
        target="_blank"
        rel="noreferrer"
        class="btn btn-sm variant-soft-surface"
      >
        <ExternalLink class="size-4" />
        IPInfo.io
      </a>
    </div>
  </div>
</div>
