<script lang="ts">
  import { toaster } from "$lib/toaster.svelte";
  import yaml from "js-yaml";
  import toml from "toml";
  import { stringify as tomlStringify } from "smol-toml";

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
      let data: any;
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
        outputText = yaml.dump(data, { indent: 2, lineWidth: -1 });
      } else if (outputMode === "toml") {
        outputText = tomlStringify(data);
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
    <span class="badge preset-filled-secondary-500 text-xs">V0.5</span>
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
            <option value="toml">TOML</option>
          </select>
          <button
            class="btn btn-sm preset-filled-secondary-500"
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
            class="absolute bottom-4 left-4 right-4 alert preset-filled-error-500 p-2 text-xs"
          >
            {error}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
