<script lang="ts">
  import { onMount, tick } from "svelte";
  import CalculatorWorker from "$lib/workers/calculator.worker?worker";
  import { bigIntToIp, isIpv6 } from "$lib/utils/ip";
  import {
    generateWindowsScript,
    generateLinuxScript,
    generateMacScript,
    downloadFile,
  } from "$lib/utils/scripts";
  import Simulator from "$lib/components/Simulator.svelte";
  import { toaster } from "$lib/toaster.svelte";

  let excludedInput = $state("192.168.0.0/24\n10.0.0.0/8");
  let allowedOutput = $state("");
  let isCalculating = $state(false);
  let calculationTime = $state(0);
  let resultCount = $state(0);
  let worker: Worker | undefined;

  // Routing Advice State
  let gateway = $state("");
  let iface = $state("");
  let selectedOs = $state("windows");

  onMount(() => {
    worker = new CalculatorWorker();
    worker.onmessage = (e) => {
      const { result, error } = e.data;
      isCalculating = false;
      if (error) {
        allowedOutput = `Error: ${error}`;
      } else {
        allowedOutput = result.join(", "); // Default format
        // Store raw result for formatting options if needed
        resultCount = result.length;
        const endTime = performance.now();
        calculationTime = endTime - startTime;
      }
    };

    return () => {
      worker?.terminate();
    };
  });

  let startTime = 0;

  function handleCalculate() {
    if (!worker) return;
    isCalculating = true;
    startTime = performance.now();
    const excludes = excludedInput.split("\n").filter((l) => l.trim() !== "");
    worker.postMessage({ excludes, fullRanges: ["0.0.0.0/0", "::/0"] });
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(allowedOutput);
    toaster.success({
      title: "Copied",
      description: "AllowedIPs list copied to clipboard",
    });
  }

  function generatePeerConfig() {
    const config = `[Peer]
AllowedIPs = ${allowedOutput}
# ... other settings`;
    navigator.clipboard.writeText(config);
    toaster.success({
      title: "Config Copied",
      description: "Peer configuration copied to clipboard",
    });
  }

  function handleDownloadScript() {
    const cidrs = excludedInput.split("\n").filter(Boolean);
    if (!cidrs.length)
      return toaster.error({
        title: "Error",
        description: "No ranges to export",
      });

    let content = "";
    let filename = "routes";
    const gw = gateway || "192.168.1.1";

    if (selectedOs === "windows") {
      content = generateWindowsScript(cidrs, gateway);
      filename += ".bat";
    } else if (selectedOs === "linux") {
      content = generateLinuxScript(cidrs, gateway, iface);
      filename += ".sh";
    } else {
      content = generateMacScript(cidrs, gateway);
      filename += ".sh";
    }

    downloadFile(filename, content);
  }

  // Routing Commands Generation
  function getExampleCommand(cidr: string) {
    if (!cidr.includes("/")) return "";
    const gw = gateway || "<GW>";
    const dev = iface || "<DEV>";
    const isV6 = isIpv6(cidr.split("/")[0]);

    if (selectedOs === "windows") {
      if (isV6) {
        return `route add ${cidr} ${gw}`;
      }
      try {
        const prefix = parseInt(cidr.split("/")[1], 10);
        const maskLong = (0xffffffffn << (32n - BigInt(prefix))) & 0xffffffffn;
        const netmask = bigIntToIp(maskLong);
        const network = cidr.split("/")[0];
        return `route add ${network} mask ${netmask} ${gw} -p`;
      } catch {
        return `route add ${cidr} ${gw} -p (invalid CIDR)`;
      }
    } else if (selectedOs === "linux") {
      const cmd = isV6 ? "ip -6 route add" : "ip route add";
      return `${cmd} ${cidr} via ${gw} dev ${dev}`;
    } else {
      if (isV6) {
        return `route -n add -inet6 ${cidr} ${gw}`;
      }
      return `route -n add -net ${cidr} ${gw}`;
    }
  }
