<script lang="ts">
  import {
    FileText,
    Copy,
    Check,
    RefreshCw,
    Download,
    Eye,
    Code,
    ChevronDown,
  } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";
  import { onMount } from "svelte";

  import { marked } from "marked";
  import { detectLanguage } from "./lib/utils";
  import { languages, sampleContents } from "./lib/constants";

  let textInput = $state("");
  let viewMode = $state<"split" | "preview">("split");
  let previewType = $state<"preview" | "html">("preview");
  let copied = $state(false);
  let selectedLanguage = $state("auto");
  let showLanguageDropdown = $state(false);
  let showPreviewDropdown = $state(false);

  type ZeroMdTheme = "light" | "dark";
  type ZeroMdInstance = HTMLElement & {
    template: string;
    render?: (options?: {
      fire?: boolean;
      goto?: string | false;
    }) => Promise<void>;
  };

  const ZERO_MD_BODY_PADDING_STYLE =
    "<style>.markdown-body{padding:1.5rem;box-sizing:border-box;}</style>";

  let zeroMdStyles: { preset: (theme?: string) => string } | null = null;
  let themeObserver: MutationObserver | null = null;

  function buildZeroMdTemplate(theme: ZeroMdTheme): string {
    if (!zeroMdStyles) return "";
    return `${zeroMdStyles.preset(theme)}${ZERO_MD_BODY_PADDING_STYLE}`;
  }

  function getCurrentTheme(): ZeroMdTheme {
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  }

  async function syncZeroMdTheme() {
    if (!zeroMdStyles || typeof document === "undefined") return;

    const template = buildZeroMdTemplate(getCurrentTheme());
    const zeroMdElements = document.querySelectorAll<ZeroMdInstance>("zero-md");

    await Promise.all(
      Array.from(zeroMdElements).map(async (element) => {
        if (element.template === template) return;
        element.template = template;

        if (typeof element.render === "function") {
          await element.render({ fire: false, goto: false });
        }
      }),
    );
  }

  // Get effective language (selected or auto-detected)
  function getEffectiveLanguage(): string {
    if (selectedLanguage === "auto") {
      return detectLanguage(textInput);
    }
    return selectedLanguage;
  }

  // Parse markdown to HTML for source view
  let htmlSource = $derived(
    getEffectiveLanguage() === "markdown"
      ? (marked.parse(textInput) as string)
      : "",
  );

  // Generate markdown content for rendering
  function getRenderContent(): string {
    if (!textInput) return "";

    const lang = getEffectiveLanguage();

    // For markdown, return as-is
    if (lang === "markdown") {
      return textInput;
    }

    // For code formats, wrap in code block
    return "```" + lang + "\n" + textInput + "\n```";
  }

  // Copy input content
  async function copyInput() {
    await navigator.clipboard.writeText(textInput);
    toaster.success({
      title: "Copied!",
      description: "Input copied to clipboard",
    });
  }

  // Copy preview content (HTML)
  async function copyPreview() {
    const lang = getEffectiveLanguage();
    let content = "";

    if (lang === "markdown") {
      content = marked.parse(textInput) as string;
    } else {
      // For other languages, preview is just the code wrapped in markdown,
      // checking what user expects. Usually "Preview" for code is just the code?
      // But for markdown tool, the "Preview" is the rendered HTML of the markdown.
      // If input is JSON, Preview is JSON.
      // The user request specifically mentioned "html sources" for markdown.
      // So let's assume this copy button copies the resulting HTML.
      content = textInput; // Fallback
      if (lang === "markdown") content = marked.parse(textInput) as string;
    }

    await navigator.clipboard.writeText(content);
    toaster.success({
      title: "Copied!",
      description: "Preview HTML copied to clipboard",
    });
  }

  // Download content
  function downloadContent() {
    const lang = getEffectiveLanguage();
    const langInfo = languages.find((l) => l.id === lang);
    const ext = langInfo?.ext || "txt";
    const filename = `document.${ext}`;

    let content = textInput;
    let mimeType = "text/plain";

    if (lang === "html") {
      mimeType = "text/html";
      // Wrap in full HTML document if not already
      if (!textInput.trim().toLowerCase().startsWith("<!doctype")) {
        content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
${textInput}
</body>
</html>`;
      }
    } else if (lang === "json") {
      mimeType = "application/json";
    } else if (lang === "markdown") {
      mimeType = "text/markdown";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Load sample based on selected language
  function loadSample() {
    const lang = getEffectiveLanguage();
    textInput = sampleContents[lang] || sampleContents["markdown"];
  }

  // Load sample for specific language
  function loadLanguageSample(langId: string) {
    textInput = sampleContents[langId] || sampleContents["markdown"];
    selectedLanguage = langId;
    showLanguageDropdown = false;
  }

  // Clear input
  function clearInput() {
    textInput = "";
  }

  // Get current language label
  function getCurrentLanguageLabel(): string {
    if (selectedLanguage === "auto") {
      const detected = detectLanguage(textInput);
      const langInfo = languages.find((l) => l.id === detected);
      return `Auto-detect (${langInfo?.label || detected})`;
    }
    const langInfo = languages.find((l) => l.id === selectedLanguage);
    return langInfo?.label || selectedLanguage;
  }

  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".language-dropdown")) {
      showLanguageDropdown = false;
    }
    if (!target.closest(".preview-dropdown")) {
      showPreviewDropdown = false;
    }
  }

  let blobUrl = $state("");
  let htmlSourceBlobUrl = $state("");

  $effect(() => {
    const content = getRenderContent();
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    blobUrl = url;

    // Create blob for HTML source view (syntax highlighted)
    if (getEffectiveLanguage() === "markdown") {
      const html = marked.parse(textInput) as string;
      const htmlMd = "```html\n" + html + "\n```";
      const htmlBlob = new Blob([htmlMd], { type: "text/markdown" });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      htmlSourceBlobUrl = htmlUrl;
      return () => {
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(htmlUrl);
      };
    }

    return () => URL.revokeObjectURL(url);
  });

  async function initializeZeroMd() {
    try {
      // @ts-ignore
      const module = await import("zero-md");
      const ZeroMd = module.default || module;
      zeroMdStyles = module.STYLES;

      if (!customElements.get("zero-md")) {
        const CustomZeroMd = class extends ZeroMd {
          async load() {
            await super.load();
            this.template = buildZeroMdTemplate(getCurrentTheme());
          }
        };

        customElements.define("zero-md", CustomZeroMd);
      }

      await syncZeroMdTheme();
    } catch (e) {
      console.error("Failed to load zero-md", e);
    }
  }

  function handleZeroMdReady(_event: Event) {
    void syncZeroMdTheme();
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("zero-md-ready", handleZeroMdReady);

    void initializeZeroMd();

    themeObserver = new MutationObserver(() => {
      void syncZeroMdTheme();
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("zero-md-ready", handleZeroMdReady);
      themeObserver?.disconnect();
      themeObserver = null;
    };
  });
</script>

<svelte:head>
  <title>Text Viewer - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-7xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <FileText class="size-8 text-primary-500" />
      Text Viewer
      <span class="badge preset-filled-secondary-500 text-xs">V0.10</span>
    </h1>
    <p class="text-surface-500 mt-2">
      View and render documents with syntax highlighting - Markdown, JSON, HTML,
      CSS, and 15+ code formats
    </p>
  </div>

  <!-- Controls -->
  <div class="card p-4 bg-surface-50 dark:bg-surface-900 mb-6">
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="flex gap-2 items-center">
        <!-- Language Selector -->
        <div class="relative language-dropdown">
          <button
            class="btn btn-sm preset-tonal-surface flex items-center gap-2"
            onclick={() => (showLanguageDropdown = !showLanguageDropdown)}
          >
            <span>{getCurrentLanguageLabel()}</span>
            <ChevronDown class="size-4" />
          </button>

          {#if showLanguageDropdown}
            <div
              class="absolute top-full left-0 mt-1 z-50 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg max-h-80 overflow-y-auto min-w-48"
            >
              {#each languages as lang}
                <button
                  class="w-full px-4 py-2 text-left text-sm hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-100"
                  class:bg-surface-100={selectedLanguage === lang.id}
                  class:dark:bg-surface-700={selectedLanguage === lang.id}
                  onclick={() => {
                    selectedLanguage = lang.id;
                    showLanguageDropdown = false;
                  }}
                >
                  <span>{lang.label}</span>
                  {#if lang.ext}
                    <span class="text-xs text-surface-400">.{lang.ext}</span>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <button class="btn btn-sm bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface" onclick={loadSample}>
          Load Sample
        </button>
        <button class="btn btn-sm preset-tonal-surface" onclick={clearInput}>
          <RefreshCw class="size-4" />
          Clear
        </button>
      </div>

      <div class="flex gap-2">
        <button
          class="btn btn-sm {viewMode === 'split'
            ? 'preset-filled-primary-500'
            : 'preset-tonal-surface'}"
          onclick={() => (viewMode = "split")}
        >
          <Code class="size-4" />
          Split
        </button>
        <button
          class="btn btn-sm {viewMode === 'preview'
            ? 'preset-filled-primary-500'
            : 'preset-tonal-surface'}"
          onclick={() => (viewMode = "preview")}
        >
          <Eye class="size-4" />
          Preview Only
        </button>
      </div>

      {#if textInput}
        <div class="flex gap-2">
          <button
            class="btn btn-sm preset-tonal-surface"
            onclick={downloadContent}
          >
            <Download class="size-4" />
            Download
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Editor and Preview -->
  {#if viewMode === "split"}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Editor -->
      <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
        <div class="flex justify-between items-center">
          <p class="font-medium">Input</p>
          <button
            class="btn btn-sm preset-tonal-surface p-1"
            title="Copy Input"
            onclick={copyInput}
          >
            <Copy class="size-4" />
          </button>
        </div>
        <textarea
          class="textarea font-mono text-sm min-h-[500px]"
          bind:value={textInput}
          placeholder="Enter your text or code here...

Supports:
- Markdown with GFM features
- JSON, YAML, TOML
- HTML, CSS, XML
- JavaScript, TypeScript, Python
- C#, Java, PHP, Go, Rust
- SQL, Shell/Bash
- And more...

Language is auto-detected or select manually above."
        ></textarea>
      </div>

      <!-- Preview -->
      <div
        class="card p-0 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 overflow-hidden space-y-2"
      >
        <div
          class="flex justify-between items-center px-4 py-2 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700"
        >
          <span
            class="font-medium text-sm text-surface-600 dark:text-surface-300"
            >Preview</span
          >

          <div class="flex items-center gap-2">
            <!-- Copy Preview Button -->
            <button
              class="btn btn-sm bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface p-1"
              title={previewType === "preview"
                ? "Copy Rendered HTML"
                : "Copy Source"}
              onclick={copyPreview}
            >
              <Copy class="size-4" />
            </button>

            <!-- Preview Type Selector -->
            <div class="relative preview-dropdown">
              <button
                class="btn btn-sm preset-tonal-surface flex items-center gap-2"
                onclick={() => (showPreviewDropdown = !showPreviewDropdown)}
              >
                <span>
                  {previewType === "preview" ? "Rendered" : "HTML Source"}
                </span>
                <ChevronDown class="size-4" />
              </button>

              {#if showPreviewDropdown}
                <div
                  class="absolute top-full right-0 mt-1 z-50 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg min-w-36"
                >
                  <button
                    class="w-full px-4 py-2 text-left text-sm hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-100"
                    class:bg-surface-100={previewType === "preview"}
                    class:dark:bg-surface-700={previewType === "preview"}
                    onclick={() => {
                      previewType = "preview";
                      showPreviewDropdown = false;
                    }}
                  >
                    Rendered
                  </button>
                  <button
                    class="w-full px-4 py-2 text-left text-sm hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-100"
                    class:bg-surface-100={previewType === "html"}
                    class:dark:bg-surface-700={previewType === "html"}
                    onclick={() => {
                      previewType = "html";
                      showPreviewDropdown = false;
                    }}
                  >
                    HTML Source
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>
        <div class="preview-container min-h-[500px] overflow-auto">
          <div class="relative">
            {#if previewType === "preview"}
              {#if textInput && blobUrl}
                <zero-md src={blobUrl}></zero-md>
              {:else}
                <p class="text-surface-400 p-2">Preview will appear here...</p>
              {/if}
            {:else}
              <div class="prose max-w-none dark:prose-invert">
                {#if textInput && htmlSourceBlobUrl}
                  <zero-md src={htmlSourceBlobUrl}></zero-md>
                {:else}
                  <p class="text-surface-400 p-2">Source will appear here...</p>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Preview Only -->
    <div
      class="card p-0 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 overflow-hidden space-y-4"
    >
      <!-- Hidden textarea for input -->
      <div
        class="p-4 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 flex justify-between items-start"
      >
        <textarea
          class="textarea font-mono text-sm w-full bg-transparent border-none focus:ring-0 resize-none"
          style="min-height: 100px;"
          bind:value={textInput}
          placeholder="Enter text or code..."
        ></textarea>

        <div class="flex flex-col gap-2 ml-4">
          <!-- Copy Input Button -->
          <button
            class="btn btn-sm preset-tonal-surface p-1"
            title="Copy Input"
            onclick={copyInput}
          >
            <Copy class="size-4" />
          </button>

          <!-- Preview Type Selector -->
          <div class="relative preview-dropdown">
            <button
              class="btn btn-sm preset-tonal-surface flex items-center gap-2"
              onclick={() => (showPreviewDropdown = !showPreviewDropdown)}
            >
              <span>
                {previewType === "preview" ? "Rendered" : "HTML Source"}
              </span>
              <ChevronDown class="size-4" />
            </button>

            {#if showPreviewDropdown}
              <div
                class="absolute top-full right-0 mt-1 z-50 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg min-w-36"
              >
                <button
                  class="w-full px-4 py-2 text-left text-sm hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-100"
                  class:bg-surface-100={previewType === "preview"}
                  class:dark:bg-surface-700={previewType === "preview"}
                  onclick={() => {
                    previewType = "preview";
                    showPreviewDropdown = false;
                  }}
                >
                  Rendered
                </button>
                <button
                  class="w-full px-4 py-2 text-left text-sm hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-100"
                  class:bg-surface-100={previewType === "html"}
                  class:dark:bg-surface-700={previewType === "html"}
                  onclick={() => {
                    previewType = "html";
                    showPreviewDropdown = false;
                  }}
                >
                  HTML Source
                </button>
              </div>
            {/if}
          </div>

          <button
            class="btn btn-sm preset-tonal-surface p-1"
            title={previewType === "preview"
              ? "Copy Rendered HTML"
              : "Copy Source"}
            onclick={copyPreview}
          >
            <Copy class="size-4" />
          </button>
        </div>
      </div>

      <div
        class="preview-container p-6 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 md:border-t-0 md:border-l"
      >
        {#if previewType === "preview"}
          {#if textInput && blobUrl}
            <zero-md src={blobUrl} no-shadow></zero-md>
          {:else}
            <p class="text-surface-400">Preview will appear here...</p>
          {/if}
        {:else}
          <div class="prose max-w-none dark:prose-invert">
            {#if textInput && htmlSourceBlobUrl}
              <zero-md src={htmlSourceBlobUrl} no-shadow></zero-md>
            {:else}
              <p class="text-surface-400">Source will appear here...</p>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Quick Samples -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold">Quick Samples</h2>
    <p class="text-surface-500 text-sm">
      Click to load a sample for each format:
    </p>
    <div class="flex flex-wrap gap-2">
      {#each ["markdown", "json", "html", "css", "yaml", "javascript", "typescript", "python", "sql", "bash"] as lang}
        <button
          class="btn btn-sm preset-tonal-surface"
          onclick={() => loadLanguageSample(lang)}
        >
          {languages.find((l) => l.id === lang)?.label || lang}
        </button>
      {/each}
    </div>
  </div>

  <!-- Supported Formats -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold">Supported Formats</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-sm">
      {#each languages.filter((l) => l.id !== "auto") as lang}
        <div
          class="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-800 rounded"
        >
          <span class="font-medium">{lang.label}</span>
          {#if lang.ext}
            <span class="text-xs text-surface-400">.{lang.ext}</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
