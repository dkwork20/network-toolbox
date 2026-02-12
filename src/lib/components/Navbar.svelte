<script lang="ts">
  import { Moon, Sun, Menu, X, ChevronDown } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { Dialog, DropdownMenu } from "bits-ui";
  import { page } from "$app/stores";

  // Simple logic for dark mode toggling using tailwind 'dark' class on html
  // SvelteKit usually runs on server, so we need to handle hydration.
  // For MVP, we toggle class on documentElement.

  let isDark = $state(true); // Default to dark? Check app.html or user system.
  let isMobileMenuOpen = $state(false);

  function toggleTheme() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  // Sync with system or existing class on mount
  onMount(() => {
    if (document.documentElement.classList.contains("dark")) {
      isDark = true;
    } else {
      // Check system preference if no class set
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        isDark = true;
        document.documentElement.classList.add("dark");
      } else {
        isDark = false;
      }
    }
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
        <!-- Network Tools Dropdown -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="btn-sm variant-ghost-surface hover:variant-soft-primary transition-colors rounded-md py-2 px-3 flex items-center gap-1 group"
          >
            Network
            <ChevronDown
              class="size-3 opacity-50 group-hover:opacity-100 transition-opacity"
            />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              class="z-50 min-w-[200px] bg-surface-100 dark:bg-surface-900 rounded-lg shadow-xl border border-surface-500/10 p-2 outline-none animate-in fade-in zoom-in-95 duration-100"
            >
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/ip"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >IP Calculator</a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/subnet"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Subnet Visualizer</a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/dns"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >DNS Lookup</a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/diagnostics"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Diagnostics</a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/mac"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >MAC Lookup <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/port"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Port Scanner <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/ping"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Ping Monitor <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/headers"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >HTTP Headers <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/ssl"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >SSL Checker <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/whois"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Whois Lookup <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/speed"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Speed Test <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <div class="h-4 w-px bg-surface-500/20 mx-1"></div>

        <!-- Encoding & Data Dropdown -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="btn-sm variant-ghost-surface hover:variant-soft-primary transition-colors rounded-md py-2 px-3 flex items-center gap-1 group"
          >
            Encoding
            <ChevronDown
              class="size-3 opacity-50 group-hover:opacity-100 transition-opacity"
            />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              class="z-50 min-w-[200px] bg-surface-100 dark:bg-surface-900 rounded-lg shadow-xl border border-surface-500/10 p-2 outline-none animate-in fade-in zoom-in-95 duration-100"
            >
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/uuid"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >UUID Generator <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/hash"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Hash Calculator <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/base64"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Base64 Encoder <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/url"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >URL Encoder <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/json"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >JSON Formatter <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/color"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Color Picker <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/qr"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >QR Generator <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <div class="h-4 w-px bg-surface-500/20 mx-1"></div>

        <!-- Security Dropdown -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="btn-sm variant-ghost-surface hover:variant-soft-primary transition-colors rounded-md py-2 px-3 flex items-center gap-1 group"
          >
            Security
            <ChevronDown
              class="size-3 opacity-50 group-hover:opacity-100 transition-opacity"
            />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              class="z-50 min-w-[200px] bg-surface-100 dark:bg-surface-900 rounded-lg shadow-xl border border-surface-500/10 p-2 outline-none animate-in fade-in zoom-in-95 duration-100"
            >
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/password"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Password Generator <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/bcrypt"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Bcrypt Hash <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/sanitizer"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Log Sanitizer</a
                >
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <div class="h-4 w-px bg-surface-500/20 mx-1"></div>

        <!-- Dev Tools Dropdown -->
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="btn-sm variant-ghost-surface hover:variant-soft-primary transition-colors rounded-md py-2 px-3 flex items-center gap-1 group"
          >
            Developer
            <ChevronDown
              class="size-3 opacity-50 group-hover:opacity-100 transition-opacity"
            />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              class="z-50 min-w-[200px] bg-surface-100 dark:bg-surface-900 rounded-lg shadow-xl border border-surface-500/10 p-2 outline-none animate-in fade-in zoom-in-95 duration-100"
            >
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/jwt"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >JWT Debugger</a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/cert"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Cert Decoder</a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/converter"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Converter</a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/timestamp"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Timestamp</a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/cron"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Cron Generator</a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/regex"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Regex Tester <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/diff"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Diff Viewer <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/markdown"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Markdown Preview <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
              <DropdownMenu.Item
                class="rounded-md hover:bg-surface-200 dark:hover:bg-surface-800 outline-none transition-colors"
              >
                <a
                  href="/tools/docker"
                  class="flex items-center px-3 py-2 w-full h-full text-sm"
                  >Docker Compose <span class="text-error-500 font-bold">**</span></a
                >
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Desktop About/Github -->
      <div class="hidden md:flex items-center gap-3">
        <a
          href="/changelog"
          class="text-sm font-medium text-surface-500 hover:text-primary-500 transition-colors"
          >About</a
        >
        <a
          href="https://github.com/skeletonlabs/skeleton"
          target="_blank"
          rel="noreferrer"
          class="text-sm font-medium text-surface-500 hover:text-primary-500 transition-colors"
        >
          GitHub
        </a>
        <div class="h-4 w-px bg-surface-500/20"></div>
      </div>

      <button
        class="btn-icon btn-icon-sm variant-ringed-surface hover:variant-soft-primary transition-all"
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
          <Dialog.Trigger class="btn-icon btn-icon-sm variant-filled-surface">
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
                  class="btn-icon btn-icon-sm variant-ghost-surface"
                >
                  <X class="size-5" />
                </Dialog.Close>
              </div>

              <!-- Mobile Content -->
              <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                <div class="flex flex-col gap-1">
                  <span
                    class="text-xs font-bold uppercase text-surface-500 tracking-wider mb-2"
                    >Network</span
                  >
                  <a
                    href="/tools/ip"
                    class="btn variant-ghost-surface justify-start"
                    >IP Calculator</a
                  >
                  <a
                    href="/tools/subnet"
                    class="btn variant-ghost-surface justify-start"
                    >Subnet Visualizer</a
                  >
                  <a
                    href="/tools/dns"
                    class="btn variant-ghost-surface justify-start"
                    >DNS Lookup</a
                  >
                  <a
                    href="/tools/diagnostics"
                    class="btn variant-ghost-surface justify-start"
                    >Diagnostics</a
                  >
                  <a
                    href="/tools/mac"
                    class="btn variant-ghost-surface justify-start"
                    >MAC Lookup <span class="text-error-500 font-bold">**</span></a
                  >
                </div>

                <div class="flex flex-col gap-1">
                  <span
                    class="text-xs font-bold uppercase text-surface-500 tracking-wider mb-2"
                    >Encoding & Data</span
                  >
                  <a
                    href="/tools/uuid"
                    class="btn variant-ghost-surface justify-start"
                    >UUID Generator <span class="text-error-500 font-bold">**</span></a
                  >
                  <a
                    href="/tools/hash"
                    class="btn variant-ghost-surface justify-start"
                    >Hash Calculator <span class="text-error-500 font-bold">**</span></a
                  >
                  <a
                    href="/tools/base64"
                    class="btn variant-ghost-surface justify-start"
                    >Base64 Encoder <span class="text-error-500 font-bold">**</span></a
                  >
                  <a
                    href="/tools/url"
                    class="btn variant-ghost-surface justify-start"
                    >URL Encoder <span class="text-error-500 font-bold">**</span></a
                  >
                  <a
                    href="/tools/json"
                    class="btn variant-ghost-surface justify-start"
                    >JSON Formatter <span class="text-error-500 font-bold">**</span></a
                  >
                  <a
                    href="/tools/color"
                    class="btn variant-ghost-surface justify-start"
                    >Color Picker <span class="text-error-500 font-bold">**</span></a
                  >
                  <a
                    href="/tools/qr"
                    class="btn variant-ghost-surface justify-start"
                    >QR Generator <span class="text-error-500 font-bold">**</span></a
                  >
                </div>

                <div class="flex flex-col gap-1">
                  <span
                    class="text-xs font-bold uppercase text-surface-500 tracking-wider mb-2"
                    >Security</span
                  >
                  <a
                    href="/tools/password"
                    class="btn variant-ghost-surface justify-start"
                    >Password Generator <span class="text-error-500 font-bold">**</span></a
                  >
                  <a
                    href="/tools/sanitizer"
                    class="btn variant-ghost-surface justify-start"
                    >Log Sanitizer</a
                  >
                </div>

                <div class="flex flex-col gap-1">
                  <span
                    class="text-xs font-bold uppercase text-surface-500 tracking-wider mb-2"
                    >Developer</span
                  >
                  <a
                    href="/tools/jwt"
                    class="btn variant-ghost-surface justify-start"
                    >JWT Debugger</a
                  >
                  <a
                    href="/tools/cert"
                    class="btn variant-ghost-surface justify-start"
                    >Cert Decoder</a
                  >
                  <a
                    href="/tools/converter"
                    class="btn variant-ghost-surface justify-start">Converter</a
                  >
                  <a
                    href="/tools/timestamp"
                    class="btn variant-ghost-surface justify-start">Timestamp</a
                  >
                  <a
                    href="/tools/cron"
                    class="btn variant-ghost-surface justify-start"
                    >Cron Generator</a
                  >
                  <a
                    href="/tools/regex"
                    class="btn variant-ghost-surface justify-start"
                    >Regex Tester <span class="text-error-500 font-bold">**</span></a
                  >
                  <a
                    href="/tools/diff"
                    class="btn variant-ghost-surface justify-start"
                    >Diff Viewer <span class="text-error-500 font-bold">**</span></a
                  >
                </div>

                <hr class="border-surface-500/10" />

                <div class="flex flex-col gap-2">
                  <a
                    href="/changelog"
                    class="btn variant-ghost-surface justify-start text-surface-500"
                    >Changelog</a
                  >
                  <a
                    href="https://github.com/skeletonlabs/skeleton"
                    target="_blank"
                    rel="noreferrer"
                    class="btn variant-ghost-surface justify-start text-surface-500"
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