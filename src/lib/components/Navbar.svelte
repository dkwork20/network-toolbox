<script lang="ts">
  import { Moon, Sun } from "@lucide/svelte";
  import { onMount } from "svelte";

  // Simple logic for dark mode toggling using tailwind 'dark' class on html
  // SvelteKit usually runs on server, so we need to handle hydration.
  // For MVP, we toggle class on documentElement.

  let isDark = $state(true); // Default to dark? Check app.html or user system.

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
</script>

<nav
  class="p-4 flex justify-between items-center border-b border-surface-500/30 bg-surface-50-900 shadow-md sticky top-0 z-50 backdrop-blur-sm"
>
  <div class="flex items-center gap-6">
    <a
      href="/"
      class="font-bold text-xl tracking-tight bg-linear-to-br from-primary-500 to-secondary-500 bg-clip-text text-transparent decoration-none"
    >
      WireGuard Helper
    </a>

    <div class="hidden md:flex items-center gap-4 text-sm font-medium">
      <a href="/" class="hover:text-primary-500 transition-colors">Calculator</a
      >
      <a href="/tools/subnet" class="hover:text-primary-500 transition-colors"
        >Subnet</a
      >
      <a
        href="/tools/sanitizer"
        class="hover:text-primary-500 transition-colors">Sanitizer</a
      >
      <a
        href="/tools/diagnostics"
        class="hover:text-primary-500 transition-colors">Diagnostics</a
      >
      <a href="/tools/jwt" class="hover:text-primary-500 transition-colors"
        >JWT</a
      >
      <a href="/tools/cert" class="hover:text-primary-500 transition-colors"
        >Cert</a
      >
    </div>
  </div>

  <div class="flex items-center gap-4">
    <a
      href="https://github.com/skeletonlabs/skeleton"
      target="_blank"
      rel="noreferrer"
      class="text-sm font-medium hover:text-primary-500 transition-colors"
    >
      GitHub
    </a>

    <button
      class="btn-icon btn-icon-sm variant-ghost-surface"
      onclick={toggleTheme}
      aria-label="Toggle Dark Mode"
    >
      {#if isDark}
        <Moon class="size-5" />
      {:else}
        <Sun class="size-5" />
      {/if}
    </button>
  </div>
</nav>
