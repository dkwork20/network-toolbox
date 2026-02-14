<script lang="ts">
  import { toaster } from "$lib/toaster.svelte";

  let domain = $state("");
  let recordType = $state("A");
  let isLoading = $state(false);
  let result: any = $state(null);
  let error = $state("");

  const recordTypes = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "PTR"];

  async function lookup() {
    if (!domain) return;
    isLoading = true;
    error = "";
    result = null;

    try {
      const res = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${recordType}`,
        {
          headers: {
            Accept: "application/dns-json",
          },
        },
      );

      if (!res.ok) throw new Error("DNS query failed");

      const data = await res.json();
      result = data;
    } catch (e: any) {
      error = e.message;
    } finally {
      isLoading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") lookup();
  }
</script>

<div class="container mx-auto p-4 max-w-4xl pb-20">
  <div class="mb-10 text-center">
    <div class="flex justify-center items-center gap-3">
      <h2 class="h2 font-bold">DNS Lookup</h2>
      <span class="badge preset-filled-secondary-500 text-xs">V0.4</span>
    </div>
    <p class="mt-2 text-surface-500">Query DNS records via Cloudflare DoH</p>
  </div>

  <div
    class="card p-6 bg-surface-50 dark:bg-surface-900 border border-surface-500/10 shadow-lg space-y-6"
  >
    <div class="flex flex-col md:flex-row gap-4">
      <div class="flex-1">
        <label class="label">
          <span class="font-bold">Domain Name</span>
          <input
            class="input"
            type="text"
            bind:value={domain}
            onkeydown={handleKeydown}
            placeholder="example.com"
          />
        </label>
      </div>
      <div class="w-full md:w-32">
        <label class="label">
          <span class="font-bold">Record</span>
          <select class="select" bind:value={recordType}>
            {#each recordTypes as type}
              <option value={type}>{type}</option>
            {/each}
          </select>
        </label>
      </div>
      <div class="flex items-end">
        <button
          class="btn preset-filled-primary-500 w-full md:w-auto"
          onclick={lookup}
          disabled={isLoading || !domain}
        >
          {#if isLoading}Busys...{:else}Lookup{/if}
        </button>
      </div>
    </div>

    {#if error}
      <div class="alert preset-filled-error-500 p-4">{error}</div>
    {/if}

    {#if result}
      <div class="space-y-4">
        <div class="flex justify-between items-center text-sm opacity-70">
          <span
            >Status: {result.Status === 0
              ? "NOERROR"
              : "ERROR " + result.Status}</span
          >
          <span
            >TC: {result.TC ? "Yes" : "No"} | RD: {result.RD ? "Yes" : "No"} | RA:
            {result.RA ? "Yes" : "No"}</span
          >
        </div>

        {#if result.Answer}
          <div
            class="table-container border border-surface-500/10 rounded-lg overflow-hidden"
          >
            <table class="table table-hover">
              <thead class="bg-surface-100 dark:bg-surface-800">
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>TTL</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {#each result.Answer as answer}
                  <tr>
                    <td>{answer.name}</td>
                    <td
                      >{recordTypes.find((t) => t === recordType) ||
                        answer.type}</td
                    >
                    <!-- Type ID map needed optimally, but keeping simple -->
                    <td>{answer.TTL}</td>
                    <td class="font-mono text-xs break-all">{answer.data}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else if result.Status === 0}
          <div class="alert preset-tonal-warning">No records found.</div>
        {/if}

        <!-- Raw Response Debug -->
        <details>
          <summary class="cursor-pointer text-xs opacity-50 mt-4"
            >Raw JSON Response</summary
          >
          <pre
            class="pre text-xs mt-2 overflow-auto bg-surface-900 text-surface-50 p-4 rounded-md">{JSON.stringify(
              result,
              null,
              2,
            )}</pre>
        </details>
      </div>
    {/if}
  </div>
</div>
