<script lang="ts">
  import { ipToBigInt, bigIntToIp, bigIntToIpv6, parseCidr, isIpv6 } from "$lib/utils/ip";

  type Node = {
    cidr: string;
    start: bigint;
    end: bigint;
    prefix: number; // e.g. 24 or 64 for IPv6
    version: 4 | 6;
    children?: [Node, Node]; // Split into two halves
    color?: string; // Random color or specific class
  };

  let rootInput = $state("192.168.0.0/24");
  let rootNode = $state<Node | null>(null);

  // Helper to convert bigint to IP string based on version
  function bigIntToIpStr(num: bigint, version: 4 | 6): string {
    return version === 4 ? bigIntToIp(num) : bigIntToIpv6(num);
  }

  // Initialize
  function init() {
    try {
      const parsed = parseCidr(rootInput);
      const version = parsed.version === 4 ? 4 : 6;
      
      rootNode = {
        cidr: rootInput,
        start: parsed.start,
        end: parsed.end,
        prefix: parsed.prefix,
        version,
      };
    } catch (e) {
      alert("Invalid CIDR: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  }

  function split(node: Node) {
    const maxPrefix = node.version === 4 ? 32 : 128;
    if (node.prefix >= maxPrefix) return; // Cannot split /32 or /128

    // Calculate split
    const newPrefix = node.prefix + 1;
    const size = (node.end - node.start + 1n) / 2n;

    const left: Node = {
      start: node.start,
      end: node.start + size - 1n,
      prefix: newPrefix,
      cidr: `${bigIntToIpStr(node.start, node.version)}/${newPrefix}`,
      version: node.version,
    };

    const right: Node = {
      start: node.start + size,
      end: node.end,
      prefix: newPrefix,
      cidr: `${bigIntToIpStr(node.start + size, node.version)}/${newPrefix}`,
      version: node.version,
    };

    node.children = [left, right];
  }

  function merge(node: Node) {
    if (node.children) {
      node.children = undefined;
    }
  }

  // Format IP count for display
  function formatIpCount(count: bigint, version: 4 | 6): string {
    const num = Number(count);
    if (version === 6) {
      // IPv6 ranges can be huge
      if (count >= 2n ** 64n) {
        return `${Number(count >> 64n)}×2^64 IPs`;
      }
      if (count >= 2n ** 32n) {
        return `${Number(count >> 32n)}×2^32 IPs`;
      }
    }
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B IPs`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M IPs`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K IPs`;
    return `${num} IPs`;
  }

  // Get max prefix for version
  function getMaxPrefix(version: 4 | 6): number {
    return version === 4 ? 32 : 128;
  }

  // Get display label for block
  function getBlockLabel(node: Node): string {
    const maxPrefix = getMaxPrefix(node.version);
    if (node.version === 4) {
      if (node.prefix < 24) return "Large Block";
      if (node.prefix < 32) return "Subnet";
      return "Host";
    } else {
      // IPv6
      if (node.prefix < 48) return "Large Block";
      if (node.prefix < 64) return "Subnet";
      if (node.prefix < 128) return "Small Block";
      return "Host";
    }
  }
</script>

<!-- Recursive Component (defined inset in Svelte 5 via snippets) -->
{#snippet subnetBlock(node: Node)}
  <div
    class="flex flex-col flex-1 min-w-0 border border-surface-500/20 p-1 m-1 transition-all"
  >
    <!-- Header / Controls -->
    <div
      class="flex justify-between items-center text-xs p-1 bg-surface-200 dark:bg-surface-700 rounded-sm mb-1"
    >
      <span class="font-mono font-bold text-[10px] md:text-xs">{node.cidr}</span>
      <div class="flex gap-2 items-center">
        <span class="opacity-50 text-[10px]"
          >{formatIpCount(node.end - node.start + 1n, node.version)}</span
        >
        {#if !node.children && node.prefix < getMaxPrefix(node.version)}
          <button
            class="btn btn-xs preset-filled-primary-500 py-0"
            onclick={() => split(node)}>Split</button
          >
        {/if}
        {#if node.children}
          <button
            class="btn btn-xs preset-filled-secondary-500 py-0"
            onclick={() => merge(node)}>Merge</button
          >
        {/if}
      </div>
    </div>

    <!-- content or children -->
    <div class="flex flex-1">
      {#if node.children}
        {@render subnetBlock(node.children[0])}
        {@render subnetBlock(node.children[1])}
      {:else}
        <div
          class="flex-1 min-h-[50px] {node.version === 6 ? 'bg-secondary-500/10' : 'bg-primary-500/10'} flex items-center justify-center text-xs text-surface-500 rounded-sm"
        >
          {getBlockLabel(node)}
        </div>
      {/if}
    </div>
  </div>
{/snippet}

<div
  class="container mx-auto p-4 max-w-6xl h-full flex flex-col overflow-y-auto pb-20"
>
  <div class="flex justify-between items-center mb-6">
    <div class="flex items-center gap-3">
      <h2 class="h2 font-bold">Visual Subnet Calculator (IPv4 & IPv6)</h2>
      <span class="badge preset-filled-secondary-500 text-xs">V0.2 ~ V0.17</span>
    </div>
  </div>

  <div class="flex gap-4 mb-4 flex-wrap">
    <input
      class="input flex-1 min-w-[200px] font-mono"
      type="text"
      bind:value={rootInput}
      placeholder="192.168.0.0/24 or 2001:db8::/32"
    />
    <button class="btn preset-filled-primary-500" onclick={init}>Visualize</button>
  </div>

  <div class="mb-4 text-sm text-surface-500">
    <strong>IPv4 examples:</strong> 192.168.0.0/24, 10.0.0.0/8
    <br>
    <strong>IPv6 examples:</strong> 2001:db8::/32, fd00::/8
  </div>

  <div
    class="flex-1 w-full overflow-x-auto min-h-[400px] border border-surface-500/30 rounded-xl bg-surface-50 dark:bg-surface-900 p-4"
  >
    {#if rootNode}
      {@render subnetBlock(rootNode)}
    {:else}
      <div class="h-full flex items-center justify-center opacity-50">
        Enter a CIDR to begin visualization
      </div>
    {/if}
  </div>
</div>
