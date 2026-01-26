<script lang="ts">
  import { toaster } from "$lib/toaster.svelte";
  import { CronExpressionParser } from "cron-parser";
  import cronstrue from "cronstrue";

  let cronExpression = $state("*/5 * * * *");
  let description = $state("");
  let nextRuns: string[] = $state([]);
  let error = $state("");

  // Presets
  const presets = [
    { label: "Every Minute", cron: "* * * * *" },
    { label: "Every 5 Minutes", cron: "*/5 * * * *" },
    { label: "Every Hour", cron: "0 * * * *" },
    { label: "Every Day at Midnight", cron: "0 0 * * *" },
    { label: "Weekly (Sunday)", cron: "0 0 * * 0" },
    { label: "Monthly (1st)", cron: "0 0 1 * *" },
  ];

  function parseCron() {
    error = "";
    nextRuns = [];
    description = "";

    if (!cronExpression.trim()) return;

    try {
      // Human readable description
      try {
        description = cronstrue.toString(cronExpression);
      } catch (e) {
        description = "Invalid expression format";
      }

      // Next 5 runs
      const interval = CronExpressionParser.parse(cronExpression);
      const runs = [];
      for (let i = 0; i < 5; i++) {
        runs.push(interval.next().toString());
      }
      nextRuns = runs;
    } catch (e: any) {
      error = "Invalid Cron Expression: " + e.message;
    }
  }

  $effect(() => {
    parseCron();
  });

  function applyPreset(cron: string) {
    cronExpression = cron;
  }
</script>

<div class="container mx-auto p-4 max-w-4xl pb-20">
  <div class="mb-10 text-center">
    <h2 class="h2 font-bold">Cron Schedule Generator</h2>
    <p class="mt-2 text-surface-500">
      Parse cron expressions and preview future run times
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <!-- Presets -->
    <div class="space-y-4">
      <h3 class="h3 font-bold">Presets</h3>
      <div class="flex flex-col gap-2">
        {#each presets as preset}
          <button
            class="btn variant-soft-surface justify-start text-sm"
            onclick={() => applyPreset(preset.cron)}
          >
            <span class="font-bold mr-2 opacity-70">[{preset.cron}]</span>
            {preset.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Main Tool -->
    <div class="md:col-span-2 space-y-6">
      <div
        class="card p-6 space-y-4 bg-surface-50 dark:bg-surface-900 shadow-lg border border-surface-500/10"
      >
        <label class="label">
          <span class="font-bold">Cron Expression</span>
          <input
            class="input font-mono text-lg p-3 {error ? 'input-error' : ''}"
            type="text"
            bind:value={cronExpression}
            placeholder="* * * * *"
          />
        </label>

        {#if error}
          <div class="alert variant-filled-error p-3 text-sm">
            {error}
          </div>
        {:else if description}
          <div class="alert variant-soft-success p-4 rounded-lg">
            <span class="font-bold text-lg">"{description}"</span>
          </div>
        {/if}
      </div>

      {#if nextRuns.length > 0}
        <div
          class="card p-6 bg-surface-50 dark:bg-surface-900 border border-surface-500/10"
        >
          <h3 class="h3 font-bold mb-4">Next 5 Occurrences</h3>
          <ul class="space-y-2 font-mono text-sm leading-relaxed">
            {#each nextRuns as run}
              <li class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-primary-500"></span>
                {run}
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  </div>
</div>
