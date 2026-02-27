<script lang="ts">
  import { onMount, tick } from "svelte";
  import CalculatorWorker from "$lib/workers/calculator.worker?worker";
  import {
    bigIntToIp,
    bigIntToIpv6,
    isIpv6,
    parseCidr,
    ipToBigInt,
    isValidCidr,
    ipv4NetmaskToPrefix,
  } from "$lib/utils/ip";
  import {
    generateWindowsScript,
    generateLinuxScript,
    generateMacScript,
    downloadFile,
  } from "$lib/utils/scripts";
  import Simulator from "$lib/components/Simulator.svelte";
  import { toaster } from "$lib/toaster.svelte";
  import { Copy, Check, RefreshCw, Calculator } from "@lucide/svelte";

  let excludedInput = $state("192.168.0.0/24\n10.0.0.0/8");
  let allowedOutput = $state("");
  let isCalculating = $state(false);
  let calculationTime = $state(0);
  let resultCount = $state(0);
  let worker: Worker | undefined;

  // === SUBNET ANALYZER STATE ===
  type InputMode = "cidr" | "range" | "netmask";
  let subnetMode = $state<InputMode>("cidr");
  let subnetCidr = $state("");
  let subnetStartIp = $state("");
  let subnetEndIp = $state("");
  let subnetIp = $state("");
  let subnetNetmask = $state("");

  let subnetResults = $state<{
    networkAddress: string;
    broadcastAddress: string;
    firstHost: string;
    lastHost: string;
    totalHosts: bigint;
    usableHosts: bigint;
    netmask: string;
    wildcardMask: string;
    cidr: string;
    ipRange: string;
    prefixLength: number;
  } | null>(null);

  let subnetError = $state<string | null>(null);
  let copiedField = $state<string | null>(null);

  // === SUBNET ANALYZER FUNCTIONS ===
  function calculateSubnetFromCidr() {
    subnetError = null;
    subnetResults = null;

    if (!subnetCidr) return;

    if (!isValidCidr(subnetCidr)) {
      subnetError = "Invalid CIDR notation";
      return;
    }

    try {
      const parsed = parseCidr(subnetCidr);
      if (!parsed) {
        subnetError = "Failed to parse CIDR";
        return;
      }

      const { start, end, prefix, version } = parsed;

      // Calculate netmask
      const maskBits = BigInt(prefix);
      const allOnes = version === 4 ? 0xFFFFFFFFn : (1n << 128n) - 1n;
      const netmaskValue = allOnes ^ ((1n << (BigInt(version === 4 ? 32 : 128) - maskBits)) - 1n);

      // Calculate wildcard mask
      const wildcardValue = allOnes ^ netmaskValue;

      const networkAddress = start;
      const broadcastAddress = end;

      let firstHost: bigint;
      let lastHost: bigint;

      if (prefix >= (version === 4 ? 31 : 127)) {
        firstHost = start;
        lastHost = end;
      } else {
        firstHost = start + 1n;
        lastHost = end - 1n;
      }

      const totalHosts = end - start + 1n;
      const usableHosts = prefix >= (version === 4 ? 31 : 127) ? totalHosts : totalHosts - 2n;

      const convertIp = version === 4 ? bigIntToIp : bigIntToIpv6;

      subnetResults = {
        networkAddress: convertIp(networkAddress),
        broadcastAddress: convertIp(broadcastAddress),
        firstHost: convertIp(firstHost),
        lastHost: convertIp(lastHost),
        totalHosts,
        usableHosts,
        netmask: version === 4 ? convertIp(netmaskValue) : `/${prefix}`,
        wildcardMask: version === 4 ? convertIp(wildcardValue) : "N/A for IPv6",
        cidr: subnetCidr,
        ipRange: `${convertIp(start)} - ${convertIp(end)}`,
        prefixLength: prefix,
      };
    } catch (e) {
      subnetError = e instanceof Error ? e.message : "Calculation error";
    }
  }

  function calculateSubnetFromRange() {
    subnetError = null;
    subnetResults = null;

    if (!subnetStartIp || !subnetEndIp) {
      subnetError = "Enter both start and end IP addresses";
      return;
    }

    try {
      const start = ipToBigInt(subnetStartIp);
      const end = ipToBigInt(subnetEndIp);

      if (start > end) {
        subnetError = "Start IP must be less than or equal to end IP";
        return;
      }

      const range = end - start + 1n;
      let prefix = 32;
      for (let i = 0; i <= 32; i++) {
        if ((1n << BigInt(32 - i)) >= range) {
          prefix = i;
          break;
        }
      }

      subnetCidr = `${subnetStartIp}/${prefix}`;
      calculateSubnetFromCidr();
    } catch (e) {
      subnetError = "Invalid IP address format";
    }
  }

  function calculateSubnetFromNetmask() {
    subnetError = null;
    subnetResults = null;

    if (!subnetIp || !subnetNetmask) {
      subnetError = "Enter both IP address and netmask";
      return;
    }

    try {
      const ip = ipToBigInt(subnetIp);
      const mask = ipToBigInt(subnetNetmask);
      const prefix = ipv4NetmaskToPrefix(subnetNetmask);

      const network = ip & mask;

      subnetCidr = `${bigIntToIp(network)}/${prefix}`;
      calculateSubnetFromCidr();
    } catch (e) {
      subnetError = e instanceof Error ? e.message : "Invalid IP address or netmask format";
    }
  }

  function calculateSubnet() {
    switch (subnetMode) {
      case "cidr":
        calculateSubnetFromCidr();
        break;
      case "range":
        calculateSubnetFromRange();
        break;
      case "netmask":
        calculateSubnetFromNetmask();
        break;
    }
  }

  async function copySubnetField(field: string, value: string) {
    await navigator.clipboard.writeText(value);
    copiedField = field;
    toaster.success({ title: "Copied!", description: `${field} copied` });
    setTimeout(() => (copiedField = null), 1500);
  }

  function clearSubnet() {
    subnetCidr = "";
    subnetStartIp = "";
    subnetEndIp = "";
    subnetIp = "";
    subnetNetmask = "";
    subnetResults = null;
    subnetError = null;
  }

  // Auto-calculate subnet when inputs change
  $effect(() => {
    if (subnetCidr || subnetStartIp || subnetIp) {
      calculateSubnet();
    }
  });

  // Routing Advice State

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

