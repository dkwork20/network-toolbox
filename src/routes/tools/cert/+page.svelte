<script lang="ts">
  import { toaster } from "$lib/toaster.svelte";
  import { X509Certificate } from "@peculiar/x509";

  let certInput = $state("");
  let certDetails = $state<any>(null);
  let error = $state("");

  function parseCert() {
    error = "";
    certDetails = null;

    if (!certInput.trim()) return;

    try {
      // Try parsing
      const cert = new X509Certificate(certInput);

      certDetails = {
        subject: cert.subject,
        issuer: cert.issuer,
        serialNumber: cert.serialNumber,
        notBefore: cert.notBefore,
        notAfter: cert.notAfter,
        signatureAlgorithm: cert.signatureAlgorithm.name,
        publicKey: {
          algorithm: cert.publicKey.algorithm.name,
        },
      };
    } catch (e: any) {
      error =
        "Failed to parse certificate. Ensure it is a valid PEM format (starts with -----BEGIN CERTIFICATE-----).";
      console.error(e);
    }
  }

  // Reactive decoding
  $effect(() => {
    parseCert();
  });

  function copyDetails() {
    if (!certDetails) return;
    navigator.clipboard.writeText(JSON.stringify(certDetails, null, 2));
    toaster.success({ title: "Copied", description: "JSON details copied" });
  }
</script>

<div
  class="container mx-auto p-4 max-w-6xl h-full flex flex-col overflow-y-auto pb-20"
>
  <div class="flex justify-between items-center mb-6">
    <h2 class="h2 font-bold">X.509 Certificate Decoder</h2>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
    <!-- Input -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <span class="font-bold text-lg">Certificate (PEM)</span>
      </div>
      <textarea
        class="textarea min-h-[400px] p-4 font-mono text-xs bg-surface-100 dark:bg-surface-800 break-all"
        bind:value={certInput}
        placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDlzCCAn+gAwIBAgIQCgAAAA...&#10;-----END CERTIFICATE-----"
      ></textarea>
      {#if error}
        <div class="alert variant-filled-error p-2 text-sm">{error}</div>
      {/if}
    </div>

    <!-- Output -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <span class="font-bold text-lg">Decoded Details</span>
        <button
          class="btn btn-xs variant-soft-secondary"
          onclick={copyDetails}
          disabled={!certDetails}>Copy JSON</button
        >
      </div>

      <div
        class="bg-surface-50 dark:bg-surface-900 border border-surface-500/30 p-6 rounded-xl flex-1 space-y-4 overflow-y-auto max-h-[600px]"
      >
        {#if certDetails}
          <div>
            <h4 class="font-bold text-sm text-surface-500 uppercase mb-1">
              Subject
            </h4>
            <p class="font-mono text-sm break-all">{certDetails.subject}</p>
          </div>
          <hr class="opacity-10" />
          <div>
            <h4 class="font-bold text-sm text-surface-500 uppercase mb-1">
              Issuer
            </h4>
            <p class="font-mono text-sm break-all">{certDetails.issuer}</p>
          </div>
          <hr class="opacity-10" />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 class="font-bold text-sm text-surface-500 uppercase mb-1">
                Not Before
              </h4>
              <p class="font-mono text-sm">
                {certDetails.notBefore.toLocaleString()}
              </p>
            </div>
            <div>
              <h4 class="font-bold text-sm text-surface-500 uppercase mb-1">
                Not After
              </h4>
              <p
                class="font-mono text-sm {new Date() > certDetails.notAfter
                  ? 'text-error-500 font-bold'
                  : 'text-success-500'}"
              >
                {certDetails.notAfter.toLocaleString()}
                {new Date() > certDetails.notAfter ? "(Expired)" : ""}
              </p>
            </div>
          </div>
          <hr class="opacity-10" />
          <div>
            <h4 class="font-bold text-sm text-surface-500 uppercase mb-1">
              Serial Number
            </h4>
            <p class="font-mono text-sm break-all">
              {certDetails.serialNumber}
            </p>
          </div>
          <div>
            <h4 class="font-bold text-sm text-surface-500 uppercase mb-1">
              Algorithms
            </h4>
            <p class="font-mono text-sm">
              Signature: {certDetails.signatureAlgorithm}
            </p>
            <p class="font-mono text-sm">
              Key: {certDetails.publicKey.algorithm}
            </p>
          </div>
        {:else}
          <div
            class="h-full flex items-center justify-center opacity-50 italic text-sm"
          >
            Enter a valid PEM certificate to see details.
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
