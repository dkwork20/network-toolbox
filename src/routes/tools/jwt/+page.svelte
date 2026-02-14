<script lang="ts">
  import { toaster } from "$lib/toaster.svelte";

  let jwtInput = $state("");

  // Decoded parts
  let header = $state({});
  let payload = $state({});
  let signature = $state("");
  let error = $state("");

  function decode() {
    error = "";
    if (!jwtInput) {
      header = {};
      payload = {};
      signature = "";
      return;
    }

    try {
      const parts = jwtInput.split(".");
      if (parts.length !== 3) {
        throw new Error(
          "Invalid JWT format: Must have 3 parts separated by dots.",
        );
      }

      // Helper to base64url decode
      const b64Decode = (str: string) => {
        // Fix padding
        let output = str.replace(/-/g, "+").replace(/_/g, "/");
        switch (output.length % 4) {
          case 0:
            break;
          case 2:
            output += "==";
            break;
          case 3:
            output += "=";
            break;
          default:
            throw new Error("Illegal base64url string!");
        }
        // Decode
        try {
          return decodeURIComponent(
            atob(output)
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join(""),
          );
        } catch (e) {
          return atob(output);
        }
      };

      header = JSON.parse(b64Decode(parts[0]));
      payload = JSON.parse(b64Decode(parts[1]));
      signature = parts[2];
    } catch (e: any) {
      error = e.message || "Failed to decode JWT";
      header = {};
      payload = {};
      signature = "";
    }
  }

  // Reactive decoding on input change
  $effect(() => {
    decode();
  });

  function copyPayload() {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toaster.success({
      title: "Copied",
      description: "Payload copied to clipboard",
    });
  }
</script>

<div
  class="container mx-auto p-4 max-w-6xl h-full flex flex-col overflow-y-auto pb-20"
>
  <div class="flex justify-between items-center mb-6">
    <h2 class="h2 font-bold">JWT Debugger</h2>
    <span class="badge preset-filled-secondary-500 text-xs">V0.5</span>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
    <!-- Input -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <span class="font-bold text-lg">Encoded Token</span>
      </div>
      <textarea
        class="textarea min-h-[300px] p-4 font-mono text-xs bg-surface-100 dark:bg-surface-800 break-all"
        bind:value={jwtInput}
        placeholder="Paste JWT here (header.payload.signature)"
      ></textarea>
      {#if error}
        <div class="alert preset-filled-error-500 p-2 text-sm">{error}</div>
      {/if}
    </div>

    <!-- Output -->
    <div class="flex flex-col gap-4">
      <!-- Header -->
      <div
        class="bg-surface-50 dark:bg-surface-900 border border-surface-500/30 p-4 rounded-xl"
      >
        <h3 class="font-bold text-sm text-surface-500 uppercase mb-2">
          Header
        </h3>
        <pre
          class="overflow-x-auto text-xs font-mono text-primary-500">{JSON.stringify(
            header,
            null,
            2,
          )}</pre>
      </div>

      <!-- Payload -->
      <div
        class="bg-surface-50 dark:bg-surface-900 border border-surface-500/30 p-4 rounded-xl flex-1"
      >
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-bold text-sm text-surface-500 uppercase">Payload</h3>
          <button
            class="btn btn-xs preset-tonal-secondary"
            onclick={copyPayload}
            disabled={!payload || Object.keys(payload).length === 0}
            >Copy</button
          >
        </div>
        <pre
          class="overflow-x-auto text-xs font-mono text-secondary-500">{JSON.stringify(
            payload,
            null,
            2,
          )}</pre>
      </div>

      <!-- Signature -->
      <div
        class="bg-surface-50 dark:bg-surface-900 border border-surface-500/30 p-4 rounded-xl"
      >
        <h3 class="font-bold text-sm text-surface-500 uppercase mb-2">
          Signature
        </h3>
        <code class="break-all text-xs font-mono text-tertiary-500"
          >{signature || "..."}</code
        >
      </div>
    </div>
  </div>
</div>
