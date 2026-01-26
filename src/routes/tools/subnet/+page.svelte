<script lang="ts">
  import { ipToBigInt, bigIntToIp, parseCidr } from "$lib/utils/ip";

  type Node = {
    cidr: string;
    start: bigint;
    end: bigint;
    prefix: number; // e.g. 24
    children?: [Node, Node]; // Split into two halves
    color?: string; // Random color or specific class
  };

  let rootInput = $state("192.168.0.0/24");
  let rootNode = $state<Node | null>(null);

  // Initialize
  function init() {
    try {
      const parsed = parseCidr(rootInput);
      if (parsed.version === 6) {
        alert("IPv6 visualization not supported in this demo yet.");
        return;
      }
      rootNode = {
        cidr: rootInput,
        start: parsed.start,
        end: parsed.end,
        prefix: parsed.prefix,
      };
    } catch (e) {
      alert("Invalid CIDR");
    }
  }

  function split(node: Node) {
    if (node.prefix >= 32) return; // Cannot split /32

    // Calculate split
    const newPrefix = node.prefix + 1;
    const size = (node.end - node.start + 1n) / 2n;

    const left: Node = {
      start: node.start,
      end: node.start + size - 1n,
      prefix: newPrefix,
      cidr: `${bigIntToIp(node.start)}/${newPrefix}`,
    };

    const right: Node = {
      start: node.start + size,
      end: node.end,
      prefix: newPrefix,
      cidr: `${bigIntToIp(node.start + size)}/${newPrefix}`,
    };

    node.children = [left, right];
  }

  function merge(node: Node) {
    if (node.children) {
      node.children = undefined;
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
      <span class="font-mono font-bold">{node.cidr}</span>
      <div class="flex gap-2">
        <span class="opacity-50 text-[10px]"
          >{Number(node.end - node.start + 1n)} IPs</span
        >
        {#if !node.children && node.prefix < 32}
          <button
            class="btn btn-xs variant-filled-primary py-0"
            onclick={() => split(node)}>Split</button
          >
        {/if}
        {#if node.children}
          <button
            class="btn btn-xs variant-filled-secondary py-0"
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
          class="flex-1 min-h-[50px] bg-primary-500/10 flex items-center justify-center text-xs text-surface-500 rounded-sm"
        >
          {node.prefix < 24 ? "Large Block" : "Host Block"}
        </div>
      {/if}
    </div>
  </div>
{/snippet}

<div
  class="container mx-auto p-4 max-w-6xl h-full flex flex-col overflow-y-auto pb-20"
>
  <div class="flex justify-between items-center mb-6">
    <h2 class="h2 font-bold">Visual Subnet Calculator (IPv4)</h2>
  </div>

  <div class="flex gap-4 mb-4">
    <input
      class="input max-w-sm font-mono"
      type="text"
      bind:value={rootInput}
      placeholder="192.168.0.0/24"
    />
    <button class="btn variant-filled-primary" onclick={init}>Visualize</button>
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
