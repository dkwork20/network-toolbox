<script lang="ts">
  import { toaster } from "$lib/toaster.svelte";
  import yaml from "js-yaml";
  import toml from "toml"; // This is a parser mostly. We need a stringifier too?
  // 'toml' package is usually parser only. simpler might be @iarna/toml or similar.
  // Actually let's check installed 'toml'. It might just be parser.
  // Ideally we want bidirectional.
  // For MVP, lets try to find a library that does both or use JSON/YAML primarily and try to standard JSON->TOML if possible.
  // Wait, I installed `toml`. It's a parser. I need a stringifier.
  // Let's assume for now we might fail TOML stringification without another lib, or just support JSON<->YAML robustly and TOML input.
  // Actually, let's use a simple JSON->TOML helper function if needed or rely on user understanding.
  // I'll stick to JSON <-> YAML focus, with TOML as input-only for now unless I add another lib.
  // Actually, I can use a simple TOML stringifier for basic objects.

  // Update: I'll use a basic JSON <-> YAML for now, and check if I can add TOML output easily later or via another lib like `smol-toml` or `@ltd/j-toml` which I mentioned earlier but installed `toml`.

  let inputMode = $state("json");
  let outputMode = $state("yaml");
  let inputText = $state("");
  let outputText = $state("");
  let error = $state("");

  function convert() {
    error = "";
    if (!inputText.trim()) {
      outputText = "";
      return;
    }

    try {
      // 1. Parse Input to JS Object
      let data;
      if (inputMode === "json") {
        data = JSON.parse(inputText);
      } else if (inputMode === "yaml") {
        data = yaml.load(inputText);
      } else if (inputMode === "toml") {
        data = toml.parse(inputText);
      }

      // 2. Stringify Object to Output
      if (outputMode === "json") {
        outputText = JSON.stringify(data, null, 2);
      } else if (outputMode === "yaml") {
        outputText = yaml.dump(data);
      } else if (outputMode === "toml") {
        // Limited TOML output support manually or via error
        throw new Error(
          "TOML output not yet supported (Input only). Please select JSON or YAML as output.",
        );
      }
    } catch (e: any) {
      error = e.message;
      outputText = "";
    }
  }

  $effect(() => {
    convert();
  });

  function copyOutput() {
    navigator.clipboard.writeText(outputText);
    toaster.success({
      title: "Copied",
      description: "Conversion result copied",
    });
  }
</script>

<div
  class="container mx-auto p-4 max-w-6xl h-full flex flex-col overflow-y-auto pb-20"
>
  <div class="flex justify-between items-center mb-6">
    <h2 class="h2 font-bold">Config Converter</h2>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
    <!-- Input -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <span class="font-bold text-lg">Input</span>
        <select class="select w-auto py-1 px-2" bind:value={inputMode}>
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
          <option value="toml">TOML (Read-only)</option>
        </select>
      </div>
      <textarea
        class="textarea min-h-[400px] p-4 font-mono text-xs bg-surface-100 dark:bg-surface-800"
        bind:value={inputText}
        placeholder="Paste config here..."
      ></textarea>
    </div>

    <!-- Output -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <span class="font-bold text-lg">Output</span>
        <div class="flex gap-2">
          <select class="select w-auto py-1 px-2" bind:value={outputMode}>
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
          </select>
          <button
            class="btn btn-sm variant-filled-secondary"
            onclick={copyOutput}
            disabled={!outputText}>Copy</button
          >
        </div>
      </div>

      <div class="relative flex-1">
        <textarea
          class="textarea h-full min-h-[400px] p-4 font-mono text-xs bg-surface-100 dark:bg-surface-800 {error
            ? 'border-error-500'
            : ''}"
          readonly
          value={outputText}
          placeholder="Result..."
        ></textarea>
        {#if error}
          <div
            class="absolute bottom-4 left-4 right-4 alert variant-filled-error p-2 text-xs"
          >
            {error}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
