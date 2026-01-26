<script lang="ts">
  import { onMount } from "svelte";

  let localIps = $state<Set<string>>(new Set());
  let publicIps = $state<Set<string>>(new Set());
  let scanning = $state(false);
  let error = $state("");

  async function startScan() {
    scanning = true;
    localIps = new Set();
    publicIps = new Set();
    error = "";

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      pc.createDataChannel(""); // create a bogus data channel

      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          scanning = false;
          pc.close();
          return;
        }

        // Parse candidate
        // Format: candidate:842163049 1 udp 1677729535 192.168.1.5 56502 typ host generation 0 ufrag ...
        const parts = e.candidate.candidate.split(" ");
        if (parts.length >= 5) {
          const ip = parts[4];
          const type = parts[7]; // host, srflx, relay

          // Identify type
          if (type === "host") {
            // Check if actually private or public (some people have public host IPs)
            // Simple regex for private
            if (
              /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2[0-9]\.)|(^172\.3[0-1]\.)|(^192\.168\.)/.test(
                ip,
              ) ||
              ip.endsWith(".local")
            ) {
              localIps = new Set(localIps.add(ip));
            } else if (ip.includes(":")) {
              // IPv6
              // Assume host IPv6 might be global unicast (public-ish) but listed as 'host'
              // Link local fe80...
              if (ip.startsWith("fe80") || ip === "::1") {
                localIps = new Set(localIps.add(ip));
              } else {
                // Global IPv6
                publicIps = new Set(publicIps.add(ip));
              }
            } else {
              // Public IPv4 'host'
              publicIps = new Set(publicIps.add(ip));
            }
          } else if (type === "srflx") {
            publicIps = new Set(publicIps.add(ip));
          }
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Timeout to stop scanning if valid end fails
      setTimeout(() => {
        if (scanning) {
          scanning = false;
          pc.close();
        }
      }, 5000);
    } catch (err: any) {
      error = err.message || "Failed to start WebRTC";
      scanning = false;
    }
  }
</script>

<div
  class="container mx-auto p-4 max-w-4xl h-full flex flex-col overflow-y-auto pb-20"
>
  <div class="flex justify-between items-center mb-6">
    <h2 class="h2 font-bold">Network Diagnostics</h2>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <!-- Panel 1: WebRTC Test -->
    <div
      class="bg-surface-50 dark:bg-surface-900 border border-surface-500/30 p-6 rounded-xl space-y-4"
    >
      <h3 class="h3 font-bold">WebRTC IP Leak Test</h3>
      <p class="text-sm opacity-70">
        This test uses your browser's WebRTC capability to discover local LAN
        IPs and your public IP (via STUN). This attempts to simulate what a
        website can see even through some VPN configurations.
      </p>

      <button
        class="btn variant-filled-primary font-bold"
        onclick={startScan}
        disabled={scanning}
      >
        {scanning ? "Scanning..." : "Start Scan"}
      </button>

      {#if error}
        <div class="alert variant-filled-error p-2 text-sm">{error}</div>
      {/if}

      <div class="space-y-4 pt-4">
        <div>
          <h4 class="font-bold text-sm text-surface-500 uppercase mb-2">
            Local / LAN IPs
          </h4>
          {#if localIps.size > 0}
            <div class="flex flex-wrap gap-2">
              {#each Array.from(localIps) as ip}
                <span class="badge variant-soft-secondary font-mono">{ip}</span>
              {/each}
            </div>
          {:else}
            <span class="text-xs opacity-50 italic">None detected yet...</span>
          {/if}
        </div>
        <div>
          <h4 class="font-bold text-sm text-surface-500 uppercase mb-2">
            Public / STUN IPs
          </h4>
          {#if publicIps.size > 0}
            <div class="flex flex-wrap gap-2">
              {#each Array.from(publicIps) as ip}
                <span class="badge variant-filled-error font-mono">{ip}</span>
              {/each}
            </div>
          {:else}
            <span class="text-xs opacity-50 italic">None detected yet...</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Panel 2: Connectivity Check (Placeholder) -->
    <div
      class="bg-surface-50 dark:bg-surface-900 border border-surface-500/30 p-6 rounded-xl space-y-4 opacity-70"
    >
      <h3 class="h3 font-bold">Latency Check</h3>
      <p class="text-sm">
        Coming soon: Check latency to Cloudflare, Google, and AWS regions.
      </p>
    </div>
  </div>
</div>
