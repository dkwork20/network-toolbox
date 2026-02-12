<script lang="ts">
  import { FileText, Copy, Check, RefreshCw, Download, Eye, Code } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";
  import { marked } from "marked";

  // Configure marked for GitHub-flavored markdown
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  let markdownInput = $state("");
  let htmlOutput = $state("");
  let viewMode = $state<"split" | "preview">("split");
  let copied = $state(false);

  // Convert markdown to HTML
  function convertMarkdown() {
    if (!markdownInput) {
      htmlOutput = "";
      return;
    }

    try {
      htmlOutput = marked.parse(markdownInput) as string;
    } catch (e) {
      toaster.error({ title: "Error", description: "Failed to parse markdown" });
      htmlOutput = "";
    }
  }

  // Copy HTML
  async function copyHtml() {
    await navigator.clipboard.writeText(htmlOutput);
    copied = true;
    toaster.success({ title: "Copied!", description: "HTML copied to clipboard" });
    setTimeout(() => (copied = false), 1500);
  }

  // Download as HTML
  function downloadHtml() {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    pre { background: #f4f4f4; padding: 1rem; overflow-x: auto; border-radius: 4px; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 2px; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
    img { max-width: 100%; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; }
  </style>
</head>
<body>
${htmlOutput}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "markdown-export.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Load sample
  function loadSample() {
    markdownInput = `# NetOps Solutions

Your all-in-one toolkit for **Network Operations**, *Development*, and **Security**.

## Features

- 🔧 **Network Tools**: IP Calculator, Subnet Visualizer, DNS Lookup
- 🔐 **Security**: Password Generator, Log Sanitizer
- 💻 **Developer Tools**: JWT Debugger, Timestamp, Cron Generator

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## API Reference

| Tool | Route | Description |
|------|-------|-------------|
| IP Calculator | /tools/ip | CIDR calculations |
| DNS Lookup | /tools/dns | DoH record query |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

> **Note**: All tools run client-side for privacy.

---

Made with ❤️ by the NetOps team
`;
  }

  // Auto-convert
  $effect(() => {
    convertMarkdown();
  });
</script>

<svelte:head>
  <title>Markdown Preview - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-7xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <FileText class="size-8 text-primary-500" />
      Markdown Preview
      <span class="badge variant-filled-secondary text-xs">V0.10</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Preview README files and documentation with GitHub-flavored markdown
    </p>
  </div>

  <!-- Controls -->
  <div class="card p-4 bg-surface-50 dark:bg-surface-900 mb-6">
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="flex gap-2">
        <button class="btn btn-sm variant-ghost-surface" onclick={loadSample}>
          Load Sample
        </button>
        <button class="btn btn-sm variant-soft-surface" onclick={() => (markdownInput = "")}>
          <RefreshCw class="size-4" />
          Clear
        </button>
      </div>

      <div class="flex gap-2">
        <button
          class="btn btn-sm {viewMode === 'split' ? 'variant-filled-primary' : 'variant-soft-surface'}"
          onclick={() => (viewMode = 'split')}
        >
          <Code class="size-4" />
          Split
        </button>
        <button
          class="btn btn-sm {viewMode === 'preview' ? 'variant-filled-primary' : 'variant-soft-surface'}"
          onclick={() => (viewMode = 'preview')}
        >
          <Eye class="size-4" />
          Preview Only
        </button>
      </div>

      {#if htmlOutput}
        <div class="flex gap-2">
          <button class="btn btn-sm variant-soft-surface" onclick={copyHtml}>
            {#if copied}
              <Check class="size-4 text-success-500" />
            {:else}
              <Copy class="size-4" />
            {/if}
            Copy HTML
          </button>
          <button class="btn btn-sm variant-soft-surface" onclick={downloadHtml}>
            <Download class="size-4" />
            Download HTML
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Editor and Preview -->
  {#if viewMode === 'split'}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Editor -->
      <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
        <label class="font-medium">Markdown</label>
        <textarea
          class="textarea font-mono text-sm min-h-[500px]"
          bind:value={markdownInput}
          placeholder="# Enter your markdown here...

Supports:
- **Bold**, *italic*, ~~strikethrough~~
- Lists (ordered and unordered)
- Code blocks with syntax hints
- Tables
- Blockquotes
- Links and images
- GitHub-flavored markdown"
        ></textarea>
      </div>

      <!-- Preview -->
      <div class="card p-0 bg-surface-900 overflow-hidden space-y-2">
        <div class="flex justify-between items-center px-4 py-2 bg-surface-800 border-b border-surface-700">
          <span class="font-medium text-sm text-surface-400">Preview</span>
        </div>
        <div
          class="prose max-w-none min-h-[500px] p-6"
        >
          {#if htmlOutput}
            {@html htmlOutput}
          {:else}
            <p class="text-surface-400">Preview will appear here...</p>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <!-- Preview Only -->
    <div class="card p-0 bg-surface-900 overflow-hidden space-y-4">
      <!-- Hidden textarea for input -->
      <div class="p-4 bg-surface-800 border-b border-surface-700">
        <textarea
          class="textarea font-mono text-sm w-full"
          style="min-height: 100px;"
          bind:value={markdownInput}
          placeholder="Enter markdown..."
        ></textarea>
      </div>

      <div
        class="prose max-w-none p-6"
      >
        {#if htmlOutput}
          {@html htmlOutput}
        {:else}
          <p class="text-surface-400">Preview will appear here...</p>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Markdown Cheat Sheet -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold">Markdown Cheat Sheet</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <h3 class="font-medium mb-2">Basic Syntax</h3>
        <pre class="bg-surface-100 dark:bg-surface-800 p-3 rounded overflow-auto">
# Heading 1
## Heading 2
### Heading 3

**bold text**
*italic text*
~~strikethrough~~

- Unordered list
- Item 2

1. Ordered list
2. Item 2

[Link text](url)
![Image alt](image-url)

`inline code`

> Blockquote

---
Horizontal rule
        </pre>
      </div>
      <div>
        <h3 class="font-medium mb-2">Extended Syntax (GFM)</h3>
        <pre class="bg-surface-100 dark:bg-surface-800 p-3 rounded overflow-auto">
```javascript
// Code block
const x = 1;
```

| Table | Header |
|-------|--------|
| cell  | cell   |

- [ ] Task list
- [x] Completed task

~~strikethrough~~

Auto-link: https://example.com

@mention (GitHub)

#123 (GitHub issue ref)
        </pre>
      </div>
    </div>
  </div>
</div>

<style>
  /* GitHub-inspired dark theme markdown styling */
  .prose {
    color: #c9d1d9;
    font-size: 14px;
    line-height: 1.6;
  }

  /* Headings */
  .prose h1 {
    font-size: 2em;
    font-weight: 600;
    margin: 0 0 16px 0;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #30363d;
    color: #f0f6fc;
  }
  .prose h2 {
    font-size: 1.5em;
    font-weight: 600;
    margin: 24px 0 16px 0;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #30363d;
    color: #f0f6fc;
  }
  .prose h3 {
    font-size: 1.25em;
    font-weight: 600;
    margin: 20px 0 12px 0;
    color: #f0f6fc;
  }
  .prose h4 {
    font-size: 1em;
    font-weight: 600;
    margin: 16px 0 8px 0;
    color: #f0f6fc;
  }

  /* Paragraphs and text */
  .prose p {
    margin: 0 0 16px 0;
  }
  .prose strong {
    font-weight: 600;
    color: #f0f6fc;
  }
  .prose em {
    font-style: italic;
  }
  .prose del {
    text-decoration: line-through;
    color: #8b949e;
  }

  /* Links */
  .prose a {
    color: #58a6ff;
    text-decoration: none;
  }
  .prose a:hover {
    text-decoration: underline;
  }

  /* Lists */
  .prose ul, .prose ol {
    margin: 0 0 16px 0;
    padding-left: 24px;
  }
  .prose li {
    margin: 4px 0;
  }
  .prose li > ul, .prose li > ol {
    margin: 4px 0;
  }

  /* Task lists (checkboxes) */
  .prose ul.contains-task-list {
    list-style: none;
    padding-left: 0;
  }
  .prose li.task-list-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 8px 0;
  }
  .prose li.task-list-item input[type="checkbox"] {
    margin-top: 4px;
    width: 16px;
    height: 16px;
    accent-color: #238636;
    cursor: pointer;
  }

  /* Inline code */
  .prose code:not(pre code) {
    background: rgba(110, 118, 129, 0.4);
    padding: 0.2em 0.4em;
    border-radius: 6px;
    font-family: 'ui-monospace', 'SFMono-Regular', 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
    font-size: 0.85em;
    color: #ff7b72;
  }

  /* Code blocks */
  .prose pre {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
    margin: 0 0 16px 0;
    font-family: 'ui-monospace', 'SFMono-Regular', 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
    font-size: 13px;
    line-height: 1.5;
  }
  .prose pre code {
    background: transparent;
    padding: 0;
    border-radius: 0;
    font-size: 100%;
    color: #c9d1d9;
  }

  /* Blockquotes */
  .prose blockquote {
    border-left: 4px solid #30363d;
    padding: 0 16px;
    margin: 0 0 16px 0;
    color: #8b949e;
  }
  .prose blockquote > :first-child {
    margin-top: 0;
  }
  .prose blockquote > :last-child {
    margin-bottom: 0;
  }

  /* Tables */
  .prose table {
    display: block;
    width: max-content;
    max-width: 100%;
    border-collapse: collapse;
    margin: 0 0 16px 0;
    overflow-x: auto;
  }
  .prose th, .prose td {
    border: 1px solid #30363d;
    padding: 8px 12px;
    text-align: left;
  }
  .prose th {
    background: #21262d;
    font-weight: 600;
    color: #f0f6fc;
  }
  .prose tr:nth-child(even) {
    background: rgba(110, 118, 129, 0.1);
  }
  .prose tr:hover {
    background: rgba(110, 118, 129, 0.15);
  }

  /* Images */
  .prose img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 8px 0;
  }

  /* Horizontal rule */
  .prose hr {
    border: none;
    border-top: 1px solid #30363d;
    margin: 24px 0;
  }

  /* Emoji */
  .prose .emoji {
    font-size: 1.2em;
  }
</style>
