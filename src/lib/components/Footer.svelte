<script lang="ts">
  const currentYear = new Date().getFullYear();
</script>

<footer class="border-t border-surface-500/30 bg-surface-50-900 p-6 mt-auto">
  <div
    class="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-surface-500"
  >
    <div class="flex flex-col md:flex-row items-center gap-2">
      <span class="font-bold text-surface-900 dark:text-surface-100"
        >WireGuard Helper</span
      >
      <span class="hidden md:inline">•</span>
      <span>© {currentYear} Open Source</span>
    </div>

    <div class="flex items-center gap-6">
      <a href="/changelog" class="hover:text-primary-500 transition-colors"
        >Changelog</a
      >
      <a
        href="https://github.com/skeletonlabs/skeleton"
        target="_blank"
        rel="noreferrer"
        class="hover:text-primary-500 transition-colors">GitHub</a
      >
      <a
        href="https://wireguard.com"
        target="_blank"
        rel="noreferrer"
        class="hover:text-primary-500 transition-colors">WireGuard®</a
      >
    </div>
  </div>
</footer>
