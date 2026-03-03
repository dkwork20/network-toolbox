<script lang="ts">
  import { onMount } from "svelte";
  import { toaster } from "$lib/toaster.svelte";
  import {
    Calculator,
    Network,
    ShieldCheck,
    Activity,
    FileJson,
    Key,
    FileCode,
    Clock,
    CalendarClock,
    Search,
    ExternalLink,
    Plus,
    Edit3,
    X,
    Lock,
    Unlock,
    // New icons for Phase 1 tools
    Fingerprint,
    Hash,
    Binary,
    Link,
    KeyRound,
    Palette,
    // New icons for Phase 2-4 tools
    QrCode,
    Regex,
    GitCompare,
    // New icons for additional tools
    FileText,
    Scan,
    FileSearch,
    Container,
  } from "@lucide/svelte";
  import { fade } from "svelte/transition";
  import { DragDropProvider } from "@dnd-kit-svelte/svelte";
  import SortableQuickLink from "$lib/components/SortableQuickLink.svelte";
  import { isToolVerified } from "$lib/data/verified-tools";

  function arrayMove(array: any[], from: number, to: number) {
    const newArray = array.slice();
    newArray.splice(
      to < 0 ? newArray.length + to : to,
      0,
      newArray.splice(from, 1)[0],
    );
    return newArray;
  }

  interface QuickLink {
    id: string;
    title: string;
    url: string;
    desc: string;
  }

  function normalizeQuickLinkUrl(rawUrl: string): string | null {
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;

    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    try {
      const parsed = new URL(withProtocol);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }

  function sanitizeQuickLinks(raw: unknown): QuickLink[] {
    if (!Array.isArray(raw)) return [];

    return raw
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const item = entry as Partial<QuickLink>;
        const title = typeof item.title === "string" ? item.title.trim() : "";
        const desc = typeof item.desc === "string" ? item.desc.trim() : "";
        const url =
          typeof item.url === "string" ? normalizeQuickLinkUrl(item.url) : null;
        if (!title || !url) return null;

        return {
          id:
            typeof item.id === "string" && item.id.trim()
              ? item.id
              : crypto.randomUUID(),
          title,
          url,
          desc,
        } satisfies QuickLink;
      })
      .filter((item): item is QuickLink => item !== null);
  }

  // --- Tool Data ---
  const tools = [
    // Network Tools
    {
      id: "ip",
      title: "IP Calculator",
      desc: "CIDR calculation & subnet analysis",
      icon: Calculator,
      href: "/tools/ip",
      cat: "network",
      version: "V0.4 ~ V0.15",
    },
    {
      id: "subnet",
      title: "Subnet Visualizer",
      desc: "Visual subnet planning",
      icon: Network,
      href: "/tools/subnet",
      cat: "network",
      version: "V0.2",
    },
    {
      id: "dns",
      title: "DNS Lookup",
      desc: "DoH Record Query",
      icon: Search,
      href: "/tools/dns",
      cat: "network",
      version: "V0.4 ~ V0.15",
    },
    {
      id: "diag",
      title: "Diagnostics",
      desc: "WebRTC & Connectivity",
      icon: Activity,
      href: "/tools/diagnostics",
      cat: "network",
      version: "V0.4",
    },
    {
      id: "mac",
      title: "MAC Lookup",
      desc: "Vendor lookup & format convert",
      icon: Network,
      href: "/tools/mac",
      cat: "network",
      version: "V0.9",
      isNew: true,
    },
    {
      id: "port",
      title: "Port Scanner",
      desc: "Check port availability",
      icon: Scan,
      href: "/tools/port",
      cat: "network",
      version: "V0.10",
      isNew: true,
    },
    {
      id: "ping",
      title: "Ping Monitor",
      desc: "Latency measurement & history",
      icon: Activity,
      href: "/tools/ping",
      cat: "network",
      version: "V0.10",
      isNew: true,
    },
    {
      id: "headers",
      title: "HTTP Headers",
      desc: "Security headers analyzer",
      icon: FileSearch,
      href: "/tools/headers",
      cat: "network",
      version: "V0.10",
      isNew: true,
    },
    {
      id: "ssl",
      title: "SSL Checker",
      desc: "Certificate validation",
      icon: Lock,
      href: "/tools/ssl",
      cat: "network",
      version: "V0.10",
      isNew: true,
    },
    {
      id: "whois",
      title: "Whois Lookup",
      desc: "Domain & IP registration",
      icon: Search,
      href: "/tools/whois",
      cat: "network",
      version: "V0.10",
      isNew: true,
    },
    {
      id: "speed",
      title: "Speed Test",
      desc: "Network bandwidth test",
      icon: Activity,
      href: "/tools/speed",
      cat: "network",
      version: "V0.10",
      isNew: true,
    },

    // Encoding & Data Tools (New)
    {
      id: "uuid",
      title: "UUID Generator",
      desc: "Generate unique IDs",
      icon: Fingerprint,
      href: "/tools/uuid",
      cat: "encoding",
      version: "V0.6",
      isNew: true,
    },
    {
      id: "hash",
      title: "Hash Calculator",
      desc: "SHA-256, SHA-512 & more",
      icon: Hash,
      href: "/tools/hash",
      cat: "encoding",
      version: "V0.7",
      isNew: true,
    },
    {
      id: "base64",
      title: "Base64 Encoder",
      desc: "Encode/Decode Base64 & files",
      icon: Binary,
      href: "/tools/base64",
      cat: "encoding",
      version: "V0.6",
      isNew: true,
    },
    {
      id: "url",
      title: "URL Encoder",
      desc: "Encode/Decode URLs & Query",
      icon: Link,
      href: "/tools/url",
      cat: "encoding",
      version: "V0.6",
      isNew: true,
    },
    {
      id: "json",
      title: "JSON Formatter",
      desc: "Format, validate & explore",
      icon: FileJson,
      href: "/tools/json",
      cat: "encoding",
      version: "V0.6",
      isNew: true,
    },
    {
      id: "color",
      title: "Color Picker",
      desc: "Convert HEX, RGB, HSL, CMYK",
      icon: Palette,
      href: "/tools/color",
      cat: "encoding",
      version: "V0.6",
      isNew: true,
    },
    {
      id: "qr",
      title: "QR Generator",
      desc: "Create QR codes for sharing",
      icon: QrCode,
      href: "/tools/qr",
      cat: "encoding",
      version: "V0.7",
      isNew: true,
    },

    // Security Tools (New)
    {
      id: "password",
      title: "Password Generator",
      desc: "Secure password creation",
      icon: KeyRound,
      href: "/tools/password",
      cat: "security",
      version: "V0.6 ~ V0.17",
      isUpdated: true,
    },
    {
      id: "bcrypt",
      title: "Bcrypt Hash",
      desc: "Generate & verify bcrypt hashes",
      icon: Key,
      href: "/tools/bcrypt",
      cat: "security",
      version: "V0.10",
      isNew: true,
    },
    {
      id: "sanitizer",
      title: "Log Sanitizer",
      desc: "Redact sensitive data",
      icon: ShieldCheck,
      href: "/tools/sanitizer",
      cat: "security",
      version: "V0.3 ~ V0.16",
      isUpdated: true,
    },

    // Developer Tools
    {
      id: "jwt",
      title: "JWT Debugger",
      desc: "Decode JWT Tokens",
      icon: Key,
      href: "/tools/jwt",
      cat: "dev",
      version: "V0.5",
    },
    {
      id: "cert",
      title: "Cert Decoder",
      desc: "X.509 Certificate Info",
      icon: FileCode,
      href: "/tools/cert",
      cat: "dev",
      version: "V0.5",
    },
    {
      id: "convert",
      title: "Converter",
      desc: "JSON <> YAML <> TOML",
      icon: FileJson,
      href: "/tools/converter",
      cat: "dev",
      version: "V0.5",
    },
    {
      id: "time",
      title: "Timestamp",
      desc: "Unix Time & Duration",
      icon: Clock,
      href: "/tools/timestamp",
      cat: "dev",
      version: "V0.4",
    },
    {
      id: "cron",
      title: "Cron Generator",
      desc: "Schedule Expressions",
      icon: CalendarClock,
      href: "/tools/cron",
      cat: "dev",
      version: "V0.5",
    },
    {
      id: "regex",
      title: "Regex Tester",
      desc: "Build & test patterns",
      icon: Regex,
      href: "/tools/regex",
      cat: "dev",
      version: "V0.7",
      isNew: true,
    },
    {
      id: "diff",
      title: "Diff Viewer",
      desc: "Compare text differences",
      icon: GitCompare,
      href: "/tools/diff",
      cat: "dev",
      version: "V0.8",
      isNew: true,
    },
    {
      id: "markdown",
      title: "Markdown Preview",
      desc: "Preview README files",
      icon: FileText,
      href: "/tools/markdown",
      cat: "dev",
      version: "V0.10",
      isNew: true,
    },
    {
      id: "docker",
      title: "Docker Compose",
      desc: "Generate compose files",
      icon: Container,
      href: "/tools/docker",
      cat: "dev",
      version: "V0.11 ~ V0.15",
      isNew: true,
    },
  ];

  const categories = [
    { id: "network", label: "Network Tools" },
    { id: "encoding", label: "Encoding & Data" },
    { id: "security", label: "Security" },
    { id: "dev", label: "Developer" },
  ];

  // --- Quick Links (Draggable) ---
  let quickLinks = $state<QuickLink[]>([
    {
      id: "1",
      title: "Google",
      url: "https://google.com",
      desc: "Search Engine",
    },
    {
      id: "2",
      title: "WireGuard",
      url: "https://wireguard.com",
      desc: "Official Site",
    },
  ]);

  let isEditing = $state(false);
  let showAddModal = $state(false);
  let newLink = $state({ title: "", url: "", desc: "" });
  let isLocked = $state(true);

  // Load from LS
  onMount(() => {
    const saved = localStorage.getItem("quickLinks");
    if (saved) {
      try {
        quickLinks = sanitizeQuickLinks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load quick links", e);
      }
    }
  });

  // Save to LS
  $effect(() => {
    localStorage.setItem("quickLinks", JSON.stringify(quickLinks));
  });

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = quickLinks.findIndex((item) => item.id === active.id);
      const newIndex = quickLinks.findIndex((item) => item.id === over.id);
      quickLinks = arrayMove(quickLinks, oldIndex, newIndex);
    }
  }

  function deleteLink(id: string) {
    quickLinks = quickLinks.filter((l) => l.id !== id);
  }

  function addLink() {
    if (!newLink.title || !newLink.url) {
      toaster.error({
        title: "Error",
        description: "Title and URL are required",
      });
      return;
    }

    const normalizedUrl = normalizeQuickLinkUrl(newLink.url);
    if (!normalizedUrl) {
      toaster.error({
        title: "Invalid URL",
        description: "Please enter a valid http(s) URL",
      });
      return;
    }

    quickLinks = [
      ...quickLinks,
      {
        id: crypto.randomUUID(),
        title: newLink.title.trim(),
        url: normalizedUrl,
        desc: newLink.desc.trim(),
      },
    ];
    newLink = { title: "", url: "", desc: "" };
    showAddModal = false;
    toaster.success({ title: "Success", description: "Link added" });
  }
