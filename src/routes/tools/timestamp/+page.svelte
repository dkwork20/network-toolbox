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

  let calcResult = $derived.by(() => {
    let d = new Date(calcStart);
    if (isNaN(d.getTime())) return "Invalid Date";

    const amount = calcOperation === "add" ? calcAmount : -calcAmount;

    switch (calcUnit) {
      case "seconds":
        d.setSeconds(d.getSeconds() + amount);
        break;
      case "minutes":
        d.setMinutes(d.getMinutes() + amount);
        break;
      case "hours":
        d.setHours(d.getHours() + amount);
        break;
      case "days":
        d.setDate(d.getDate() + amount);
        break;
    }
    return {
      iso: d.toISOString(),
      ts: Math.floor(d.getTime() / 1000),
      local: d.toLocaleString(),
    };
  });

  // Duration Converter
  let durationAmount = $state(1);
  let durationUnit = $state("hours");
  let durationResult = $derived.by(() => {
    const msPerUnit: Record<string, number> = {
      milliseconds: 1,
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
      months: 30.44 * 24 * 60 * 60 * 1000, // Average month
      years: 365.25 * 24 * 60 * 60 * 1000, // Average year
    };

    const totalMs = durationAmount * (msPerUnit[durationUnit] || 0);

    // Formatted string
    const dDays = Math.floor(totalMs / msPerUnit.days);
    const dHours = Math.floor((totalMs % msPerUnit.days) / msPerUnit.hours);
    const dMinutes = Math.floor(
      (totalMs % msPerUnit.hours) / msPerUnit.minutes,
    );
    const dSeconds = Math.floor((totalMs % msPerUnit.minutes) / 1000);

    let parts = [];
    if (dDays > 0) parts.push(`${dDays}d`);
    if (dHours > 0) parts.push(`${dHours}h`);
    if (dMinutes > 0) parts.push(`${dMinutes}m`);
    if (dSeconds > 0 || parts.length === 0) parts.push(`${dSeconds}s`);
    if (totalMs < 1000 && totalMs > 0) parts = [`${totalMs}ms`];

    return {
      ms: totalMs,
      seconds: +(totalMs / 1000).toFixed(2),
      minutes: +(totalMs / msPerUnit.minutes).toFixed(4),
      hours: +(totalMs / msPerUnit.hours).toFixed(4),
      days: +(totalMs / msPerUnit.days).toFixed(4),
      weeks: +(totalMs / msPerUnit.weeks).toFixed(4),
      months: +(totalMs / msPerUnit.months).toFixed(6),
      years: +(totalMs / msPerUnit.years).toFixed(6),
      formatted: parts.join(" "),
    };
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
        {#if typeof calcResult === "string"}
          <span class="font-mono text-lg text-error-500">{calcResult}</span>
        {:else}
          <div class="flex flex-col">
            <span
              class="font-bold text-sm text-surface-600 dark:text-surface-400"
              >Result Date:</span
            >
            <span class="font-mono text-lg">{calcResult.local}</span>
            <span class="font-mono text-xs opacity-70">TS: {calcResult.ts}</span
            >
          </div>
          <button
            class="btn-icon btn-icon-sm variant-soft"
            title="Copy Timestamp"
            onclick={() => copy(calcResult.ts.toString())}>📋</button
          >
        {/if}
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

    <!-- Duration Converter -->
    <div
      class="card p-6 flex flex-col gap-4 bg-surface-50 dark:bg-surface-900 border border-surface-500/20 shadow-lg"
    >
      <h3 class="h3 font-bold">Duration Converter</h3>
      <div class="flex flex-col sm:flex-row gap-2 w-full">
        <input
          class="input w-full flex-1 min-w-0"
          type="number"
          bind:value={durationAmount}
          placeholder="Enter amount"
        />
        <select class="select w-full sm:w-48" bind:value={durationUnit}>
          <option value="milliseconds">Milliseconds</option>
          <option value="seconds">Seconds</option>
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
          <option value="weeks">Weeks</option>
          <option value="months">Months (30.44d)</option>
          <option value="years">Years (365.25d)</option>
        </select>
      </div>

      <div class="p-4 bg-surface-200 dark:bg-surface-800 rounded-lg">
        <div
          class="text-sm font-bold text-surface-600 dark:text-surface-400 mb-2"
        >
          Human Readable
        </div>
        <div
          class="text-xl md:text-2xl font-mono font-bold text-primary-500 break-all"
        >
          {durationResult?.formatted || "0s"}
        </div>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs opacity-70 font-mono"
      >
        <div class="flex justify-between border-b border-surface-500/20 pb-1">
          <span>Milliseconds:</span>
          <span>{durationResult?.ms.toLocaleString()}</span>
        </div>
        <div class="flex justify-between border-b border-surface-500/20 pb-1">
          <span>Seconds:</span>
          <span>{durationResult?.seconds.toLocaleString()}</span>
        </div>
        <div class="flex justify-between border-b border-surface-500/20 pb-1">
          <span>Minutes:</span>
          <span>{durationResult?.minutes.toLocaleString()}</span>
        </div>
        <div class="flex justify-between border-b border-surface-500/20 pb-1">
          <span>Hours:</span>
          <span>{durationResult?.hours.toLocaleString()}</span>
        </div>
        <div class="flex justify-between border-b border-surface-500/20 pb-1">
          <span>Days:</span>
          <span>{durationResult?.days.toLocaleString()}</span>
        </div>
        <div class="flex justify-between border-b border-surface-500/20 pb-1">
          <span>Weeks:</span>
          <span>{durationResult?.weeks.toLocaleString()}</span>
        </div>
        <div class="flex justify-between border-b border-surface-500/20 pb-1">
          <span>Months:</span>
          <span>{durationResult?.months.toLocaleString()}</span>
        </div>
        <div class="flex justify-between border-b border-surface-500/20 pb-1">
          <span>Years:</span>
          <span>{durationResult?.years.toLocaleString()}</span>
        </div>
      </div>
    </div>
  </div>
</div>
