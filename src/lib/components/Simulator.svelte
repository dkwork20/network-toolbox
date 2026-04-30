<script lang="ts">
  import { parseCidr } from "$lib/utils/ip";

  let { allowedCidrs = [] } = $props<{ allowedCidrs: string[] }>();

  let testIp = $state("");
  let result = $state<{ type: "VPN" | "LAN"; match?: string } | null>(null);

  function checkRouting() {
    if (!testIp) return;

    try {
      // Simple check: iterate allowedCidrs and see if IP is in range.
      // Since AllowedIPs are non-overlapping (by our calc), first match is enough.
      // But we need BigInt parsing.
      // We can reuse parseCidr but check if IP fits inside.

      // To avoid heavy parsing on every check, we might want to store parsing?
      // For MVP simulator with <100 rules, iterating is fine.

      const { start: ipVal, version } = parseCidr(
        testIp.includes("/")
          ? testIp
          : `${testIp}/${testIp.includes(":") ? 128 : 32}`,
      );
      // Note: parseCidr handles IP parsing if we give it a /32 or /128.

      for (const cidr of allowedCidrs) {
        const range = parseCidr(cidr);
        if (range.version !== version) continue;

        if (ipVal >= range.start && ipVal <= range.end) {
          result = { type: "VPN", match: cidr };
          return;
        }
      }

      result = { type: "LAN" };
    } catch (e) {
      console.error(e);
      result = null;
    }
  }
</script>

<div class="card p-4 space-y-4">
  <h3 class="h3 font-bold">Routing Simulator</h3>
  <div class="flex gap-2">
    <input
      class="input"
      type="text"
      bind:value={testIp}
      placeholder="Enter IP (e.g. 8.8.8.8)"
    />
    <button class="btn preset-filled-surface-500" onclick={checkRouting}
      >Test</button
    >
  </div>

  {#if result}
    <div
      class="alert {result.type === 'VPN'
        ? 'preset-filled-error-500'
        : 'preset-filled-success-500'}"
    >
      {#if result.type === "VPN"}
        <span>🛡️ Routed via <strong>VPN</strong> (Matches {result.match})</span>
      {:else}
        <span
          >🏠 Routed via <strong>LAN/Direct</strong> (No match in AllowedIPs)</span
        >
      {/if}
    </div>
  {/if}
</div>