</script>

<div class="container mx-auto p-4 max-w-6xl pb-20 space-y-12">
  <!-- Hero / Intro -->
  <div class="text-center py-10 space-y-4">
    <h1
      class="h1 font-bold bg-linear-to-br from-primary-500 to-secondary-500 bg-clip-text text-transparent box-decoration-clone"
    >
      NetOps Solutions
    </h1>
    <p class="text-xl text-surface-500 max-w-2xl mx-auto">
      Your all-in-one toolkit for Network Operations, Development, and Security.
      Client-side only, privacy focused.
    </p>
  </div>

  <!-- Quick Links (Sortable) -->
  <div class="space-y-4">
    <div
      class="flex justify-between items-center border-b border-surface-500/10 pb-2"
    >
      <h2 class="h2 font-bold flex items-center gap-2">
        <ExternalLink class="size-6 text-primary-500" />
        Quick Links
      </h2>
      <div class="flex gap-2">
        <button
          class="btn-icon btn-icon-sm preset-outlined-surface-500 hover:preset-filled-surface-500 transition-all"
          onclick={() => {
            isLocked = !isLocked;
            if (isLocked) isEditing = false;
          }}
          title={isLocked ? "Unlock to edit" : "Lock"}
        >
          {#if isLocked}
            <Lock class="size-5" />
          {:else}
            <Unlock class="size-5 text-warning-500" />
          {/if}
        </button>

        {#if !isLocked}
          <div class="flex gap-2" in:fade>
            <button
              class="btn-sm preset-tonal-surface"
              onclick={() => (isEditing = !isEditing)}
            >
              {#if isEditing}Done{:else}<Edit3 class="size-4 mr-1" /> Remove{/if}
            </button>
            <button
              class="btn-sm preset-filled-primary-500"
              onclick={() => (showAddModal = true)}
            >
              <Plus class="size-4 mr-1" /> Add
            </button>
          </div>
        {/if}
      </div>
    </div>

    <DragDropProvider onDragEnd={handleDragEnd}>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each quickLinks as link, index (link.id)}
          <SortableQuickLink
            id={link.id}
            {index}
            {link}
            {isEditing}
            onDelete={deleteLink}
            disabled={isLocked}
          />
        {/each}
      </div>
    </DragDropProvider>

    {#if quickLinks.length === 0}
      <div
        class="text-center p-8 border-2 border-dashed border-surface-500/20 rounded-lg text-surface-500"
      >
        No quick links yet. Add one to get started!
      </div>
    {/if}
  </div>

  <!-- Tool Categories -->
  {#each categories as cat}
    <div class="space-y-4">
      <h2 class="h2 font-bold pb-2 border-b border-surface-500/10 capitalize">
        {cat.label}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each tools.filter((t) => t.cat === cat.id) as tool}
          <a
            href={tool.href}
            class={`card p-6 bg-surface-50 dark:bg-surface-800 border transition-all group ${
              isToolVerified(tool.id)
                ? "border-success-500/40 ring-1 ring-success-500/25 hover:border-success-500/60 hover:shadow-lg hover:shadow-success-500/10"
                : "border-surface-500/20 hover:border-primary-500/30 hover:shadow-lg"
            }`}
          >
            <div class="flex items-start gap-4">
              <div
                class="p-3 bg-surface-200 dark:bg-surface-700/50 rounded-lg group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-colors"
              >
                <tool.icon class="size-8" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3
                    class="h3 font-bold group-hover:text-primary-500 transition-colors"
                  >
                    {tool.title}
                  </h3>
                  {#if tool.isNew}
                    <span
                      class="badge preset-filled-error-500 text-xs animate-pulse"
                      >NEW</span
                    >
                  {/if}
                  {#if tool.isUpdated}
                    <span
                      class="badge preset-filled-tertiary-500 text-xs animate-pulse"
                      >UPDATED</span
                    >
                  {/if}
                  {#if isToolVerified(tool.id)}
                    <span class="badge preset-tonal-success text-xs"
                      >Verified</span
                    >
                  {/if}
                  <span class="badge preset-tonal-secondary text-xs"
                    >{tool.version}</span
                  >
                </div>
                <p class="text-sm text-surface-500 mt-1">{tool.desc}</p>
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>
  {/each}
</div>

<!-- Add Link Modal (Simple Overlay) -->
{#if showAddModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
  >
    <div
      class="card p-6 w-full max-w-md bg-surface-100 dark:bg-surface-900 shadow-2xl space-y-4"
    >
      <div class="flex justify-between items-center">
        <h3 class="h3 font-bold">Add Quick Link</h3>
        <button
          class="btn-icon btn-icon-sm"
          onclick={() => (showAddModal = false)}><X class="size-5" /></button
        >
      </div>
      <label class="label">
        <span>Title</span>
        <input
          class="input"
          type="text"
          bind:value={newLink.title}
          placeholder="e.g. My Server"
        />
      </label>
      <label class="label">
        <span>URL</span>
        <input
          class="input"
          type="url"
          bind:value={newLink.url}
          placeholder="https://..."
        />
      </label>
      <label class="label">
        <span>Description</span>
        <input
          class="input"
          type="text"
          bind:value={newLink.desc}
          placeholder="Optional note"
        />
      </label>
      <div class="flex justify-end gap-2 mt-4">
        <button
          class="btn bg-transparent"
          onclick={() => (showAddModal = false)}>Cancel</button
        >
        <button class="btn preset-filled-primary-500" onclick={addLink}
          >Save</button
        >
      </div>
    </div>
  </div>
{/if}

<style>
  /* smooth flip animation */
  :global(.animate-flip) {
    transform-origin: 50% 50%;
  }
</style>