<svelte:head>
  <title>IP Calculator - NetOps Solutions</title>
</svelte:head>

<div
  class="container mx-auto p-4 max-w-6xl h-full flex flex-col overflow-y-auto pb-20"
>
  <!-- Header -->
  <div class="mb-6 flex items-center gap-3">
    <h1 class="h1 font-bold">IP Calculator</h1>
    <span class="badge preset-filled-secondary-500 text-xs">V0.4 ~ V0.15</span>
  </div>

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
          class="btn preset-filled-primary-500 flex-1 py-3 font-bold"
          onclick={handleCalculate}
          disabled={isCalculating}
        >
          {isCalculating ? "Calculating..." : "Calculate AllowedIPs"}
        </button>
        <button
          class="btn bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface"
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
          class="btn preset-filled-secondary-500"
          onclick={copyToClipboard}
          disabled={!allowedOutput}
        >
          Copy List
        </button>
        <button
          class="btn preset-filled-tertiary-500"
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
          class="btn preset-filled-secondary-500 w-full"
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

  <!-- Subnet Analyzer Section -->
  <div class="mt-8 p-6 bg-surface-100-800-token rounded-container-token">
    <h3 class="h3 font-bold mb-4 flex items-center gap-2">
      <Calculator class="size-5 text-primary-500" />
      Subnet Analyzer
    </h3>

    <!-- Input Mode Selection -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        class="btn btn-sm {subnetMode === 'cidr' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
        onclick={() => (subnetMode = 'cidr')}
      >
        CIDR Notation
      </button>
      <button
        class="btn btn-sm {subnetMode === 'range' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
        onclick={() => (subnetMode = 'range')}
      >
        IP Range
      </button>
      <button
        class="btn btn-sm {subnetMode === 'netmask' ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
        onclick={() => (subnetMode = 'netmask')}
      >
        IP + Netmask
      </button>
    </div>

    <!-- Input Fields -->
    <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-4 mb-4">
      {#if subnetMode === 'cidr'}
        <label class="label">
          <span>CIDR Notation</span>
          <input
            type="text"
            class="input font-mono"
            bind:value={subnetCidr}
            placeholder="192.168.1.0/24"
          />
        </label>
      {:else if subnetMode === 'range'}
        <div class="grid grid-cols-2 gap-4">
          <label class="label">
            <span>Start IP</span>
            <input
              type="text"
              class="input font-mono"
              bind:value={subnetStartIp}
              placeholder="192.168.1.0"
            />
          </label>
          <label class="label">
            <span>End IP</span>
            <input
              type="text"
              class="input font-mono"
              bind:value={subnetEndIp}
              placeholder="192.168.1.255"
            />
          </label>
        </div>
      {:else if subnetMode === 'netmask'}
        <div class="grid grid-cols-2 gap-4">
          <label class="label">
            <span>IP Address</span>
            <input
              type="text"
              class="input font-mono"
              bind:value={subnetIp}
              placeholder="192.168.1.100"
            />
          </label>
          <label class="label">
            <span>Subnet Mask</span>
            <input
              type="text"
              class="input font-mono"
              bind:value={subnetNetmask}
              placeholder="255.255.255.0"
            />
          </label>
        </div>
      {/if}

      <button class="btn btn-sm bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface" onclick={clearSubnet}>
        <RefreshCw class="size-4" />
        Clear
      </button>

      {#if subnetError}
        <p class="text-sm text-error-500">{subnetError}</p>
      {/if}
    </div>

    <!-- Results -->
    {#if subnetResults}
      <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-4">
        <h4 class="h4 font-bold">Network Information</h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          {#each [
            { label: "Network Address", value: subnetResults.networkAddress, key: "network" },
            { label: "Broadcast Address", value: subnetResults.broadcastAddress, key: "broadcast" },
            { label: "First Usable Host", value: subnetResults.firstHost, key: "first" },
            { label: "Last Usable Host", value: subnetResults.lastHost, key: "last" },
            { label: "Subnet Mask", value: subnetResults.netmask, key: "netmask" },
            { label: "Wildcard Mask", value: subnetResults.wildcardMask, key: "wildcard" },
            { label: "CIDR", value: subnetResults.cidr, key: "cidr" },
            { label: "IP Range", value: subnetResults.ipRange, key: "range" },
          ] as item}
            <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-surface-500">{item.label}</span>
                <button
                  class="btn-icon btn-icon-sm"
                  onclick={() => copySubnetField(item.label, item.value)}
                >
                  {#if copiedField === item.label}
                    <Check class="size-3 text-success-500" />
                  {:else}
                    <Copy class="size-3" />
                  {/if}
                </button>
              </div>
              <code class="font-mono text-sm">{item.value}</code>
            </div>
          {/each}
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-3 mt-2">
          <div class="p-3 bg-primary-500/10 rounded-lg text-center">
            <div class="text-2xl font-bold text-primary-500">
              {subnetResults.totalHosts.toString()}
            </div>
            <div class="text-xs text-surface-500">Total IPs</div>
          </div>
          <div class="p-3 bg-secondary-500/10 rounded-lg text-center">
            <div class="text-2xl font-bold text-secondary-500">
              {subnetResults.usableHosts.toString()}
            </div>
            <div class="text-xs text-surface-500">Usable Hosts</div>
          </div>
        </div>

        <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded-lg text-center">
          <span class="text-sm text-surface-500">Prefix Length: </span>
          <span class="font-bold">/{subnetResults.prefixLength}</span>
        </div>
      </div>
    {/if}

    <!-- Quick Reference -->
    <div class="card p-4 bg-surface-50 dark:bg-surface-900 mt-4 space-y-3">
      <h4 class="h4 font-bold">Quick Reference</h4>
      <div class="overflow-x-auto">
        <table class="table w-full text-xs">
          <thead>
            <tr>
              <th>CIDR</th>
              <th>Netmask</th>
              <th>Hosts</th>
            </tr>
          </thead>
          <tbody>
            {#each [
              { cidr: "/8", mask: "255.0.0.0", hosts: "16.7M" },
              { cidr: "/16", mask: "255.255.0.0", hosts: "65K" },
              { cidr: "/24", mask: "255.255.255.0", hosts: "254" },
              { cidr: "/25", mask: "255.255.255.128", hosts: "126" },
              { cidr: "/26", mask: "255.255.255.192", hosts: "62" },
              { cidr: "/27", mask: "255.255.255.224", hosts: "30" },
              { cidr: "/28", mask: "255.255.255.240", hosts: "14" },
              { cidr: "/30", mask: "255.255.255.252", hosts: "2" },
              { cidr: "/32", mask: "255.255.255.255", hosts: "1" },
            ] as ref}
              <tr class="cursor-pointer hover:bg-surface-200 dark:hover:bg-surface-700" onclick={() => { subnetCidr = `192.168.1.0${ref.cidr}`; subnetMode = 'cidr'; }}>
                <td class="font-mono">{ref.cidr}</td>
                <td class="font-mono">{ref.mask}</td>
                <td>{ref.hosts}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
