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
		// Fix: If timestamp < 10 billion (10 digits), treat as seconds; otherwise milliseconds
		// 10-digit timestamps like 1517486401 (Jan 1, 2018) are seconds
		// 13-digit timestamps are milliseconds
		if (ts < 10000000000) {
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

	// Add/Sub State - Multiple time groups
	interface TimeGroup {
		id: number;
		operation: string;
		amount: number;
		unit: string;
	}

	let calcStart = $state("");
	let timeGroups = $state<TimeGroup[]>([
		{ id: 1, operation: "add", amount: 0, unit: "minutes" },
	]);

	function addTimeGroup() {
		timeGroups = [
			...timeGroups,
			{ id: Date.now(), operation: "add", amount: 0, unit: "minutes" },
		];
	}

	function removeTimeGroup(id: number) {
		timeGroups = timeGroups.filter((g) => g.id !== id);
	}

	let calcResult = $derived.by(() => {
		let d = new Date(calcStart);
		if (isNaN(d.getTime())) return "Invalid Date";

		// Apply all time groups
		for (const group of timeGroups) {
			const amount = group.operation === "add" ? group.amount : -group.amount;

			switch (group.unit) {
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
				case "weeks":
					d.setDate(d.getDate() + amount * 7);
					break;
				case "months":
					d.setMonth(d.getMonth() + amount);
					break;
				case "years":
					d.setFullYear(d.getFullYear() + amount);
					break;
			}
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

	// Duration Builder - Independent Calculation Mode
	let builderYears = $state(0);
	let builderMonths = $state(0);
	let builderWeeks = $state(0);
	let builderDays = $state(0);
	let builderHours = $state(0);
	let builderMinutes = $state(0);
	let builderSeconds = $state(0);
	let builderMilliseconds = $state(0);

	// Constants for calculations
	const MS_PER_SECOND = 1000;
	const MS_PER_MINUTE = 60 * MS_PER_SECOND;
	const MS_PER_HOUR = 60 * MS_PER_MINUTE;
	const MS_PER_DAY = 24 * MS_PER_HOUR;
	const MS_PER_WEEK = 7 * MS_PER_DAY;
	const MS_PER_MONTH = 30.44 * MS_PER_DAY; // Average days per month
	const MS_PER_YEAR = 365.25 * MS_PER_DAY; // Average days per year

	let durationBuilder = $derived.by(() => {
		// Calculate total milliseconds from all inputs
		const totalMs =
			builderMilliseconds * 1 +
			builderSeconds * MS_PER_SECOND +
			builderMinutes * MS_PER_MINUTE +
			builderHours * MS_PER_HOUR +
			builderDays * MS_PER_DAY +
			builderWeeks * MS_PER_WEEK +
			builderMonths * MS_PER_MONTH +
			builderYears * MS_PER_YEAR;

		// Human readable format
		const parts: string[] = [];
		if (builderYears > 0) parts.push(`${builderYears}y`);
		if (builderMonths > 0) parts.push(`${builderMonths}mo`);
		if (builderWeeks > 0) parts.push(`${builderWeeks}w`);
		if (builderDays > 0) parts.push(`${builderDays}d`);
		if (builderHours > 0) parts.push(`${builderHours}h`);
		if (builderMinutes > 0) parts.push(`${builderMinutes}m`);
		if (builderSeconds > 0) parts.push(`${builderSeconds}s`);
		if (builderMilliseconds > 0) parts.push(`${builderMilliseconds}ms`);
		if (parts.length === 0) parts.push("0ms");
		const humanReadable = parts.join(" ");

		// Individual breakdown
		const totalSeconds = totalMs / MS_PER_SECOND;
		const totalMinutes = totalMs / MS_PER_MINUTE;
		const totalHours = totalMs / MS_PER_HOUR;
		const totalDays = totalMs / MS_PER_DAY;
		const totalWeeks = totalMs / MS_PER_WEEK;
		const totalMonths = totalMs / MS_PER_MONTH;
		const totalYears = totalMs / MS_PER_YEAR;

		// Target date (from now)
		const targetDate = new Date(Date.now() + totalMs);

		return {
			totalMs,
			humanReadable,
			breakdown: {
				ms: totalMs.toLocaleString(),
				seconds: totalSeconds.toLocaleString(undefined, {
					maximumFractionDigits: 2,
				}),
				minutes: totalMinutes.toLocaleString(undefined, {
					maximumFractionDigits: 4,
				}),
				hours: totalHours.toLocaleString(undefined, {
					maximumFractionDigits: 4,
				}),
				days: totalDays.toLocaleString(undefined, { maximumFractionDigits: 4 }),
				weeks: totalWeeks.toLocaleString(undefined, {
					maximumFractionDigits: 4,
				}),
				months: totalMonths.toLocaleString(undefined, {
					maximumFractionDigits: 4,
				}),
				years: totalYears.toLocaleString(undefined, {
					maximumFractionDigits: 4,
				}),
			},
			targetDate: {
				iso: targetDate.toISOString(),
				local: targetDate.toLocaleString(),
				timestamp: Math.floor(targetDate.getTime() / 1000),
			},
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
		<div class="flex justify-center items-center gap-3">
			<h2 class="h2 font-bold">Unix Timestamp Converter</h2>
			<span class="badge preset-filled-secondary-500 text-xs">V0.4</span>
		</div>
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
						class="btn-icon btn-icon-sm preset-tonal"
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
						class="btn-icon btn-icon-sm preset-tonal"
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

			<!-- Time Groups -->
			{#each timeGroups as group (group.id)}
				<div class="flex flex-col sm:flex-row gap-2 w-full items-center">
					<select class="select w-full sm:w-24" bind:value={group.operation}>
						<option value="add">+</option>
						<option value="subtract">-</option>
					</select>
					<input
						class="input w-full flex-1 min-w-0"
						type="number"
						bind:value={group.amount}
						min="0"
					/>
					<select class="select w-full sm:w-32" bind:value={group.unit}>
						<option value="seconds">Seconds</option>
						<option value="minutes">Minutes</option>
						<option value="hours">Hours</option>
						<option value="days">Days</option>
						<option value="weeks">Weeks</option>
						<option value="months">Months</option>
						<option value="years">Years</option>
					</select>
					{#if timeGroups.length > 1}
						<button
							class="btn-icon btn-icon-sm preset-tonal-error"
							title="Remove"
							onclick={() => removeTimeGroup(group.id)}>✕</button
						>
					{/if}
				</div>
			{/each}

			<button class="btn preset-tonal-secondary w-fit" onclick={addTimeGroup}>
				+ Add another time group
			</button>

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
						class="btn-icon btn-icon-sm preset-tonal"
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

		<!-- Duration Converter (merged into Duration Builder) -->

		<!-- Duration Builder -->
		<div
			class="mt-8 card p-6 flex flex-col gap-4 bg-surface-50 dark:bg-surface-900 border border-surface-500/20 shadow-lg"
		>
			<h3 class="h3 font-bold">Duration Builder</h3>
			<p class="text-sm opacity-70">
				Build a custom duration by entering values for multiple time units
				simultaneously. Or convert a single unit to all others.
			</p>

			<!-- Quick Convert -->
			<div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg mb-4">
				<div
					class="text-sm font-bold text-surface-600 dark:text-surface-400 mb-2"
				>
					Quick Convert
				</div>
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
				<div class="mt-2 text-sm font-mono text-primary-500 font-bold">
					{durationResult?.formatted || "0s"}
				</div>
			</div>

			<!-- Input Fields -->
			<div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
				<label class="label flex flex-col items-center">
					<span class="text-xs opacity-70 mb-1">Years</span>
					<input
						class="input text-center"
						type="number"
						bind:value={builderYears}
						min="0"
						placeholder="0"
					/>
				</label>
				<label class="label flex flex-col items-center">
					<span class="text-xs opacity-70 mb-1">Months</span>
					<input
						class="input text-center"
						type="number"
						bind:value={builderMonths}
						min="0"
						placeholder="0"
					/>
				</label>
				<label class="label flex flex-col items-center">
					<span class="text-xs opacity-70 mb-1">Weeks</span>
					<input
						class="input text-center"
						type="number"
						bind:value={builderWeeks}
						min="0"
						placeholder="0"
					/>
				</label>
				<label class="label flex flex-col items-center">
					<span class="text-xs opacity-70 mb-1">Days</span>
					<input
						class="input text-center"
						type="number"
						bind:value={builderDays}
						min="0"
						placeholder="0"
					/>
				</label>
				<label class="label flex flex-col items-center">
					<span class="text-xs opacity-70 mb-1">Hours</span>
					<input
						class="input text-center"
						type="number"
						bind:value={builderHours}
						min="0"
						placeholder="0"
					/>
				</label>
				<label class="label flex flex-col items-center">
					<span class="text-xs opacity-70 mb-1">Minutes</span>
					<input
						class="input text-center"
						type="number"
						bind:value={builderMinutes}
						min="0"
						placeholder="0"
					/>
				</label>
				<label class="label flex flex-col items-center">
					<span class="text-xs opacity-70 mb-1">Seconds</span>
					<input
						class="input text-center"
						type="number"
						bind:value={builderSeconds}
						min="0"
						placeholder="0"
					/>
				</label>
				<label class="label flex flex-col items-center">
					<span class="text-xs opacity-70 mb-1">Milliseconds</span>
					<input
						class="input text-center"
						type="number"
						bind:value={builderMilliseconds}
						min="0"
						placeholder="0"
					/>
				</label>
			</div>

			<!-- Human Readable Output -->
			<div class="p-4 bg-surface-200 dark:bg-surface-800 rounded-lg">
				<div
					class="text-sm font-bold text-surface-600 dark:text-surface-400 mb-2"
				>
					Human Readable
				</div>
				<div
					class="text-xl md:text-2xl font-mono font-bold text-primary-500 break-all"
				>
					{durationBuilder.humanReadable}
				</div>
			</div>

			<!-- Individual Breakdown -->
			<div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
				<div
					class="text-sm font-bold text-surface-600 dark:text-surface-400 mb-2"
				>
					Breakdown
				</div>

				<!-- Original table style -->
				<div
					class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs opacity-70 font-mono"
				>
					<div class="flex justify-between border-b border-surface-500/20 pb-1">
						<span>Milliseconds:</span>
						<span>{durationBuilder.breakdown.ms}</span>
					</div>
					<div class="flex justify-between border-b border-surface-500/20 pb-1">
						<span>Seconds:</span>
						<span>{durationBuilder.breakdown.seconds}</span>
					</div>
					<div class="flex justify-between border-b border-surface-500/20 pb-1">
						<span>Minutes:</span>
						<span>{durationBuilder.breakdown.minutes}</span>
					</div>
					<div class="flex justify-between border-b border-surface-500/20 pb-1">
						<span>Hours:</span>
						<span>{durationBuilder.breakdown.hours}</span>
					</div>
					<div class="flex justify-between border-b border-surface-500/20 pb-1">
						<span>Days:</span>
						<span>{durationBuilder.breakdown.days}</span>
					</div>
					<div class="flex justify-between border-b border-surface-500/20 pb-1">
						<span>Weeks:</span>
						<span>{durationBuilder.breakdown.weeks}</span>
					</div>
					<div class="flex justify-between border-b border-surface-500/20 pb-1">
						<span>Months:</span>
						<span>{durationBuilder.breakdown.months}</span>
					</div>
					<div class="flex justify-between border-b border-surface-500/20 pb-1">
						<span>Years:</span>
						<span>{durationBuilder.breakdown.years}</span>
					</div>
				</div>
			</div>

			<!-- Target Date -->
			<div
				class="p-4 bg-primary-500/10 dark:bg-primary-500/20 rounded-lg border border-primary-500/30"
			>
				<div
					class="text-sm font-bold text-surface-600 dark:text-surface-400 mb-2"
				>
					Target Date (from now)
				</div>
				<div class="flex flex-col sm:flex-row sm:items-center gap-2">
					<div class="flex-1 min-w-0">
						<div class="font-mono text-lg break-all">
							{durationBuilder.targetDate.local}
						</div>
						<div class="font-mono text-xs opacity-70">
							ISO: {durationBuilder.targetDate.iso}
						</div>
						<div class="font-mono text-xs opacity-70">
							Timestamp: {durationBuilder.targetDate.timestamp}
						</div>
					</div>
					<div class="flex gap-2">
						<button
							class="btn btn-sm preset-tonal"
							title="Copy Local"
							onclick={() => copy(durationBuilder.targetDate.local)}
						>
							📋 Local
						</button>
						<button
							class="btn btn-sm preset-tonal"
							title="Copy ISO"
							onclick={() => copy(durationBuilder.targetDate.iso)}
						>
							📋 ISO
						</button>
						<button
							class="btn btn-sm preset-tonal"
							title="Copy Timestamp"
							onclick={() =>
								copy(durationBuilder.targetDate.timestamp.toString())}
						>
							📋 TS
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
