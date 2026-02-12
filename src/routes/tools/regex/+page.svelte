<script lang="ts">
  import { Regex, Copy, Check, HelpCircle, BookOpen, AlertCircle } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  interface Match {
    value: string;
    index: number;
    groups: { [key: string]: string } | null;
    groupValues: string[];
  }

  // State - inputs only
  let pattern = $state("");
  let testText = $state("");
  let flags = $state({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
  });

  // Derived values - computed from inputs
  let flagsStr = $derived(() => {
    return Object.entries(flags)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join("");
  });

  let regexResult = $derived(() => {
    if (!pattern) return { regex: null, error: null, matches: [] as Match[] };

    try {
      const f = flagsStr();
      const re = new RegExp(pattern, f);
      
      if (!testText) return { regex: re, error: null, matches: [] as Match[] };

      const tempMatches: Match[] = [];
      if (flags.g) {
        let match;
        while ((match = re.exec(testText)) !== null) {
          const groupValues = match.slice(1);
          tempMatches.push({
            value: match[0],
            index: match.index,
            groups: match.groups || null,
            groupValues: groupValues.filter(g => g !== undefined),
          });
        }
      } else {
        const match = re.exec(testText);
        if (match) {
          const groupValues = match.slice(1);
          tempMatches.push({
            value: match[0],
            index: match.index,
            groups: match.groups || null,
            groupValues: groupValues.filter(g => g !== undefined),
          });
        }
      }

      return { regex: re, error: null, matches: tempMatches };
    } catch (e) {
      return { regex: null, error: e instanceof Error ? e.message : "Invalid regex", matches: [] as Match[] };
    }
  });

  let regex = $derived(regexResult().regex);
  let error = $derived(regexResult().error);
  let matches = $derived(regexResult().matches);

  let copied = $state(false);
  let showHelp = $state(false);

  // Common patterns
  const presets: { name: string; pattern: string; flags: { g?: boolean; i?: boolean; m?: boolean; s?: boolean; u?: boolean } }[] = [
    { name: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: { g: true, i: true } },
    { name: "URL", pattern: "https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+[\\/\\w\\-.,@?^=%&:~+#]*", flags: { g: true, i: true } },
    { name: "IPv4", pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b", flags: { g: true } },
    { name: "Phone (US)", pattern: "\\(?\\d{3}\\)?[-. ]?\\d{3}[-. ]?\\d{4}", flags: { g: true } },
    { name: "Date (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", flags: { g: true } },
    { name: "Hex Color", pattern: "#[0-9a-fA-F]{6}\\b|#[0-9a-fA-F]{3}\\b", flags: { g: true, i: true } },
    { name: "Credit Card", pattern: "\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b", flags: { g: true } },
    { name: "Username", pattern: "^[a-zA-Z][a-zA-Z0-9_-]{2,15}$", flags: {} },
  ];

  // Explain regex (basic)
  function getExplanation(): string[] {
    if (!pattern) return [];

    const explanations: { pattern: string; meaning: string }[] = [];

    // Basic token explanations
    const tokens: [RegExp, string][] = [
      [/^\\d/, "Any digit (0-9)"],
      [/^\\D/, "Any non-digit"],
      [/^\\w/, "Any word character (a-z, A-Z, 0-9, _)"],
      [/^\\W/, "Any non-word character"],
      [/^\\s/, "Any whitespace"],
      [/^\\S/, "Any non-whitespace"],
      [/^\\b/, "Word boundary"],
      [/^\\B/, "Non-word boundary"],
      [/^\\./, "Literal dot"],
      [/^\\\//, "Literal forward slash"],
      [/^\\\[/, "Start of character class"],
      [/^\\\]/, "End of character class"],
      [/^\(/, "Start of capture group"],
      [/^\)/, "End of capture group"],
      [/^\[\^/, "Negated character class"],
      [/^\[/, "Character class start"],
      [/^\]/, "Character class end"],
      [/^\(/, "Group start"],
      [/^\)/, "Group end"],
      [/^\+/, "One or more"],
      [/^\*/, "Zero or more"],
      [/^\?/, "Zero or one (optional)"],
      [/^\^/, "Start of string"],
      [/\$$/, "End of string"],
      [/^\|/, "Alternation (OR)"],
      [/^\./, "Any character (except newline)"],
      [/^{(\d+)}/, "Exact {n} repetitions"],
      [/^{(\d+),}/, "{n,} or more repetitions"],
      [/^{(\d+),(\d+)}/, "{n,m} repetitions"],
    ];

    let remaining = pattern;
    while (remaining.length > 0) {
      let matched = false;
      for (const [r, meaning] of tokens) {
        const match = remaining.match(r);
        if (match) {
          explanations.push({ pattern: match[0], meaning });
          remaining = remaining.slice(match[0].length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        explanations.push({ pattern: remaining[0], meaning: "Literal character" });
        remaining = remaining.slice(1);
      }
    }

    return explanations.map(e => `${e.pattern} → ${e.meaning}`);
  }

  // Copy regex for code
  function getRegexForCode(language: string): string {
    const f = flagsStr();
    switch (language) {
      case "js":
        return `/${pattern}/${f}`;
      case "py":
        return `r"${pattern}"`;
      case "go":
        return `\`${pattern}\``;
      case "java":
        return `"${pattern}"`;
      default:
        return `/${pattern}/${f}`;
    }
  }

  async function copyRegex() {
    const code = getRegexForCode("js");
    await navigator.clipboard.writeText(code);
    copied = true;
    toaster.success({ title: "Copied!", description: "Regex copied to clipboard" });
    setTimeout(() => (copied = false), 1500);
  }

  // Apply preset
  function applyPreset(preset: typeof presets[0]) {
    pattern = preset.pattern;
    flags = { g: preset.flags.g ?? true, i: preset.flags.i ?? false, m: preset.flags.m ?? false, s: preset.flags.s ?? false, u: preset.flags.u ?? false };
  }
</script>

<svelte:head>
  <title>Regex Tester - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-6xl pb-20">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Regex class="size-8 text-primary-500" />
      Regex Tester
      <span class="badge variant-filled-secondary text-xs">V0.7</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Build and test regular expressions with real-time matching
    </p>
  </div>

  <!-- Pattern Input -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4 mb-6">
    <div class="flex justify-between items-center">
      <span class="font-medium">Regular Expression</span>
      <div class="flex gap-2">
        <button class="btn btn-sm variant-ghost-surface" onclick={() => (showHelp = !showHelp)}>
          <HelpCircle class="size-4" />
          Help
        </button>
        <button class="btn btn-sm variant-soft-surface" onclick={copyRegex}>
          {#if copied}
            <Check class="size-4 text-success-500" />
          {:else}
            <Copy class="size-4" />
          {/if}
          Copy
        </button>
      </div>
    </div>

    <div class="flex gap-2">
      <span class="text-surface-500 text-2xl">/</span>
      <input
        type="text"
        class="input flex-1 font-mono text-lg"
        class:border-error-500={error}
        bind:value={pattern}
        placeholder="Enter regex pattern..."
      />
      <span class="text-surface-500 text-2xl">/{flagsStr()}</span>
    </div>

    <!-- Flags -->
    <div class="flex flex-wrap gap-4">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="checkbox" bind:checked={flags.g} />
        <span class="text-sm"><code>g</code> Global</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="checkbox" bind:checked={flags.i} />
        <span class="text-sm"><code>i</code> Case insensitive</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="checkbox" bind:checked={flags.m} />
        <span class="text-sm"><code>m</code> Multiline</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="checkbox" bind:checked={flags.s} />
        <span class="text-sm"><code>s</code> Dotall</span>
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="checkbox" bind:checked={flags.u} />
        <span class="text-sm"><code>u</code> Unicode</span>
      </label>
    </div>

    <!-- Error -->
    {#if error}
      <div class="flex items-center gap-2 text-error-500">
        <AlertCircle class="size-5" />
        <span>{error}</span>
      </div>
    {/if}

    <!-- Code Output -->
    {#if pattern && !error}
      <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg space-y-2">
        <div class="text-sm text-surface-500">Code snippets:</div>
        <div class="flex flex-wrap gap-2 text-sm font-mono">
          <span class="px-2 py-1 bg-surface-200 dark:bg-surface-700 rounded">JS: {getRegexForCode('js')}</span>
          <span class="px-2 py-1 bg-surface-200 dark:bg-surface-700 rounded">Python: {getRegexForCode('py')}</span>
          <span class="px-2 py-1 bg-surface-200 dark:bg-surface-700 rounded">Go: {getRegexForCode('go')}</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Presets -->
  <div class="card p-4 bg-surface-50 dark:bg-surface-900 mb-6">
    <div class="flex items-center gap-2 mb-3">
      <BookOpen class="size-5 text-primary-500" />
      <span class="font-medium">Common Patterns</span>
    </div>
    <div class="flex flex-wrap gap-2">
      {#each presets as preset}
        <button
          class="btn btn-sm variant-soft-surface"
          onclick={() => applyPreset(preset)}
        >
          {preset.name}
        </button>
      {/each}
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Test Text -->
    <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
      <span class="font-medium">Test Text</span>
      <textarea
        class="textarea font-mono text-sm min-h-[300px]"
        bind:value={testText}
        placeholder="Enter text to test against..."
      ></textarea>
    </div>

    <!-- Results -->
    <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-4">
      <div class="flex justify-between items-center">
        <span class="font-medium">Matches</span>
        {#if matches.length > 0}
          <span class="text-sm text-surface-500">{matches.length} match(es)</span>
        {/if}
      </div>

      {#if matches.length > 0}
        <div class="space-y-2 max-h-[280px] overflow-y-auto">
          {#each matches as match, i}
            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium">Match {i + 1}</span>
                <span class="text-xs text-surface-500">Index: {match.index}</span>
              </div>
              <code class="text-sm bg-primary-500/20 text-primary-600 dark:text-primary-400 px-1 rounded">
                {match.value}
              </code>

              {#if match.groupValues.length > 0}
                <div class="mt-2 space-y-1">
                  <span class="text-xs text-surface-500">Groups:</span>
                  <div class="flex flex-wrap gap-1">
                    {#each match.groupValues as group, gi}
                      <span class="text-xs bg-surface-200 dark:bg-surface-700 px-2 py-0.5 rounded">
                        ${gi + 1}: {group}
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}

              {#if match.groups}
                <div class="mt-2 space-y-1">
                  <span class="text-xs text-surface-500">Named Groups:</span>
                  <div class="flex flex-wrap gap-1">
                    {#each Object.entries(match.groups) as [name, value]}
                      <span class="text-xs bg-secondary-500/20 text-secondary-600 dark:text-secondary-400 px-2 py-0.5 rounded">
                        {name}: {value}
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {:else if pattern && !error && testText}
        <div class="flex items-center gap-2 text-surface-500 py-8 justify-center">
          <span>No matches found</span>
        </div>
      {:else}
        <div class="text-surface-500 py-8 text-center">
          Enter a pattern and test text to see matches
        </div>
      {/if}
    </div>
  </div>

  <!-- Explanation -->
  {#if pattern && !error && showHelp}
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
      <h2 class="h2 font-bold">Pattern Breakdown</h2>
      <div class="space-y-1 text-sm">
        {#each getExplanation() as exp}
          <div class="flex gap-2">
            <code class="bg-surface-100 dark:bg-surface-800 px-2 rounded min-w-[60px]">{exp.split(' → ')[0]}</code>
            <span class="text-surface-500">{exp.split(' → ')[1]}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Help Panel -->
  {#if showHelp}
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
      <h2 class="h2 font-bold">Quick Reference</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h3 class="font-medium mb-2">Character Classes</h3>
          <ul class="space-y-1 text-surface-500">
            <li><code>. </code> Any character except newline</li>
            <li><code>\d</code> Digit [0-9]</li>
            <li><code>\w</code> Word character [a-zA-Z0-9_]</li>
            <li><code>\s</code> Whitespace</li>
            <li><code>[abc]</code> Any of a, b, c</li>
            <li><code>[^abc]</code> Not a, b, or c</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">Quantifiers</h3>
          <ul class="space-y-1 text-surface-500">
            <li><code>*</code> Zero or more</li>
            <li><code>+</code> One or more</li>
            <li><code>?</code> Zero or one</li>
            <li><code>&#123;n&#125;</code> Exactly n</li>
            <li><code>&#123;n,m&#125;</code> Between n and m</li>
            <li><code>&#123;n,&#125;</code> n or more</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">Anchors</h3>
          <ul class="space-y-1 text-surface-500">
            <li><code>^</code> Start of string/line</li>
            <li><code>$</code> End of string/line</li>
            <li><code>\b</code> Word boundary</li>
            <li><code>\B</code> Non-word boundary</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">Groups</h3>
          <ul class="space-y-1 text-surface-500">
            <li><code>(...)</code> Capture group</li>
            <li><code>(?:...)</code> Non-capturing group</li>
            <li><code>(?&lt;name&gt;...)</code> Named group</li>
            <li><code>a|b</code> Match a or b</li>
          </ul>
        </div>
      </div>
    </div>
  {/if}
</div>
