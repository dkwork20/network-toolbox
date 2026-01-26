<script lang="ts">
  import { toaster } from "$lib/toaster.svelte";
  import { CronExpressionParser } from "cron-parser";
  import cronstrue from "cronstrue";
  import { fade } from "svelte/transition";
  import clsx from "clsx";

  let cronExpression = $state("* * * * *");
  let parts = $state(["*", "*", "*", "*", "*"]);
  let activeIndex = $state(0); // 0: min, 1: hour, 2: dom, 3: month, 4: dow
  let description = $state("");
  let nextRuns: string[] = $state([]);
  let error = $state("");

  const SEGMENTS = [
    { name: "Minute", min: 0, max: 59, desc: "0-59" },
    { name: "Hour", min: 0, max: 23, desc: "0-23" },
    { name: "Day of Month", min: 1, max: 31, desc: "1-31" },
    { name: "Month", min: 1, max: 12, desc: "1-12 or JAN-DEC" },
    { name: "Day of Week", min: 0, max: 6, desc: "0-6 (Sun-Sat)" },
  ];

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

    const expr = parts.join(" ");
    cronExpression = expr;

    if (!expr.trim()) return;

    try {
      // Human readable description
      try {
        description = cronstrue.toString(expr);
      } catch (e) {
        description = "Invalid expression format";
      }

      // Next 5 runs
      const interval = CronExpressionParser.parse(expr);
      const runs = [];
      for (let i = 0; i < 5; i++) {
        runs.push(interval.next().toString());
      }
      nextRuns = runs;
    } catch (e: any) {
      error = "Invalid: " + e.message;
    }
  }

  // Reactive update when parts change
  $effect(() => {
    // Check if parts actually changed to avoid cycles if we were syncing back
    // but here we drive from parts -> expression mostly
    parseCron();
  });

  function applyPreset(cron: string) {
    const p = cron.split(" ");
    if (p.length === 5) {
      parts = p;
      activeIndex = 0;
    }
  }

  function handleInput(index: number, value: string) {
    parts[index] = value;
  }
</script>

<div class="container mx-auto p-4 max-w-4xl pb-20">
  <div class="mb-10 text-center">
    <h2 class="h2 font-bold">Cron Schedule Generator</h2>
    <p class="mt-2 text-surface-500">Interactive editor for cron expressions</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Presets -->
    <div class="space-y-4">
      <h3 class="h3 font-bold">Presets</h3>
      <div class="flex flex-col gap-2">
        {#each presets as preset}
          <button
            class="btn variant-soft-surface justify-start text-sm hover:variant-filled-primary transition-all"
            onclick={() => applyPreset(preset.cron)}
          >
            <span class="font-mono mr-2 opacity-70">[{preset.cron}]</span>
            {preset.label}
          </button>
        {/each}
      </div>
    </div>

    <!-- Edit Area -->
    <div class="lg:col-span-2 space-y-8">
      <!-- Display & Interactive Inputs -->
      <div
        class="card p-8 bg-surface-900 text-white shadow-xl border border-surface-700"
      >
        <div class="flex flex-col items-center gap-6">
          <!-- The 5 Inputs -->
          <div
            class="flex items-center gap-2 md:gap-4 text-2xl md:text-4xl font-mono font-bold"
          >
            {#each parts as part, i}
              <div class="relative group">
                <input
                  type="text"
                  value={parts[i]}
                  oninput={(e) => handleInput(i, e.currentTarget.value)}
                  onfocus={() => (activeIndex = i)}
                  class={clsx(
                    "bg-transparent border-none text-center w-16 md:w-24 p-0 focus:ring-0 focus:outline-none transition-colors",
                    activeIndex === i
                      ? "text-primary-400"
                      : "text-white hover:text-surface-300",
                  )}
                />
                <!-- Label below input -->
                <div
                  class={clsx(
                    "absolute -bottom-6 left-0 right-0 text-center text-xs font-sans font-normal uppercase tracking-wider transition-opacity duration-200",
                    activeIndex === i
                      ? "opacity-100 text-primary-400"
                      : "opacity-0",
                  )}
                >
                  {SEGMENTS[i].name}
                </div>
              </div>
            {/each}
          </div>

          <!-- Description Readout -->
          <div class="min-h-12 text-center">
            {#if error}
              <div class="text-error-500 font-bold animate-pulse">{error}</div>
            {:else}
              <div class="text-lg md:text-xl font-medium opacity-90">
                {description}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Help / Context Table -->
      <div
        class="card p-6 bg-surface-50 dark:bg-surface-900 border border-surface-500/10"
      >
        <div
          class="flex items-center justify-between mb-4 border-b border-surface-500/10 pb-2"
        >
          <h3 class="h3 font-bold text-primary-500">
            {SEGMENTS[activeIndex].name}
          </h3>
          <span class="badge variant-soft-surface">
            Allowed: {SEGMENTS[activeIndex].desc}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div class="space-y-2">
            <div class="flex gap-2">
              <span
                class="font-mono font-bold w-8 text-center bg-surface-200 dark:bg-surface-700 rounded"
                >*</span
              >
              <span>Any value</span>
            </div>
            <div class="flex gap-2">
              <span
                class="font-mono font-bold w-8 text-center bg-surface-200 dark:bg-surface-700 rounded"
                >,</span
              >
              <span>Value list separator</span>
            </div>
            <div class="flex gap-2">
              <span
                class="font-mono font-bold w-8 text-center bg-surface-200 dark:bg-surface-700 rounded"
                >-</span
              >
              <span>Range of values</span>
            </div>
            <div class="flex gap-2">
              <span
                class="font-mono font-bold w-8 text-center bg-surface-200 dark:bg-surface-700 rounded"
                >/</span
              >
              <span>Step values</span>
            </div>
          </div>

          <div class="text-surface-500">
            <p>
              Current value: <code class="code">{parts[activeIndex]}</code>
            </p>
            <p class="mt-2 text-xs">
              Tip: Use <code class="code">*/n</code> for "every n".
            </p>
          </div>
        </div>
      </div>

      <!-- Next Runs -->
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
