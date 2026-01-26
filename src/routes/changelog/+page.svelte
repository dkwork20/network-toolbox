<script lang="ts">
  import { changelog } from "$lib/data/changelog";

  const TYPE_COLORS = {
    feat: "variant-filled-tertiary",
    fix: "variant-filled-error",
    chore: "variant-filled-surface",
    docs: "variant-filled-secondary",
  };
</script>

<div class="container mx-auto p-4 max-w-4xl pb-20">
  <div class="mb-10 text-center">
    <h1
      class="h1 font-bold bg-linear-to-br from-primary-500 to-secondary-500 bg-clip-text text-transparent box-decoration-clone"
    >
      Changelog
    </h1>
    <p class="mt-2 text-surface-500">
      Tracking the evolution of the NetOps Swiss Army Knife
    </p>
  </div>

  <!-- Timeline Container -->
  <div
    class="relative border-l-2 border-surface-500/30 ml-4 md:ml-10 space-y-12"
  >
    {#each changelog as entry}
      <div class="relative pl-8 md:pl-12">
        <!-- Dot -->
        <div
          class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary-500 ring-4 ring-surface-100 dark:ring-surface-900"
        ></div>

        <!-- Content -->
        <div class="flex flex-col gap-2">
          <div
            class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2"
          >
            <span class="text-2xl font-bold">{entry.version}</span>
            <span class="badge variant-soft-surface">{entry.date}</span>
          </div>

          <h3
            class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-2"
          >
            {entry.title}
          </h3>

          <ul class="space-y-3">
            {#each entry.changes as change}
              <li class="flex items-start gap-3">
                <span
                  class="badge shrink-0 {TYPE_COLORS[
                    change.type
                  ]} text-xs uppercase w-16 justify-center"
                >
                  {change.type}
                </span>
                <span class="text-surface-700 dark:text-surface-300">
                  {change.text}
                </span>
              </li>
            {/each}
          </ul>
        </div>
      </div>
    {/each}
  </div>
</div>
