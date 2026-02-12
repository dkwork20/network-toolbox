<script lang="ts">
  import { Palette, Copy, Check, Contrast, RefreshCw } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  interface ColorFormats {
    hex: string;
    hexShort: string;
    rgb: string;
    rgba: string;
    hsl: string;
    hsla: string;
    cmyk: string;
    rgbValues: { r: number; g: number; b: number };
    hslValues: { h: number; s: number; l: number };
    cmykValues: { c: number; m: number; y: number; k: number };
  }

  // State
  let hexColor = $state("#3B82F6");
  let alpha = $state(1);
  let colorFormats = $state<ColorFormats | null>(null);
  let copiedFormat = $state<string | null>(null);

  // Contrast checker
  let compareColor = $state("#FFFFFF");
  let contrastRatio = $state<number | null>(null);
  let wcagAA = $state<boolean>(false);
  let wcagAAA = $state<boolean>(false);

  // Parse HEX to RGB
  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  // RGB to HEX
  function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  }

  // RGB to HSL
  function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  // RGB to CMYK
  function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
    if (r === 0 && g === 0 && b === 0) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    const c = 1 - r / 255;
    const m = 1 - g / 255;
    const y = 1 - b / 255;
    const k = Math.min(c, m, y);

    return {
      c: Math.round(((c - k) / (1 - k)) * 100),
      m: Math.round(((m - k) / (1 - k)) * 100),
      y: Math.round(((y - k) / (1 - k)) * 100),
      k: Math.round(k * 100),
    };
  }

  // Calculate all formats
  function calculateFormats() {
    const rgb = hexToRgb(hexColor);
    if (!rgb) {
      colorFormats = null;
      return;
    }

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

    // Short hex (if possible)
    const hexShort = /^#([a-f\d])\1([a-f\d])\2([a-f\d])\3$/i.test(hexColor)
      ? hexColor.replace(/^#([a-f\d])\1([a-f\d])\2([a-f\d])\3$/i, "#$1$2$3")
      : hexColor;

    colorFormats = {
      hex: hexColor.toUpperCase(),
      hexShort: hexShort.toUpperCase(),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hsla: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`,
      cmyk: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
      rgbValues: rgb,
      hslValues: hsl,
      cmykValues: cmyk,
    };

    // Calculate contrast
    calculateContrast();
  }

  // Calculate relative luminance for WCAG
  function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Calculate contrast ratio
  function calculateContrast() {
    const rgb1 = hexToRgb(hexColor);
    const rgb2 = hexToRgb(compareColor);

    if (!rgb1 || !rgb2) {
      contrastRatio = null;
      return;
    }

    const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    contrastRatio = (lighter + 0.05) / (darker + 0.05);

    // WCAG AA: 4.5:1 for normal text, 3:1 for large text
    // WCAG AAA: 7:1 for normal text, 4.5:1 for large text
    wcagAA = contrastRatio >= 4.5;
    wcagAAA = contrastRatio >= 7;
  }

  // Copy format
  async function copyFormat(format: string, value: string) {
    await navigator.clipboard.writeText(value);
    copiedFormat = format;
    toaster.success({ title: "Copied!", description: `${format} copied` });
    setTimeout(() => (copiedFormat = null), 1500);
  }

  // Random color
  function randomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    hexColor = rgbToHex(r, g, b);
  }

  // Auto-calculate on changes
  $effect(() => {
    calculateFormats();
  });
</script>

<svelte:head>
  <title>Color Picker & Converter - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-5xl pb-20">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Palette class="size-8 text-primary-500" />
      Color Picker & Converter
      <span class="badge variant-filled-secondary text-xs">V0.6</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Pick colors, convert between formats, and check accessibility contrast
    </p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Color Picker -->
    <div class="space-y-6">
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
        <h2 class="h2 font-bold">Select Color</h2>

        <!-- Native Color Picker -->
        <div class="flex gap-4 items-center">
          <input
            type="color"
            class="w-20 h-20 rounded-lg cursor-pointer border-0"
            bind:value={hexColor}
          />
          <div class="flex-1">
            <label class="label">
              <span>HEX</span>
              <input
                type="text"
                class="input font-mono uppercase"
                bind:value={hexColor}
                maxlength={7}
              />
            </label>
          </div>
          <button class="btn variant-soft-surface" onclick={randomColor}>
            <RefreshCw class="size-4" />
            Random
          </button>
        </div>

        <!-- Alpha -->
        <label class="label">
          <span>Alpha: {alpha.toFixed(2)}</span>
          <input
            type="range"
            class="range-slider"
            min="0"
            max="1"
            step="0.01"
            bind:value={alpha}
          />
        </label>

        <!-- Color Preview -->
        {#if colorFormats}
          <div
            class="h-32 rounded-lg border border-surface-500/20"
            style="background-color: {colorFormats.rgba};"
          ></div>
        {/if}
      </div>

      <!-- Contrast Checker -->
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
        <h2 class="h2 font-bold flex items-center gap-2">
          <Contrast class="size-6 text-primary-500" />
          Contrast Checker
        </h2>

        <div class="flex gap-4 items-center">
          <div class="flex-1">
            <label class="label">
              <span>Text Color</span>
              <input type="color" class="w-full h-10 rounded cursor-pointer" bind:value={hexColor} />
            </label>
          </div>
          <div class="flex-1">
            <label class="label">
              <span>Background</span>
              <input type="color" class="w-full h-10 rounded cursor-pointer" bind:value={compareColor} />
            </label>
          </div>
        </div>

        <!-- Preview -->
        <div
          class="p-6 rounded-lg text-center"
          style="background-color: {compareColor}; color: {hexColor};"
        >
          <p class="text-2xl font-bold">Sample Text</p>
          <p class="text-sm">This is how your text will look</p>
        </div>

        {#if contrastRatio}
          <div class="grid grid-cols-3 gap-4">
            <div class="p-4 bg-surface-100 dark:bg-surface-800 rounded-lg text-center">
              <div class="text-2xl font-bold">{contrastRatio.toFixed(2)}:1</div>
              <div class="text-xs text-surface-500">Ratio</div>
            </div>
            <div class="p-4 rounded-lg text-center {wcagAA ? 'bg-success-500/20' : 'bg-error-500/20'}">
              <div class="text-2xl font-bold {wcagAA ? 'text-success-500' : 'text-error-500'}">
                {wcagAA ? '✓' : '✗'}
              </div>
              <div class="text-xs text-surface-500">WCAG AA</div>
            </div>
            <div class="p-4 rounded-lg text-center {wcagAAA ? 'bg-success-500/20' : 'bg-error-500/20'}">
              <div class="text-2xl font-bold {wcagAAA ? 'text-success-500' : 'text-error-500'}">
                {wcagAAA ? '✓' : '✗'}
              </div>
              <div class="text-xs text-surface-500">WCAG AAA</div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Format Output -->
    <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
      <h2 class="h2 font-bold">Color Formats</h2>

      {#if colorFormats}
        <div class="space-y-3">
          {#each [
            { label: "HEX", value: colorFormats.hex, key: "hex" },
            { label: "HEX Short", value: colorFormats.hexShort, key: "hexShort" },
            { label: "RGB", value: colorFormats.rgb, key: "rgb" },
            { label: "RGBA", value: colorFormats.rgba, key: "rgba" },
            { label: "HSL", value: colorFormats.hsl, key: "hsl" },
            { label: "HSLA", value: colorFormats.hsla, key: "hsla" },
            { label: "CMYK", value: colorFormats.cmyk, key: "cmyk" },
          ] as format}
            <div class="flex justify-between items-center p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <div>
                <span class="text-xs text-surface-500">{format.label}</span>
                <code class="block font-mono text-sm">{format.value}</code>
              </div>
              <button
                class="btn-icon btn-icon-sm"
                onclick={() => copyFormat(format.label, format.value)}
              >
                {#if copiedFormat === format.label}
                  <Check class="size-4 text-success-500" />
                {:else}
                  <Copy class="size-4" />
                {/if}
              </button>
            </div>
          {/each}
        </div>

        <!-- Values Breakdown -->
        <div class="mt-6 space-y-4">
          <h3 class="font-medium">Values Breakdown</h3>

          <div class="grid grid-cols-3 gap-2">
            <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded text-center">
              <div class="text-lg font-bold text-red-500">{colorFormats.rgbValues.r}</div>
              <div class="text-xs text-surface-500">Red</div>
            </div>
            <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded text-center">
              <div class="text-lg font-bold text-green-500">{colorFormats.rgbValues.g}</div>
              <div class="text-xs text-surface-500">Green</div>
            </div>
            <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded text-center">
              <div class="text-lg font-bold text-blue-500">{colorFormats.rgbValues.b}</div>
              <div class="text-xs text-surface-500">Blue</div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded text-center">
              <div class="text-lg font-bold">{colorFormats.hslValues.h}°</div>
              <div class="text-xs text-surface-500">Hue</div>
            </div>
            <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded text-center">
              <div class="text-lg font-bold">{colorFormats.hslValues.s}%</div>
              <div class="text-xs text-surface-500">Saturation</div>
            </div>
            <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded text-center">
              <div class="text-lg font-bold">{colorFormats.hslValues.l}%</div>
              <div class="text-xs text-surface-500">Lightness</div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
