<script lang="ts">
  import { toaster } from "$lib/toaster.svelte";
  import { onMount, onDestroy } from "svelte";

  let nowMs = $state(Date.now());
  let interval: any;

  // Converter state
  let inputTimestamp = $state("");
  let inputDate = $state("");

  // Derived: Timestamp -> Date
  let outputDate = $derived.by(() => {
    if (!inputTimestamp) return "";
    let ts = parseInt(inputTimestamp);
    if (isNaN(ts)) return ""; // Handle potential NaN parsing early
    // Guess seconds vs milliseconds
    if (inputTimestamp.length <= 10) {
      ts *= 1000;
    }
    const date = new Date(ts);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    } else {
      return date.toLocaleString();
    }
  });

  // Derived: Date -> Timestamp
  let outputTimestamp = $derived.by(() => {
    if (!inputDate) return "";
    const date = new Date(inputDate);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    } else {
      return Math.floor(date.getTime() / 1000).toString();
    }
  });

  // Duration State
  let diffStart = $state("");
  let diffEnd = $state("");

  // Derived: Duration Result
  let diffResult = $derived.by(() => {
    const d1 = new Date(diffStart);
    const d2 = new Date(diffEnd);
    if (!diffStart || !diffEnd || isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return null;
    }
    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // Breakdown
    const bDays = days;
    const bHours = hours % 24;
    const bMinutes = minutes % 60;
    const bSeconds = seconds % 60;

    return {
      formatted: `${bDays}d ${bHours}h ${bMinutes}m ${bSeconds}s`,
      total: {
        ms: diffMs.toLocaleString(),
        seconds: seconds.toLocaleString(),
        minutes: minutes.toLocaleString(),
        hours: hours.toLocaleString(),
        days: days.toLocaleString(),
        weeks: (days / 7).toFixed(1),
        years: (days / 365.25).toFixed(2),
      },
    };
  });

  // Add/Sub State
  let calcStart = $state("");
  let calcAmount = $state(0);
  let calcUnit = $state("minutes");
  let calcOperation = $state("add");

  // Derived: Calculation Result
  let calcResult = $derived.by(() => {
    const d = new Date(calcStart);
    if (!calcStart || isNaN(d.getTime())) {
      return "Invalid Start Date";
    }

    let ms = calcAmount;
    if (calcUnit === "seconds") ms *= 1000;
    if (calcUnit === "minutes") ms *= 60000;
    if (calcUnit === "hours") ms *= 3600000;
    if (calcUnit === "days") ms *= 86400000;

    const newTime =
      calcOperation === "add" ? d.getTime() + ms : d.getTime() - ms;
    const resDate = new Date(newTime);
    return `${resDate.toLocaleString()} (${Math.floor(newTime / 1000)})`;
  });

  onMount(() => {
    interval = setInterval(() => {
      nowMs = Date.now();
    }, 1000);

    // Init dates to ISO string for datetime-local
    const now = new Date();
    // Offset for local time in ISO string
    const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    diffStart = iso;
    diffEnd = iso;
    calcStart = iso;
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toaster.success({ title: "Copied", description: "Copied to clipboard" });
  }
</script>

<div class="container mx-auto p-4 max-w-4xl pb-20">
  <div class="mb-10 text-center">
    <h2 class="h2 font-bold">Unix Timestamp Converter</h2>
    <div class="mt-4 text-4xl font-mono font-bold text-primary-500">
      {Math.floor(nowMs / 1000)}
    </div>
    <p class="text-sm text-surface-500">Current Unix Timestamp</p>
  </div>

  <!-- Row 1: Basic Conversion -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
    <!-- Timestamp to Date -->
    <div
      class="card p-6 flex flex-col gap-4 bg-surface-50 dark:bg-surface-900 border border-surface-500/20 shadow-lg"
    >
      <h3 class="h3 font-bold">Timestamp &rarr; Date</h3>
      <label class="label">
        <span>Unix Timestamp</span>
        <input
          class="input"
          type="number"
          bind:value={inputTimestamp}
          placeholder="e.g. 1672531200"
        />
      </label>
      <div
        class="p-4 bg-surface-200 dark:bg-surface-800 rounded-md min-h-[60px] flex items-center justify-between"
      >
        <span class="font-mono text-lg">{outputDate || "Result..."}</span>
        {#if outputDate}<button
            class="btn-icon btn-icon-sm variant-soft"
            onclick={() => copy(outputDate)}>📋</button
          >{/if}
      </div>
      <p class="text-xs opacity-60">
        Auto-detects seconds (10 digits) vs milliseconds (13 digits).
      </p>
    </div>

    <!-- Date to Timestamp -->
    <div
      class="card p-6 flex flex-col gap-4 bg-surface-50 dark:bg-surface-900 border border-surface-500/20 shadow-lg"
    >
      <h3 class="h3 font-bold">Date &rarr; Timestamp</h3>
      <label class="label">
        <span>ISO / Human Date</span>
        <input
          class="input"
          type="text"
          bind:value={inputDate}
          placeholder="YYYY-MM-DD HH:mm:ss"
        />
      </label>
      <div
        class="p-4 bg-surface-200 dark:bg-surface-800 rounded-md min-h-[60px] flex items-center justify-between"
      >
        <span class="font-mono text-lg">{outputTimestamp || "Result..."}</span>
        {#if outputTimestamp}<button
            class="btn-icon btn-icon-sm variant-soft"
            onclick={() => copy(outputTimestamp)}>📋</button
          >{/if}
      </div>
      <p class="text-xs opacity-60">Accepts ISO 8601 strings.</p>
    </div>
  </div>

  <!-- Row 2: Advanced Calculations -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <!-- Date Difference -->
    <div
      class="card p-6 flex flex-col gap-4 bg-surface-50 dark:bg-surface-900 border border-surface-500/20 shadow-lg"
    >
      <h3 class="h3 font-bold">Time Difference</h3>
      <div class="flex flex-col sm:flex-row gap-2 w-full">
        <label class="label flex-1 min-w-0">
          <span>Start</span>
          <input
            class="input w-full"
            type="datetime-local"
            bind:value={diffStart}
          />
        </label>
        <label class="label flex-1 min-w-0">
          <span>End</span>
          <input
            class="input w-full"
            type="datetime-local"
            bind:value={diffEnd}
          />
        </label>
      </div>
      <div
        class="p-4 bg-surface-200 dark:bg-surface-800 rounded-md min-h-[60px] flex flex-col justify-center space-y-2"
      >
        {#if !diffResult}
          <span class="font-mono text-lg font-bold">Result...</span>
        {:else if typeof diffResult === "string"}
          <span class="font-mono text-lg font-bold">{diffResult}</span>
        {:else}
          <div class="font-mono text-xl font-bold break-all">
            {diffResult.formatted}
          </div>
          <div
            class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs opacity-70 font-mono"
          >
            <div>Total Seconds:</div>
            <div class="text-right">{diffResult.total.seconds}</div>
            <div>Total Minutes:</div>
            <div class="text-right">{diffResult.total.minutes}</div>
            <div>Total Hours:</div>
            <div class="text-right">{diffResult.total.hours}</div>
            <div>Total Days:</div>
            <div class="text-right">{diffResult.total.days}</div>
            <div>Total Weeks:</div>
            <div class="text-right">{diffResult.total.weeks}</div>
            <div>Total Years:</div>
            <div class="text-right">{diffResult.total.years}</div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Add/Subtract Time -->
    <div
      class="card p-6 flex flex-col gap-4 bg-surface-50 dark:bg-surface-900 border border-surface-500/20 shadow-lg"
    >
      <h3 class="h3 font-bold">Add / Subtract Time</h3>
      <label class="label">
        <span>Start Date</span>
        <input class="input" type="datetime-local" bind:value={calcStart} />
      </label>
      <div class="flex flex-col sm:flex-row gap-2 w-full">
        <select class="select w-full sm:w-24" bind:value={calcOperation}>
          <option value="add">+</option>
          <option value="subtract">-</option>
        </select>
        <input
          class="input w-full flex-1 min-w-0"
          type="number"
          bind:value={calcAmount}
          min="0"
        />
        <select class="select w-full sm:w-32" bind:value={calcUnit}>
          <option value="seconds">Seconds</option>
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
        </select>
      </div>
      <div
        class="p-4 bg-surface-200 dark:bg-surface-800 rounded-md min-h-[60px] flex items-center justify-between"
      >
        <span class="font-mono text-lg">{calcResult || "Result..."}</span>
        {#if calcResult}<button
            class="btn-icon btn-icon-sm variant-soft"
            onclick={() => copy(calcResult)}>📋</button
          >{/if}
      </div>
    </div>
  </div>

  <!-- Cheatsheet -->
  <div
    class="mt-10 card p-6 bg-surface-50 dark:bg-surface-900 border border-surface-500/20"
  >
    <h3 class="h3 font-bold mb-4">Common Timestamps</h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono">
      <div>
        <div class="opacity-60">1 Hour Ago</div>
        <div>{Math.floor(Date.now() / 1000) - 3600}</div>
      </div>
      <div>
        <div class="opacity-60">1 Day Ago</div>
        <div>{Math.floor(Date.now() / 1000) - 86400}</div>
      </div>
      <div>
        <div class="opacity-60">Start of Year</div>
        <div>
          {Math.floor(
            new Date(new Date().getFullYear(), 0, 1).getTime() / 1000,
          )}
        </div>
      </div>
      <div>
        <div class="opacity-60">Y2K38 Problem</div>
        <div>2147483647</div>
      </div>
    </div>
  </div>
</div>