</script>

<div
  class="container mx-auto p-4 max-w-6xl h-full flex flex-col overflow-y-auto pb-20"
>
  <!-- Header moved to Navbar, keeping subtle title or removing -->
  <!-- <header class="mb-8"> ... </header> -->

  <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0">
    <!-- Left: Input -->
    <div class="flex flex-col gap-4">
      <label class="label flex flex-col flex-1">
        <span class="font-bold text-lg">Excluded Ranges (CIDR)</span>
        <textarea
          class="textarea flex-1 p-4 font-mono text-sm bg-surface-100-800-token"
          bind:value={excludedInput}
          placeholder="192.168.0.0/24&#10;2001:db8::/32"
        ></textarea>
      </label>

      <div class="flex gap-4">
        <button
          class="btn variant-filled-primary flex-1 py-3 font-bold"
          onclick={handleCalculate}
          disabled={isCalculating}
        >
          {isCalculating ? "Calculating..." : "Calculate AllowedIPs"}
        </button>
        <button
          class="btn variant-ghost-surface"
          onclick={() => (excludedInput = "")}>Clear</button
        >
      </div>
    </div>

    <!-- Right: Output -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <span class="font-bold text-lg">AllowedIPs Result</span>
        <span class="text-sm text-surface-500">
          {#if resultCount > 0}
            {resultCount} ranges found ({calculationTime.toFixed(1)}ms)
          {/if}
        </span>
      </div>

      <textarea
        class="textarea flex-1 p-4 font-mono text-sm bg-surface-100-800-token"
        readonly
        value={allowedOutput}
        placeholder="Result will appear here..."
      ></textarea>

      <div class="flex gap-4 flex-wrap">
        <button
          class="btn variant-filled-secondary"
          onclick={copyToClipboard}
          disabled={!allowedOutput}
        >
          Copy List
        </button>
        <button
          class="btn variant-filled-tertiary"
          onclick={generatePeerConfig}
          disabled={!allowedOutput}
        >
          Copy [Peer] Config
        </button>
      </div>
    </div>
  </div>

  <!-- Routing Advice (Bottom, Collapsible/Simple) -->
  <div class="mt-8 p-4 bg-surface-100-800-token rounded-container-token">
    <h3 class="h3 font-bold mb-4">Routing Advice Helper</h3>
    <p class="mb-4 text-sm opacity-70">
      If you prefer to set <code>AllowedIPs = 0.0.0.0/0, ::/0</code> and handle exclusions
      via OS routing table:
    </p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <label class="label">
        <span>Gateway IP</span>
        <input
          class="input"
          type="text"
          bind:value={gateway}
          placeholder="192.168.1.1"
        />
      </label>
      <label class="label">
        <span>Interface (optional)</span>
        <input
          class="input"
          type="text"
          bind:value={iface}
          placeholder="eth0"
        />
      </label>
      <label class="label">
        <span>OS</span>
        <select class="select" bind:value={selectedOs}>
          <option value="windows">Windows</option>
          <option value="linux">Linux</option>
          <option value="macos">macOS</option>
        </select>
      </label>
      <div class="flex items-end">
        <button
          class="btn variant-filled-secondary w-full"
          onclick={handleDownloadScript}
        >
          Download Script
        </button>
      </div>
    </div>
    <!-- Display simplified advice based on input ranges -->
    <code
      class="block bg-black text-green-400 p-4 mt-4 rounded font-mono text-sm overflow-x-auto"
    >
      {#if excludedInput.trim()}
        {#each excludedInput.split("\n").filter(Boolean) as cidr}
          {@html getExampleCommand(cidr)}<br />
        {/each}
      {:else}
        # Enter exclude ranges above to see routing commands
      {/if}
    </code>
  </div>
  <!-- Simulator -->
  <div class="mt-8">
    <Simulator
      allowedCidrs={allowedOutput
        ? allowedOutput.split(",").map((s) => s.trim())
        : []}
    />
  </div>
</div>
