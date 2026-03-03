<script lang="ts">
  import { onMount } from "svelte";
  import { KeyRound, Copy, Check, RefreshCw, Download, Shield, ShieldAlert, ShieldCheck, ShieldX } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";
  import { wordList } from "$lib/data/wordlist";

  type StrengthLevel = "very-weak" | "weak" | "fair" | "strong" | "very-strong";

  let password = $state("");
  let passwords = $state<string[]>([]);
  let length = $state(16);
  let count = $state(5);
  let useUppercase = $state(true);
  let useLowercase = $state(true);
  let useDigits = $state(true);
  let useSymbols = $state(false);
  let excludeAmbiguous = $state(true);
  let passphraseMode = $state(false);
  let passphraseWordCount = $state(4);
  let passphraseSeparator = $state("-");
  let copied = $state(false);
  let copiedIndex = $state<number | null>(null);

  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const ambiguous = "0O1lI";

  // Word list for passphrases

  function getSecureRandom(max: number): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }

  function generatePassword(): string {
    if (passphraseMode) {
      return generatePassphrase();
    }

    let charset = "";
    if (useUppercase) charset += uppercase;
    if (useLowercase) charset += lowercase;
    if (useDigits) charset += digits;
    if (useSymbols) charset += symbols;

    if (excludeAmbiguous) {
      charset = charset.split("").filter(c => !ambiguous.includes(c)).join("");
    }

    if (charset.length === 0) {
      charset = lowercase;
    }

    let result = "";
    for (let i = 0; i < length; i++) {
      result += charset[getSecureRandom(charset.length)];
    }

    return result;
  }

  function generatePassphrase(): string {
    const words: string[] = [];
    for (let i = 0; i < passphraseWordCount; i++) {
      words.push(wordList[getSecureRandom(wordList.length)]);
    }
    return words.join(passphraseSeparator);
  }

  function generateAll() {
    passwords = Array.from({ length: count }, () => generatePassword());
    password = passwords[0];
  }

  function calculateStrength(pwd: string): { level: StrengthLevel; score: number; entropy: number } {
    let score = 0;
    const len = pwd.length;

    if (len >= 8) score += 1;
    if (len >= 12) score += 1;
    if (len >= 16) score += 1;
    if (len >= 20) score += 1;

    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    let poolSize = 0;
    if (/[a-z]/.test(pwd)) poolSize += 26;
    if (/[A-Z]/.test(pwd)) poolSize += 26;
    if (/[0-9]/.test(pwd)) poolSize += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) poolSize += 32;
    const entropy = Math.log2(Math.pow(poolSize || 26, len));

    let level: StrengthLevel;
    if (score <= 2 || len < 8) level = "very-weak";
    else if (score <= 3) level = "weak";
    else if (score <= 5) level = "fair";
    else if (score <= 7) level = "strong";
    else level = "very-strong";

    return { level, score, entropy };
  }

  function getStrengthIcon(level: StrengthLevel) {
    switch (level) {
      case "very-weak": return ShieldX;
      case "weak": return ShieldAlert;
      case "fair": return Shield;
      case "strong": return ShieldCheck;
      case "very-strong": return ShieldCheck;
    }
  }

  function getStrengthColor(level: StrengthLevel): string {
    switch (level) {
      case "very-weak": return "text-error-500";
      case "weak": return "text-warning-500";
      case "fair": return "text-yellow-500";
      case "strong": return "text-success-500";
      case "very-strong": return "text-primary-500";
    }
  }

  async function copyPassword(index?: number) {
    const text = index !== undefined ? passwords[index] : password;
    await navigator.clipboard.writeText(text);
    copiedIndex = index ?? -1;
    copied = true;
    toaster.success({ title: "Copied!", description: "Password copied to clipboard" });
    setTimeout(() => {
      copied = false;
      copiedIndex = null;
    }, 1500);
  }

  function downloadPasswords() {
    const content = passwords.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "passwords.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Generate on mount
  onMount(() => {
    generateAll();
  });
</script>

<svelte:head>
  <title>Password Generator - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl pb-20">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <KeyRound class="size-8 text-primary-500" />
      Password Generator
      <span class="badge preset-filled-secondary-500 text-xs">V0.6 ~ V0.17</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Generate secure, random passwords with customizable complexity
    </p>
  </div>

  <!-- Password Display -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="h2 font-bold">Generated Password</h2>
      <div class="flex gap-2">
        <button class="btn preset-filled-primary-500" onclick={generateAll}>
          <RefreshCw class="size-4" />
          Regenerate
        </button>
        <button class="btn preset-tonal-surface" onclick={downloadPasswords}>
          <Download class="size-4" />
          Download
        </button>
      </div>
    </div>

    <!-- Main Password -->
    {#if password}
      <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
        <div class="flex justify-between items-center">
          <code class="text-xl font-mono break-all">{password}</code>
          <button class="btn-icon" onclick={() => copyPassword()}>
            {#if copied}
              <Check class="size-5 text-success-500" />
            {:else}
              <Copy class="size-5" />
            {/if}
          </button>
        </div>

        <!-- Strength Indicator -->
        <div class="mt-4 flex items-center gap-3">
          {#if getStrengthIcon(calculateStrength(password).level)}
            {@const StrengthIcon = getStrengthIcon(calculateStrength(password).level)}
            <StrengthIcon class="size-5 {getStrengthColor(calculateStrength(password).level)}" />
          {/if}
          <div class="flex-1">
            <div class="h-2 bg-surface-300 dark:bg-surface-600 rounded-full overflow-hidden">
              <div
                class="h-full transition-all {getStrengthColor(calculateStrength(password).level).replace('text-', 'bg-')}"
                style="width: {(calculateStrength(password).score / 8) * 100}%"
              ></div>
            </div>
          </div>
          <span class="text-sm font-medium {getStrengthColor(calculateStrength(password).level)} capitalize">
            {calculateStrength(password).level.replace('-', ' ')}
          </span>
        </div>
        <p class="text-xs text-surface-500 mt-2">
          Entropy: {calculateStrength(password).entropy.toFixed(1)} bits | Length: {password.length}
        </p>
      </div>
    {/if}

    <!-- Bulk Passwords -->
    {#if count > 1 && passwords.length > 1}
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="font-medium">All Passwords ({passwords.length})</span>
          <button class="btn btn-sm preset-tonal-surface" onclick={() => navigator.clipboard.writeText(passwords.join('\n'))}>
            <Copy class="size-4" />
            Copy All
          </button>
        </div>
        <div class="max-h-60 overflow-y-auto space-y-2">
          {#each passwords as pwd, index}
            <div class="flex justify-between items-center p-2 bg-surface-100 dark:bg-surface-800 rounded">
              <code class="font-mono text-sm break-all">{pwd}</code>
              <button class="btn-icon btn-icon-sm shrink-0 ml-2" onclick={() => copyPassword(index)}>
                {#if copiedIndex === index}
                  <Check class="size-4 text-success-500" />
                {:else}
                  <Copy class="size-4" />
                {/if}
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Options -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold">Options</h2>

    <!-- Mode Toggle -->
    <div class="flex gap-2">
      <button
        class="btn {passphraseMode ? 'preset-tonal-surface' : 'preset-filled-primary-500'}"
        onclick={() => { passphraseMode = false; generateAll(); }}
      >
        Password
      </button>
      <button
        class="btn {passphraseMode ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
        onclick={() => { passphraseMode = true; generateAll(); }}
      >
        Passphrase
      </button>
    </div>

    {#if passphraseMode}
      <!-- Passphrase Options -->
      <div class="space-y-4">
        <label class="label">
          <span>Word Count: {passphraseWordCount}</span>
          <input
            type="range"
            class="range-slider"
            min="3"
            max="10"
            bind:value={passphraseWordCount}
            onchange={generateAll}
          />
        </label>

        <label class="label">
          <span>Separator</span>
          <select class="select" bind:value={passphraseSeparator} onchange={generateAll}>
            <option value="-">Dash (-)</option>
            <option value=" ">Space ( )</option>
            <option value="_">Underscore (_)</option>
            <option value=".">Dot (.)</option>
            <option value="">None</option>
          </select>
        </label>
      </div>
    {:else}
      <!-- Password Options -->
      <div class="space-y-4">
        <label class="label">
          <span>Length: {length}</span>
          <input
            type="range"
            class="range-slider"
            min="4"
            max="128"
            bind:value={length}
            onchange={generateAll}
          />
        </label>

        <div class="grid grid-cols-2 gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="checkbox" bind:checked={useUppercase} onchange={generateAll} />
            <span>Uppercase (A-Z)</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="checkbox" bind:checked={useLowercase} onchange={generateAll} />
            <span>Lowercase (a-z)</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="checkbox" bind:checked={useDigits} onchange={generateAll} />
            <span>Digits (0-9)</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="checkbox" bind:checked={useSymbols} onchange={generateAll} />
            <span>Symbols (!@#$...)</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer col-span-2">
            <input type="checkbox" class="checkbox" bind:checked={excludeAmbiguous} onchange={generateAll} />
            <span>Exclude Ambiguous (0O, 1lI)</span>
          </label>
        </div>
      </div>
    {/if}

    <!-- Count -->
    <label class="label">
      <span>Generate Count: {count}</span>
      <input
        type="range"
        class="range-slider"
        min="1"
        max="20"
        bind:value={count}
        onchange={generateAll}
      />
    </label>
  </div>
</div>
