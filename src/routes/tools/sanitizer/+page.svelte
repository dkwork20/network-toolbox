<script lang="ts">
  import { toaster } from "$lib/toaster.svelte";
  import { untrack, onMount } from "svelte";
  import { Dialog } from "bits-ui";

  let inputText = $state("");
  let outputText = $state("");
  let mappings = $state<Record<string, string>>({});

  // Options
  let maskIpv4 = $state(true);
  let maskIpv6 = $state(true);
  let maskMac = $state(true);
  let maskTokens = $state(true);
  let maskHtml = $state(false);
  let maskUriMode = $state<"domain" | "full_uri">("domain");

  // Domain Selection State
  let detectedDomains = $state<string[]>([]);
  let selectedDomains = $state<Set<string>>(new Set());
  let domainSearchQuery = $state("");
  let customMaskInputs = $state("");
  let customStopAmpersand = $state(true);
  let customStopSlash = $state(true);
  let customStopQuotes = $state(true);
  let customStopSpace = $state(true);
  let customStopComma = $state(false);

  let targetHtmlTags = $state("");
  let customTokenRegex = $state(
    "(?:bearer\\s+|[?&]token=|(?:\"|')token(?:\"|')\\s*:\\s*(?:\"|'))([a-zA-Z0-9_\\-\\.]{15,})",
  );

  // Height toggle
  let expandTextareas = $state(false);

  // Modal State
  let showMappingModal = $state(false);
  let modalMappingTitle = $state("");
  let modalMappingContent = $state("");

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

  // Rendered Output (with HTML highlights)
  let renderOutputText = $state("");

  // Stats
  let inLines = $derived(inputText ? inputText.split("\n").length : 0);
  let inChars = $derived(inputText ? inputText.length : 0);
  let outLines = $derived(outputText ? outputText.split("\n").length : 0);
  let outChars = $derived(outputText ? outputText.length : 0);
  let diffChars = $derived(outChars - inChars);

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
    let nextToken = 1;
    let nextHtml = 1;
    let nextDyn = 1;

    const newMappings: Record<string, string> = {};

    function getReplacement(
      original: string,
      type:
        | "IP"
        | "IPv6"
        | "MAC"
        | "Domain"
        | "URI"
        | "Token"
        | "HTML"
        | string,
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
      else if (type === "Domain")
        label = `[Domain-${String.fromCharCode(64 + nextDomain++)}]`;
      else if (type === "Token") label = `[Token-${nextToken++}]`;
      else if (type === "HTML") label = `[HTMLTag-${nextHtml++}]`;
      else label = `[${type}-${nextDyn++}]`;

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

    // Custom Masking
    if (customMaskInputs) {
      const masks = customMaskInputs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      let stopChars = "";
      if (customStopAmpersand) stopChars += "&";
      if (customStopSlash) stopChars += "\\\\";
      if (customStopQuotes) stopChars += "\"'";
      if (customStopSpace) stopChars += "\\s";
      if (customStopComma) stopChars += ",";
      if (!stopChars) stopChars = "\\s";

      masks.forEach((mask) => {
        const escaped = mask.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        try {
          const regex = new RegExp(`(${escaped})([^${stopChars}]+)`, "gi");
          const cleanName = mask.replace(/[^a-zA-Z0-9-]/g, "") || "Param";
          text = text.replace(regex, (match, p1, p2) => {
            return p1 + getReplacement(p2, cleanName);
          });
        } catch (e) {
          console.error("Mask parsing error", e);
        }
      });
    }

    if (maskTokens && customTokenRegex) {
      try {
        const regex = new RegExp(customTokenRegex, "gi");
        text = text.replace(regex, (match, token) => {
          // If the regex has no capture group, token might be undefined or just a normal match param
          // Safest to just mask the first capture group if it exists, otherwise the whole match
          const target =
            typeof token === "string" && token !== match ? token : match;
          const replacement = getReplacement(target, "Token");
          return match.replace(target, replacement);
        });
      } catch (e) {
        console.error("Token regex error", e);
      }
    }

    if (maskHtml) {
      let tags = targetHtmlTags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (tags.length === 0) {
        // Default to block level tags if none specified
        tags = [
          "html",
          "body",
          "div",
          "script",
          "style",
          "table",
          "footer",
          "header",
        ];
      }

      tags.forEach((tag) => {
        const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Matches <tag>...</tag> across newlines
        // Uses dotAll flag equivalent [\s\S]*?
        const regex = new RegExp(
          `<${escapedTag}\\b[^>]*>[\\s\\S]*?</${escapedTag}>`,
          "gi",
        );
        const singleRegex = new RegExp(`<${escapedTag}\\b[^>]*/>`, "gi");

        text = text.replace(regex, (match) => getReplacement(match, "HTML"));
        text = text.replace(singleRegex, (match) =>
          getReplacement(match, "HTML"),
        );
      });
    }

    outputText = text;
    mappings = newMappings;

    // Generate Highlighted Output
    let highlighted = text;
    // Escape HTML first to make it safe
    highlighted = highlighted
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Process mappings back to HTML highlights
    Object.values(newMappings).forEach((label) => {
      // Create a pattern for the exact label safely
      const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const labelRegex = new RegExp(`(${escapedLabel})`, "g");
      // Changed colors: Yellow background with dark text is usually best for highlights in both dark and light modes.
      highlighted = highlighted.replace(
        labelRegex,
        `<mark class="bg-warning-300 dark:bg-warning-600/60 text-black dark:text-white px-1 rounded font-bold inline-block">$1</mark>`,
      );
    });

    renderOutputText = highlighted;
  }

  function openMappingModal(label: string, original: string) {
    modalMappingTitle = label;
    modalMappingContent = original;
    showMappingModal = true;
  }

  function copyMappingContent() {
    navigator.clipboard.writeText(modalMappingContent);
    toaster.success({
      title: "Copied",
      description: "Original text copied to clipboard",
    });
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
    <div class="flex items-center gap-3">
      <h2 class="h2 font-bold">Log Sanitizer / Masking Tool</h2>
      <span class="badge preset-filled-secondary-500 text-xs">V0.3 ~ V0.16</span
      >
      <span class="badge preset-tonal-success text-xs">Verified</span>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[500px]">
    <!-- Input -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <span class="font-bold text-lg">Input Log</span>
        <div
          class="flex gap-3 text-[10px] md:text-sm flex-wrap justify-end opacity-70"
        >
          <span>Lines: {inLines}</span>
          <span>Chars: {inChars}</span>
        </div>
      </div>

      <div
        class="flex flex-wrap gap-4 text-xs md:text-sm bg-surface-200 dark:bg-surface-700 p-2 rounded-lg"
      >
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
        <label
          class="flex items-center space-x-2 font-bold text-surface-900-50-token"
        >
          <input
            class="checkbox border-warning-500 checked:bg-warning-500"
            type="checkbox"
            bind:checked={maskTokens}
          />
          <p>Tokens/Keys</p>
        </label>
        <label
          class="flex items-center space-x-2 font-bold text-surface-900-50-token"
        >
          <input
            class="checkbox border-tertiary-500 checked:bg-tertiary-500"
            type="checkbox"
            bind:checked={maskHtml}
          />
          <p>HTML Tags</p>
        </label>
      </div>

      <textarea
        class="textarea p-4 font-mono text-xs bg-surface-100 dark:bg-surface-800 h-[60vh]"
        bind:value={inputText}
        placeholder="Paste logs here... e.g. Connection from 192.168.1.50 to api.example.com failed."
      ></textarea>

      {#if maskHtml}
        <div
          class="bg-tertiary-500/10 dark:bg-tertiary-500/20 p-3 rounded-lg text-sm flex flex-col gap-2 border border-tertiary-500/30"
        >
          <span
            class="font-bold text-xs uppercase tracking-wide opacity-70 text-tertiary-700 dark:text-tertiary-300"
            >HTML Tags Masking</span
          >
          <input
            class="input text-sm"
            type="text"
            placeholder="e.g. div, span, script, html, body (comma separated)"
            bind:value={targetHtmlTags}
          />
          <p class="text-[10px] opacity-70">
            Will mask EVERYTHING between `&lt;tag&gt;` and `&lt;/tag&gt;`. Leave
            blank for defaults (html, body, div, script, style, table, footer,
            header).
          </p>
        </div>
      {/if}

      {#if maskTokens}
        <div
          class="bg-warning-500/10 dark:bg-warning-500/20 p-3 rounded-lg text-sm flex flex-col gap-2 border border-warning-500/30"
        >
          <span
            class="font-bold text-xs uppercase tracking-wide opacity-70 text-warning-700 dark:text-warning-300"
            >Tokens & Keys Masking</span
          >
          <input
            class="input font-mono text-xs"
            type="text"
            placeholder="Regex pattern"
            bind:value={customTokenRegex}
          />
          <p class="text-[10px] opacity-70">
            Custom regex for tokens. Must capture the token value in Capture
            Group 1 `(...)`.
          </p>
        </div>
      {/if}

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
                  class="btn btn-xs preset-tonal"
                  onclick={() => {
                    const filtered = detectedDomains.filter((d) =>
                      d.includes(domainSearchQuery.toLowerCase()),
                    );
                    filtered.forEach((d) => selectedDomains.add(d));
                    selectedDomains = new Set(selectedDomains);
                  }}>All filtered</button
                >
                <button
                  class="btn btn-xs preset-tonal"
                  onclick={() => (selectedDomains = new Set())}>None</button
                >
              </div>
            </div>

            <input
              type="search"
              class="input input-sm mb-2"
              placeholder="Search domains..."
              bind:value={domainSearchQuery}
            />

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
            {#each detectedDomains.filter( (d) => d.includes(domainSearchQuery.toLowerCase()), ) as domain}
              <button
                class="chip {selectedDomains.has(domain)
                  ? 'preset-filled-secondary-500'
                  : 'preset-tonal'}"
                onclick={() => toggleDomain(domain)}
              >
                {#if selectedDomains.has(domain)}<span>✔</span>{/if}
                <span>{domain}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Custom Params Masking Panel -->
      <div
        class="bg-surface-200 dark:bg-surface-700 p-3 rounded-lg text-sm flex flex-col gap-3"
      >
        <span class="font-bold text-xs uppercase tracking-wide opacity-70"
          >Custom Param Masking</span
        >

        <input
          class="input text-sm"
          type="text"
          placeholder="Match Prefixes: e.g. ?kid=, meta="
          bind:value={customMaskInputs}
        />

        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold opacity-70"
            >TERMINATE MASKING AT:</span
          >
          <div class="flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <label class="flex items-center space-x-1 cursor-pointer">
              <input
                class="checkbox"
                type="checkbox"
                bind:checked={customStopAmpersand}
              />
              <span>&amp;</span>
            </label>
            <label
              class="flex items-center space-x-1 cursor-pointer"
              title="Uncheck this if your parameters contain \u0026 JSON sequences"
            >
              <input
                class="checkbox"
                type="checkbox"
                bind:checked={customStopSlash}
              />
              <span>\ (Backslash)</span>
            </label>
            <label class="flex items-center space-x-1 cursor-pointer">
              <input
                class="checkbox"
                type="checkbox"
                bind:checked={customStopQuotes}
              />
              <span>Quotes (", ')</span>
            </label>
            <label class="flex items-center space-x-1 cursor-pointer">
              <input
                class="checkbox"
                type="checkbox"
                bind:checked={customStopSpace}
              />
              <span>Space</span>
            </label>
            <label class="flex items-center space-x-1 cursor-pointer">
              <input
                class="checkbox"
                type="checkbox"
                bind:checked={customStopComma}
              />
              <span>, (Comma)</span>
            </label>
          </div>
          <p class="text-[10px] opacity-60 mt-1">
            If your log uses JSON \u0026, uncheck '\' to mask past it.
          </p>
        </div>
      </div>

      <button
        class="btn preset-filled-primary-500 font-bold py-3"
        onclick={sanitize}
        disabled={!inputText}
      >
        Sanitize / Mask Data
      </button>
    </div>

    <!-- Output -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <div class="flex flex-col gap-1">
          <span class="font-bold text-lg">Sanitized Output</span>
          <div class="flex gap-3 text-[10px] md:text-sm flex-wrap opacity-70">
            <span>Lines: {outLines}</span>
            <span>Chars: {outChars}</span>
            {#if outputText}
              <span
                class={diffChars > 0
                  ? "text-error-500 font-bold"
                  : diffChars < 0
                    ? "text-success-500 font-bold"
                    : ""}
              >
                Diff: {diffChars > 0 ? "+" : ""}{diffChars}
              </span>
            {/if}
          </div>
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center space-x-2 text-xs">
            <span>Auto-Expand Height</span>
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={expandTextareas}
            />
          </label>
          <button
            class="btn preset-filled-secondary-500 btn-sm"
            onclick={copyOutput}
            disabled={!outputText}
          >
            Copy
          </button>
        </div>
      </div>

      <!-- Rendered Div for highlights instead of textarea -->
      {#if outputText}
        <div
          class="textarea p-4 font-mono text-xs bg-surface-100 dark:bg-surface-800 whitespace-pre-wrap break-all transition-all duration-300 w-full {expandTextareas
            ? 'h-fit overflow-visible min-h-[60vh]'
            : 'h-[60vh] max-h-[60vh] overflow-y-auto'}"
          style="tab-size: 2"
        >
          {@html renderOutputText}
        </div>
      {:else}
        <textarea
          class="textarea p-4 font-mono text-xs bg-surface-100 dark:bg-surface-800 transition-all duration-300 w-full {expandTextareas
            ? 'h-auto overflow-hidden resize-none min-h-[60vh]'
            : 'h-[60vh] max-h-[60vh] overflow-y-auto'}"
          readonly
          value={""}
          placeholder="Result will appear here..."
        ></textarea>
      {/if}
    </div>
  </div>

  <!-- Mapping Table (Moved outside grid for better spacial usage) -->
  {#if Object.keys(mappings).length > 0}
    <div class="mt-8 flex flex-col gap-4">
      <h3 class="h3 font-bold">
        Replacement Mappings ({Object.keys(mappings).length})
      </h3>
      <p class="text-xs opacity-70">
        Double-click a card to view and copy the full original text.
      </p>
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {#each Object.entries(mappings) as [original, replacement]}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="card p-4 flex flex-col gap-2 bg-surface-100-800-token cursor-pointer hover:ring-2 ring-primary-500 transition-all"
            ondblclick={() => openMappingModal(replacement, original)}
          >
            <span
              class="font-mono font-bold text-primary-500 dark:text-primary-400 text-sm"
            >
              {replacement}
            </span>
            <span
              class="font-mono text-xs opacity-70 break-all overflow-hidden text-ellipsis line-clamp-3"
              title="Double click to view full"
            >
              {original}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Mapping Details Modal (Bits UI Dialog) -->
<Dialog.Root bind:open={showMappingModal}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 z-50 bg-black/80" />
    <Dialog.Content
      class="fixed left-[50%] top-[50%] z-50 w-full max-w-[90vw] md:max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-xl bg-surface-100 dark:bg-surface-900 p-6 shadow-lg outline-none flex flex-col gap-4 max-h-[90vh]"
    >
      <Dialog.Title class="text-lg font-bold flex justify-between items-center">
        <span
          >Mapping Details: <span class="text-primary-500 font-mono"
            >{modalMappingTitle}</span
          ></span
        >
        <button
          class="btn btn-sm preset-filled-secondary-500"
          onclick={copyMappingContent}>Copy Content</button
        >
      </Dialog.Title>

      <div
        class="overflow-y-auto flex-1 bg-surface-200 dark:bg-surface-800 rounded-lg p-4 border border-surface-300 dark:border-surface-700"
      >
        <p class="font-mono text-sm break-all whitespace-pre-wrap">
          {modalMappingContent}
        </p>
      </div>

      <div class="flex justify-end pt-2">
        <Dialog.Close class="btn preset-tonal">Close</Dialog.Close>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
