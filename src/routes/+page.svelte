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
  } from "@lucide/svelte";
  import { DragDropProvider } from "@dnd-kit-svelte/svelte";
  import SortableQuickLink from "$lib/components/SortableQuickLink.svelte";

  function arrayMove(array: any[], from: number, to: number) {
    const newArray = array.slice();
    newArray.splice(
      to < 0 ? newArray.length + to : to,
      0,
      newArray.splice(from, 1)[0],
    );
    return newArray;
  }

  // --- Tool Data ---
  const tools = [
    {
      id: "ip",
      title: "IP Calculator",
      desc: "CIDR calculation & exclusion",
      icon: Calculator,
      href: "/tools/ip",
      cat: "network",
    },
    {
      id: "subnet",
      title: "Subnet Visualizer",
      desc: "Visual subnet planning",
      icon: Network,
      href: "/tools/subnet",
      cat: "network",
    },
    {
      id: "dns",
      title: "DNS Lookup",
      desc: "DoH Record Query",
      icon: Search,
      href: "/tools/dns",
      cat: "network",
    },
    {
      id: "diag",
      title: "Diagnostics",
      desc: "WebRTC & Conductivity",
      icon: Activity,
      href: "/tools/diagnostics",
      cat: "network",
    },

    {
      id: "sanitizer",
      title: "Log Sanitizer",
      desc: "Redact sensitive data",
      icon: ShieldCheck,
      href: "/tools/sanitizer",
      cat: "utility",
    },

    {
      id: "jwt",
      title: "JWT Debugger",
      desc: "Decode JWT Tokens",
      icon: Key,
      href: "/tools/jwt",
      cat: "dev",
    },
    {
      id: "cert",
      title: "Cert Decoder",
      desc: "X.509 Certificate Info",
      icon: FileCode,
      href: "/tools/cert",
      cat: "dev",
    },
    {
      id: "convert",
      title: "Converter",
      desc: "JSON <> YAML <> TOML",
      icon: FileJson,
      href: "/tools/converter",
      cat: "dev",
    },
    {
      id: "time",
      title: "Timestamp",
      desc: "Unix Time & Duration",
      icon: Clock,
      href: "/tools/timestamp",
      cat: "dev",
    },
    {
      id: "cron",
      title: "Cron Generator",
      desc: "Schedule Expressions",
      icon: CalendarClock,
      href: "/tools/cron",
      cat: "dev",
    },
  ];

  const categories = [
    { id: "network", label: "Network Tools" },
    { id: "utility", label: "Utilities" },
    { id: "dev", label: "Developer" },
  ];

  // --- Quick Links (Draggable) ---
  let quickLinks = $state([
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

  // Load from LS
  onMount(() => {
    const saved = localStorage.getItem("quickLinks");
    if (saved) {
      try {
        quickLinks = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load quick links", e);
      }
    }
  });

  // Save to LS
  $effect(() => {
    if (quickLinks.length > 0) {
      localStorage.setItem("quickLinks", JSON.stringify(quickLinks));
    }
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
    quickLinks = [...quickLinks, { id: crypto.randomUUID(), ...newLink }];
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
          class="btn-sm variant-soft-surface"
          onclick={() => (isEditing = !isEditing)}
        >
          {#if isEditing}Done{:else}<Edit3 class="size-4 mr-1" /> Edit{/if}
        </button>
        <button
          class="btn-sm variant-filled-primary"
          onclick={() => (showAddModal = true)}
        >
          <Plus class="size-4 mr-1" /> Add
        </button>
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
            class="card p-6 bg-surface-50 dark:bg-surface-900 border border-surface-500/10 hover:border-primary-500/50 hover:shadow-lg transition-all group"
          >
            <div class="flex items-start gap-4">
              <div
                class="p-3 bg-surface-200 dark:bg-surface-800 rounded-lg group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-colors"
              >
                <tool.icon class="size-8" />
              </div>
              <div>
                <h3
                  class="h3 font-bold group-hover:text-primary-500 transition-colors"
                >
                  {tool.title}
                </h3>
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
        <button class="btn variant-ghost" onclick={() => (showAddModal = false)}
          >Cancel</button
        >
        <button class="btn variant-filled-primary" onclick={addLink}
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
