<script lang="ts">
  import { Key, Copy, Check, RefreshCw, Shield, ShieldCheck, AlertCircle } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";
  import bcrypt from "bcryptjs";

  type Mode = "generate" | "verify";

  // State
  let mode = $state<Mode>("generate");
  let password = $state("");
  let confirmPassword = $state("");
  let costFactor = $state(10);
  let generatedHash = $state("");
  let copied = $state(false);
  let isProcessing = $state(false);

  // Verify mode
  let hashToVerify = $state("");
  let verifyPassword = $state("");
  let verifyResult = $state<boolean | null>(null);

  // Generate hash
  async function generateHash() {
    if (!password) {
      toaster.error({ title: "Error", description: "Please enter a password" });
      return;
    }

    if (password !== confirmPassword) {
      toaster.error({ title: "Error", description: "Passwords do not match" });
      return;
    }

    isProcessing = true;

    try {
      const salt = await bcrypt.genSalt(costFactor);
      generatedHash = await bcrypt.hash(password, salt);
      toaster.success({ title: "Success", description: "Hash generated" });
    } catch (e) {
      toaster.error({ title: "Error", description: "Failed to generate hash" });
    }

    isProcessing = false;
  }

  // Verify hash
  async function verifyHash() {
    if (!hashToVerify || !verifyPassword) {
      toaster.error({ title: "Error", description: "Please enter both hash and password" });
      return;
    }

    isProcessing = true;

    try {
      verifyResult = await bcrypt.compare(verifyPassword, hashToVerify);
    } catch (e) {
      toaster.error({ title: "Error", description: "Invalid hash format" });
      verifyResult = null;
    }

    isProcessing = false;
  }

  // Copy hash
  async function copyHash() {
    await navigator.clipboard.writeText(generatedHash);
    copied = true;
    toaster.success({ title: "Copied!", description: "Hash copied to clipboard" });
    setTimeout(() => (copied = false), 1500);
  }

  // Clear all
  function clearAll() {
    password = "";
    confirmPassword = "";
    generatedHash = "";
    hashToVerify = "";
    verifyPassword = "";
    verifyResult = null;
  }

  // Get cost factor info
  function getCostInfo(): { time: string; security: string } {
    const times: Record<number, string> = {
      4: "~0.001s",
      8: "~0.01s",
      10: "~0.1s",
      12: "~0.3s",
      14: "~1s",
      16: "~4s",
    };
    const securities: Record<number, string> = {
      4: "Low (fast)",
      8: "Medium",
      10: "Recommended",
      12: "High",
      14: "Very High (slow)",
      16: "Maximum (very slow)",
    };
    return {
      time: times[costFactor] || `~${Math.pow(2, costFactor - 10) * 0.1}s`,
      security: securities[costFactor] || "Custom",
    };
  }

  // Parse hash info
  function parseHashInfo(hash: string): { algorithm: string; cost: number; salt: string } | null {
    const match = hash.match(/^\$2[aby]?\$(\d+)\$([A-Za-z0-9+.\/]{22})/);
    if (!match) return null;
    return {
      algorithm: hash.substring(0, 4),
      cost: parseInt(match[1]),
      salt: match[2].substring(0, 8) + "...",
    };
  }
</script>

