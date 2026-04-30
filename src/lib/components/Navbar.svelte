<script lang="ts">
  import { Moon, Sun, Menu, X, ChevronDown } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { Dialog, DropdownMenu } from "bits-ui";
  import { page } from "$app/stores";
  import { isToolHrefVerified } from "$lib/data/verified-tools";

  type ThemePreference = "light" | "dark";

  const THEME_STORAGE_KEY = "theme";

  let isDark = $state(true);
  let isMobileMenuOpen = $state(false);

  interface NavTool {
    label: string;
    href: string;
    isBeta?: boolean;
  }

  interface NavCategory {
    title: string;
    tools: NavTool[];
  }

  const navCategories: NavCategory[] = [
    {
      title: "Network",
      tools: [
        { label: "IP Calculator", href: "/tools/ip" },
        { label: "Subnet Visualizer", href: "/tools/subnet" },
        { label: "DNS Lookup", href: "/tools/dns" },
        { label: "Diagnostics", href: "/tools/diagnostics" },
        { label: "MAC Lookup", href: "/tools/mac", isBeta: true },
        { label: "Port Scanner", href: "/tools/port", isBeta: true },
        { label: "Ping Monitor", href: "/tools/ping", isBeta: true },
        { label: "HTTP Headers", href: "/tools/headers", isBeta: true },
        { label: "SSL Checker", href: "/tools/ssl", isBeta: true },
        { label: "Whois Lookup", href: "/tools/whois", isBeta: true },
        { label: "Speed Test", href: "/tools/speed", isBeta: true },
      ],
    },
    {
      title: "Encoding & Data",
      tools: [
        { label: "UUID Generator", href: "/tools/uuid", isBeta: true },
        { label: "Hash Calculator", href: "/tools/hash", isBeta: true },
        { label: "Base64 Encoder", href: "/tools/base64", isBeta: true },
        { label: "URL Encoder", href: "/tools/url", isBeta: true },
        { label: "JSON Formatter", href: "/tools/json", isBeta: true },
        { label: "Color Picker", href: "/tools/color", isBeta: true },
        { label: "QR Generator", href: "/tools/qr", isBeta: true },
      ],
    },
    {
      title: "Security",
      tools: [
        { label: "Password Generator", href: "/tools/password", isBeta: true },
        { label: "Bcrypt Hash", href: "/tools/bcrypt", isBeta: true },
        { label: "Log Sanitizer", href: "/tools/sanitizer" },
      ],
    },
    {
      title: "Developer",
      tools: [
        { label: "JWT Debugger", href: "/tools/jwt" },
        { label: "Cert Decoder", href: "/tools/cert" },
        { label: "Converter", href: "/tools/converter" },
        { label: "Timestamp", href: "/tools/timestamp" },
        { label: "Cron Generator", href: "/tools/cron" },
        { label: "Regex Tester", href: "/tools/regex", isBeta: true },
        { label: "Diff Viewer", href: "/tools/diff", isBeta: true },
        { label: "Markdown Preview", href: "/tools/markdown", isBeta: true },
        { label: "Docker Compose", href: "/tools/docker", isBeta: true },
      ],
    },
  ];

  function getStoredThemePreference(): ThemePreference | null {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
    return null;
  }

  function getSystemPrefersDark(): boolean {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function applyTheme(darkMode: boolean) {
    document.documentElement.classList.toggle("dark", darkMode);
  }

  function resolveInitialTheme(): boolean {
    const storedTheme = getStoredThemePreference();
    if (storedTheme) {
      return storedTheme === "dark";
    }
    return getSystemPrefersDark();
  }

  function toggleTheme() {
    isDark = !isDark;
    applyTheme(isDark);
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  }

  function navToolLinkClass(baseClass: string, href: string): string {
    if (!isToolHrefVerified(href)) {
      return baseClass;
    }
    return `${baseClass} text-success-900 dark:text-success-300 font-semibold border border-success-500/35 rounded-md bg-success-700/20`;
  }

  onMount(() => {
    isDark = resolveInitialTheme();
    applyTheme(isDark);
  });

  // Close menu on navigation
  $effect(() => {
    // React to page navigation to close menu
    const _ = $page.url.pathname;
    isMobileMenuOpen = false;
  });
</script>

<nav
  class="border-b border-surface-500/10 bg-surface-50/90 dark:bg-surface-900/90 shadow-sm sticky top-0 z-50 backdrop-blur-md transition-all duration-200"
>
  <div
    class="container mx-auto max-w-6xl px-4 h-16 flex justify-between items-center"
  >
    <div class="flex items-center gap-8">
      <a
        href="/"
        class="font-bold text-xl tracking-tight bg-linear-to-br from-primary-500 to-secondary-500 bg-clip-text text-transparent decoration-none hover:opacity-80 transition-opacity"
      >
        NetOps Solutions
      </a>

      <!-- Desktop Menu -->
      <div
        class="hidden lg:flex items-center gap-1 text-sm font-medium text-surface-600 dark:text-surface-300"
      >
        {#each navCategories as category}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              class="btn-sm bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-primary transition-colors rounded-md py-2 px-3 flex items-center gap-1 group"
            >
              {category.title.split(" ")[0]}
              <ChevronDown
                class="size-3 opacity-50 group-hover:opacity-100 transition-opacity"
              />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                class="z-50 min-w-[200px] bg-surface-50 dark:bg-surface-800 rounded-lg shadow-2xl border border-surface-900/30 dark:border-surface-100/30 p-2 outline-none animate-in fade-in zoom-in-95 duration-100"
              >
                {#each category.tools as tool}
                  <DropdownMenu.Item
                    class="rounded-md hover:bg-surface-100 dark:hover:bg-surface-600 outline-none transition-colors"
                  >
                    <a
                      href={tool.href}
                      class={navToolLinkClass(
                        "flex items-center px-3 py-2 w-full h-full text-sm",
                        tool.href,
                      )}
                    >
                      {tool.label}
                      {#if tool.isBeta}
                        <span class="text-error-500 font-bold ml-1">**</span>
                      {/if}
                      {#if isToolHrefVerified(tool.href)}
                        <span
                          class="badge preset-tonal-success text-[10px] ml-2"
                        >
                          Verified
                        </span>
                      {/if}
                    </a>
                  </DropdownMenu.Item>
                {/each}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          <div class="h-4 w-px bg-surface-500/20 mx-1 last:hidden"></div>
        {/each}
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Desktop About/Github -->
      <div class="hidden md:flex items-center gap-3">
        <a
          href="/changelog"
          class="text-sm font-medium text-surface-400 hover:text-primary-500 transition-colors"
          >About</a
        >
        <a
          href="https://github.com/skeletonlabs/skeleton"
          target="_blank"
          rel="noreferrer"
          class="text-sm font-medium text-surface-400 hover:text-primary-500 transition-colors"
        >
          GitHub
        </a>
        <div class="h-4 w-px bg-surface-500/20"></div>
      </div>

      <button
        class="btn-icon btn-icon-sm preset-outlined-surface-500 hover:preset-tonal-primary transition-all"
        onclick={toggleTheme}
        aria-label="Toggle Dark Mode"
      >
        {#if isDark}
          <Moon class="size-4" />
        {:else}
          <Sun class="size-4" />
        {/if}
      </button>

      <!-- Mobile Menu Trigger -->
      <div class="lg:hidden ml-2">
        <Dialog.Root bind:open={isMobileMenuOpen}>
          <Dialog.Trigger
            class="btn-icon btn-icon-sm preset-filled-surface-500"
          >
            <Menu class="size-5" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay
              class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
            />
            <Dialog.Content
              class="fixed right-0 top-0 bottom-0 z-50 w-[85%] max-w-[300px] bg-surface-100 dark:bg-surface-900 border-l border-surface-500/10 shadow-2xl flex flex-col outline-none"
            >
              <!-- Mobile Header -->
              <div
                class="h-16 px-6 flex items-center justify-between border-b border-surface-500/10"
              >
                <span class="font-bold text-lg tracking-tight">Menu</span>
                <Dialog.Close
                  class="btn-icon btn-icon-sm bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface"
                >
                  <X class="size-5" />
                </Dialog.Close>
              </div>

              <!-- Mobile Content -->
              <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {#each navCategories as category}
                  <div class="flex flex-col gap-1">
                    <span
                      class="text-xs font-bold uppercase text-surface-500 tracking-wider mb-2"
                    >
                      {category.title}
                    </span>
                    {#each category.tools as tool}
                      <a
                        href={tool.href}
                        class={navToolLinkClass(
                          "btn bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface justify-start px-3 py-2 h-auto text-sm",
                          tool.href,
                        )}
                      >
                        {tool.label}
                        {#if tool.isBeta}
                          <span class="text-error-500 font-bold ml-1">**</span>
                        {/if}
                        {#if isToolHrefVerified(tool.href)}
                          <span
                            class="badge preset-tonal-success text-[10px] ml-2"
                          >
                            Verified
                          </span>
                        {/if}
                      </a>
                    {/each}
                  </div>
                {/each}

                <hr class="border-surface-500/10" />

                <div class="flex flex-col gap-2">
                  <a
                    href="/changelog"
                    class="btn bg-transparent dark:text-surface-100 hover:preset-tonal-surface justify-start text-surface-500"
                    >Changelog</a
                  >
                  <a
                    href="https://github.com/skeletonlabs/skeleton"
                    target="_blank"
                    rel="noreferrer"
                    class="btn bg-transparent dark:text-surface-100 hover:preset-tonal-surface justify-start text-surface-500"
                    >GitHub</a
                  >
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  </div>
</nav>
