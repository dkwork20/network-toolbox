<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { Toast } from "@skeletonlabs/skeleton-svelte";
  import { toaster } from "$lib/toaster.svelte";
  import Navbar from "$lib/components/Navbar.svelte";
  import Footer from "$lib/components/Footer.svelte";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <script>
    (() => {
      const storedTheme = localStorage.getItem("theme");
      const hasValidStoredTheme =
        storedTheme === "light" || storedTheme === "dark";
      const shouldUseDarkTheme =
        storedTheme === "dark" ||
        (!hasValidStoredTheme &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      document.documentElement.classList.toggle("dark", shouldUseDarkTheme);
    })();
  </script>
</svelte:head>

<div class="min-h-screen flex flex-col">
  <Navbar />

  <main class="flex-1 container mx-auto pt-4 flex flex-col">
    {@render children()}
  </main>

  <Footer />
</div>

<Toast.Group {toaster}>
  {#snippet children(toast)}
    <Toast {toast}>
      <Toast.Message>
        <Toast.Title>{toast.title}</Toast.Title>
        <Toast.Description>{toast.description}</Toast.Description>
      </Toast.Message>
      <Toast.CloseTrigger />
    </Toast>
  {/snippet}
</Toast.Group>