<svelte:head>
  <title>Bcrypt Hash Generator - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Key class="size-8 text-primary-500" />
      Bcrypt Hash Generator
      <span class="badge variant-filled-secondary text-xs">V0.10</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Generate and verify bcrypt password hashes for secure storage
    </p>
  </div>

  <!-- Mode Selection -->
  <div class="flex gap-2 mb-6">
    <button
      class="btn {mode === 'generate' ? 'variant-filled-primary' : 'variant-soft-surface'}"
      onclick={() => { mode = 'generate'; verifyResult = null; }}
    >
      <Shield class="size-4" />
      Generate Hash
    </button>
    <button
      class="btn {mode === 'verify' ? 'variant-filled-primary' : 'variant-soft-surface'}"
      onclick={() => { mode = 'verify'; verifyResult = null; }}
    >
      <ShieldCheck class="size-4" />
      Verify Hash
    </button>
  </div>

  {#if mode === 'generate'}
    <!-- Generate Mode -->
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
      <div class="space-y-4">
        <label class="label">
          <span>Password</span>
          <input
            type="password"
            class="input"
            bind:value={password}
            placeholder="Enter password to hash..."
          />
        </label>

        <label class="label">
          <span>Confirm Password</span>
          <input
            type="password"
            class="input"
            class:border-error-500={confirmPassword && password !== confirmPassword}
            bind:value={confirmPassword}
            placeholder="Confirm password..."
          />
          {#if confirmPassword && password !== confirmPassword}
            <p class="text-xs text-error-500 mt-1">Passwords do not match</p>
          {/if}
        </label>

        <label class="label">
          <span>Cost Factor: {costFactor}</span>
          <input
            type="range"
            class="range-slider"
            min="4"
            max="16"
            bind:value={costFactor}
          />
          <div class="flex justify-between text-xs text-surface-500 mt-1">
            <span>4 (Fast)</span>
            <span>10 (Recommended)</span>
            <span>16 (Slow)</span>
          </div>
        </label>

        <div class="flex gap-4 text-sm">
          <span class="text-surface-500">Est. time: <strong>{getCostInfo().time}</strong></span>
          <span class="text-surface-500">Security: <strong>{getCostInfo().security}</strong></span>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          class="btn variant-filled-primary flex-1"
          onclick={generateHash}
          disabled={isProcessing || !password || password !== confirmPassword}
        >
          {#if isProcessing}
            <RefreshCw class="size-4 animate-spin" />
            Generating...
          {:else}
            Generate Hash
          {/if}
        </button>
        <button class="btn variant-soft-surface" onclick={clearAll}>
          Clear
        </button>
      </div>
    </div>

    <!-- Generated Hash Output -->
    {#if generatedHash}
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
        <h2 class="h2 font-bold">Generated Hash</h2>

        <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
          <div class="flex justify-between items-start gap-4">
            <code class="font-mono text-sm break-all">{generatedHash}</code>
            <button class="btn-icon btn-icon-sm flex-shrink-0" onclick={copyHash}>
              {#if copied}
                <Check class="size-4 text-success-500" />
              {:else}
                <Copy class="size-4" />
              {/if}
            </button>
          </div>
        </div>

        {#if parseHashInfo(generatedHash)}
          {@const hashInfo = parseHashInfo(generatedHash)}
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg text-center">
              <div class="text-surface-500">Algorithm</div>
              <div class="font-mono font-bold">{hashInfo!.algorithm}</div>
            </div>
            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg text-center">
              <div class="text-surface-500">Cost</div>
              <div class="font-bold">{hashInfo!.cost}</div>
            </div>
            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg text-center">
              <div class="text-surface-500">Salt</div>
              <div class="font-mono text-xs">{hashInfo!.salt}</div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  {:else}
    <!-- Verify Mode -->
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
      <label class="label">
        <span>Bcrypt Hash</span>
        <textarea
          class="textarea font-mono text-sm"
          rows="2"
          bind:value={hashToVerify}
          placeholder="$2a$10$..."
        ></textarea>
      </label>

      <label class="label">
        <span>Password to Verify</span>
        <input
          type="password"
          class="input"
          bind:value={verifyPassword}
          placeholder="Enter password to check..."
        />
      </label>

      <div class="flex gap-2">
        <button
          class="btn variant-filled-primary flex-1"
          onclick={verifyHash}
          disabled={isProcessing || !hashToVerify || !verifyPassword}
        >
          {#if isProcessing}
            <RefreshCw class="size-4 animate-spin" />
            Verifying...
          {:else}
            Verify Password
          {/if}
        </button>
        <button class="btn variant-soft-surface" onclick={clearAll}>
          Clear
        </button>
      </div>
    </div>

    <!-- Verify Result -->
    {#if verifyResult !== null}
      <div class="card p-6 mt-6 {verifyResult ? 'bg-success-500/10' : 'bg-error-500/10'} rounded-lg">
        <div class="flex items-center gap-3">
          {#if verifyResult}
            <Check class="size-8 text-success-500" />
            <div>
              <h3 class="h3 font-bold text-success-500">Password Matches!</h3>
              <p class="text-surface-500">The password is correct for this hash.</p>
            </div>
          {:else}
            <AlertCircle class="size-8 text-error-500" />
            <div>
              <h3 class="h3 font-bold text-error-500">Password Does Not Match</h3>
              <p class="text-surface-500">The password is incorrect for this hash.</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}

  <!-- Info Section -->
  <div class="card p-6 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
    <h2 class="h2 font-bold">About Bcrypt</h2>
    <div class="text-sm text-surface-500 space-y-2">
      <p>
        <strong>Bcrypt</strong> is a password hashing function designed by Niels Provos and David Mazières.
        It is based on the Blowfish cipher and incorporates a salt to protect against rainbow table attacks.
      </p>
      <p>
        <strong>Cost Factor (Rounds):</strong> Higher values increase the time required to compute the hash,
        making brute-force attacks more expensive. The recommended value is 10-12 for modern systems.
      </p>
      <p>
        <strong>Security Note:</strong> This tool runs entirely in your browser. No data is sent to any server.
        Your passwords and hashes remain private.
      </p>
    </div>

    <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg">
      <h3 class="font-medium mb-2">Hash Format</h3>
      <code class="text-xs">$2a$10$N9qo8uLOickgx2ZMRZoMy...</code>
      <ul class="text-xs text-surface-500 mt-2 space-y-1">
        <li><code>$2a$</code> - Algorithm version</li>
        <li><code>10$</code> - Cost factor (2^10 iterations)</li>
        <li><code>N9qo8uLOickgx2ZMRZoMy...</code> - Salt + Hash</li>
      </ul>
    </div>
  </div>
</div>
