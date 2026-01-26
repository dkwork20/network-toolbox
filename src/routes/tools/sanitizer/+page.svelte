<script lang="ts">
  import { toaster } from "$lib/toaster.svelte";
  import { untrack } from "svelte";

  let inputText = $state("");
  let outputText = $state("");
  let mappings = $state<Record<string, string>>({});

  // Options
  let maskIpv4 = $state(true);
  let maskIpv6 = $state(true);
  let maskMac = $state(true);
  let maskUriMode = $state<"domain" | "full_uri">("domain");

  // Domain Selection State
  let detectedDomains = $state<string[]>([]);
  let selectedDomains = $state<Set<string>>(new Set());

  // Regex Patterns
  const REGEX_IPV4 =
    /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  const REGEX_IPV6 =
    /\b([0-9a-fA-F]{1,4}:){1,7}:?([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}\b/g;
  const REGEX_MAC = /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g;
  // Simplified Domain Regex (excludes common file extensions keywrods if tricky, but keep simple for now)
  // Matches example.com, sub.example.co.uk. Avoids simple  // Simplified Domain Regex
  // Excludes common file extensions to avoid matching "script.js" or "image.png" as domains
  const REGEX_DOMAIN =
    /\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+(?!js|css|html|htm|png|jpg|jpeg|gif|svg|json|xml|ts|scss|map|woff|woff2|ttf|eot|ico)\b[a-z]{2,63}\b/gi;

  // Reactively detect domains
  $effect(() => {
    if (!inputText) {
      detectedDomains = [];
      return;
    }

    // Only auto-update if domains actually changed to avoid loop?
    // Or just untrack the existing selection check.

    const matches = inputText.match(REGEX_DOMAIN);
    if (matches) {
      const unique = Array.from(new Set(matches.map((d) => d.toLowerCase())));
      detectedDomains = unique;

      // Avoid infinite loop: don't track selectedDomains reading here
      untrack(() => {
        let changed = false;
        unique.forEach((d) => {
          if (!selectedDomains.has(d)) {
            selectedDomains.add(d);
            changed = true;
          }
        });
        if (changed) {
          selectedDomains = new Set(selectedDomains);
        }
      });
    } else {
      detectedDomains = [];
    }
  });

  function toggleDomain(domain: string) {
    if (selectedDomains.has(domain)) {
      selectedDomains.delete(domain);
    } else {
      selectedDomains.add(domain);
    }
    selectedDomains = new Set(selectedDomains); // Trigger update
  }

  function sanitize() {
    let text = inputText;
    let nextIpv4 = 1;
    let nextIpv6 = 1;
    let nextMac = 1;
    let nextDomain = 1;
    let nextUri = 1;

    const newMappings: Record<string, string> = {};

    function getReplacement(
      original: string,
      type: "IP" | "IPv6" | "MAC" | "Domain" | "URI",
    ) {
      // Check existing mapping first
      // Case insensitive for domains?
      const key =
        type === "Domain" || type === "URI" ? original.toLowerCase() : original;

      if (newMappings[key]) return newMappings[key];

      let label = "";
      if (type === "IP") label = `[IP-${String.fromCharCode(64 + nextIpv4++)}]`;
      else if (type === "IPv6")
        label = `[IPv6-${String.fromCharCode(64 + nextIpv6++)}]`;
      else if (type === "MAC")
        label = `[MAC-${String.fromCharCode(64 + nextMac++)}]`;
      else if (type === "URI")
        label = `[URI-${String.fromCharCode(64 + nextUri++)}]`;
      else label = `[Domain-${String.fromCharCode(64 + nextDomain++)}]`; // Domain-A

      newMappings[key] = label;
      return label;
    }

    if (maskIpv4) {
      text = text.replace(REGEX_IPV4, (match) => getReplacement(match, "IP"));
    }
    if (maskIpv6) {
      text = text.replace(REGEX_IPV6, (match) => getReplacement(match, "IPv6"));
    }
    if (maskMac) {
      text = text.replace(REGEX_MAC, (match) => getReplacement(match, "MAC"));
    }

    // Mask Domains
    // We only mask domains that are in the selectedDomains set
    // AND match the regex (redundant but safe)
    // Actually, simple replace of selected strings is better than regex again?
    // Regex is safer for word boundaries.

    if (detectedDomains.length > 0) {
      // Sort by length desc to avoid partial replacement issues (e.g. sub.domain.com vs domain.com)
      const sorted = [...detectedDomains].sort((a, b) => b.length - a.length);

      for (const domain of sorted) {
        if (selectedDomains.has(domain)) {
          // Global replace with word boundary
          // Escape regex chars in domain
          const escaped = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

          if (maskUriMode === "full_uri") {
            // Heuristic for Full URI: Match http/https prefix optionally, then domain, then port/path
            // Group 0 matches the whole thing.
            // Note: Regex complexity rises here.
            // Simple attempt: Match (protocol)? + domain + (path/query/hash)?
            // \S* consumes until whitespace.
            const uriRegex = new RegExp(
              `(https?:\\/\\/)?${escaped}(:[0-9]+)?(\\/\\S*)?`,
              "gi",
            );
            text = text.replace(uriRegex, (match) =>
              getReplacement(match, "URI"),
            );
          } else {
            // Domain only
            const regex = new RegExp(`\\b${escaped}\\b`, "gi");
            text = text.replace(regex, (match) =>
              getReplacement(match, "Domain"),
            );
          }
        }
      }
    }

    outputText = text;
    mappings = newMappings;
  }

  function copyOutput() {
    navigator.clipboard.writeText(outputText);
    toaster.success({
      title: "Copied",
      description: "Sanitized log copied to clipboard",
    });
  }
</script>

<div
  class="container mx-auto p-4 max-w-6xl h-full flex flex-col overflow-y-auto pb-20"
>
  <div class="flex justify-between items-center mb-6">
    <h2 class="h2 font-bold">Log Sanitizer / Masking Tool</h2>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px]">
    <!-- Input -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <span class="font-bold text-lg">Input Log</span>
        <div class="flex gap-4 text-xs md:text-sm flex-wrap justify-end">
          <label class="flex items-center space-x-2">
            <input class="checkbox" type="checkbox" bind:checked={maskIpv4} />
            <p>IPv4</p>
          </label>
          <label class="flex items-center space-x-2">
            <input class="checkbox" type="checkbox" bind:checked={maskIpv6} />
            <p>IPv6</p>
          </label>
          <label class="flex items-center space-x-2">
            <input class="checkbox" type="checkbox" bind:checked={maskMac} />
            <p>MAC</p>
          </label>
        </div>
      </div>

      <textarea
        class="textarea min-h-[300px] p-4 font-mono text-xs bg-surface-100 dark:bg-surface-800"
        bind:value={inputText}
        placeholder="Paste logs here... e.g. Connection from 192.168.1.50 to api.example.com failed."
      ></textarea>

      <!-- Detected Domains Panel -->
      {#if detectedDomains.length > 0}
        <div class="bg-surface-200 dark:bg-surface-700 p-3 rounded-lg text-sm">
          <div class="flex flex-col gap-2 mb-2">
            <div class="flex justify-between items-center">
              <span class="font-bold text-xs uppercase tracking-wide opacity-70"
                >Detected Domains ({detectedDomains.length})</span
              >
              <div class="flex gap-2 text-[10px]">
                <button
                  class="btn btn-xs variant-soft"
                  onclick={() => (selectedDomains = new Set(detectedDomains))}
                  >All</button
                >
                <button
                  class="btn btn-xs variant-soft"
                  onclick={() => (selectedDomains = new Set())}>None</button
                >
              </div>
            </div>

            <!-- Masking Mode Selector -->
            <div
              class="flex items-center gap-4 text-xs bg-surface-50 dark:bg-surface-800/50 p-2 rounded-md"
            >
              <span class="opacity-70 font-bold">Masking Mode:</span>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  class="radio"
                  type="radio"
                  name="uriMode"
                  value="domain"
                  bind:group={maskUriMode}
                />
                <span>Domain Only</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  class="radio"
                  type="radio"
                  name="uriMode"
                  value="full_uri"
                  bind:group={maskUriMode}
                />
                <span>Full URI</span>
              </label>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {#each detectedDomains as domain}
              <button
                class="chip {selectedDomains.has(domain)
                  ? 'variant-filled-secondary'
                  : 'variant-soft'}"
                onclick={() => toggleDomain(domain)}
              >
                {#if selectedDomains.has(domain)}<span>✔</span>{/if}
                <span>{domain}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <button
        class="btn variant-filled-primary font-bold py-3"
        onclick={sanitize}
        disabled={!inputText}
      >
        Sanitize / Mask Data
      </button>
    </div>

    <!-- Output -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <span class="font-bold text-lg">Sanitized Output</span>
        <button
          class="btn variant-filled-secondary btn-sm"
          onclick={copyOutput}
          disabled={!outputText}
        >
          Copy
        </button>
      </div>

      <textarea
        class="textarea flex-1 min-h-[300px] p-4 font-mono text-xs bg-surface-100 dark:bg-surface-800"
        readonly
        value={outputText}
        placeholder="Result will appear here..."
      ></textarea>

      <!-- Mapping Table (Optional visualization) -->
      {#if Object.keys(mappings).length > 0}
        <div class="glass p-4 rounded-xl max-h-40 overflow-y-auto text-xs">
          <table class="table table-compact w-full">
            <thead>
              <tr>
                <th>Original</th>
                <th>Replacement</th>
              </tr>
            </thead>
            <tbody>
              {#each Object.entries(mappings) as [original, replacement]}
                <tr>
                  <td class="font-mono opacity-70">{original}</td>
                  <td class="font-mono font-bold text-primary-500"
                    >{replacement}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>
