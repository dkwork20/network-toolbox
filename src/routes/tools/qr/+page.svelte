<script lang="ts">
  import { QrCode, Wifi, User, Link, Mail, Phone, Download, Copy, Check, RefreshCw } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";
  import QRCode from "qrcode";

  type QRType = "text" | "url" | "wifi" | "vcard" | "email" | "phone";
  type ErrorCorrection = "L" | "M" | "Q" | "H";

  // State
  let qrType = $state<QRType>("text");

  // Text/URL
  let textContent = $state("");

  // WiFi
  let wifiSsid = $state("");
  let wifiPassword = $state("");
  let wifiSecurity = $state<"WPA" | "WEP" | "nopass">("WPA");
  let wifiHidden = $state(false);

  // vCard
  let vcardName = $state("");
  let vcardPhone = $state("");
  let vcardEmail = $state("");
  let vcardOrg = $state("");
  let vcardUrl = $state("");

  // Email
  let emailAddress = $state("");
  let emailSubject = $state("");
  let emailBody = $state("");

  // Phone
  let phoneNumber = $state("");

  // QR Options
  let size = $state(256);
  let errorCorrection = $state<ErrorCorrection>("M");
  let foregroundColor = $state("#000000");
  let backgroundColor = $state("#FFFFFF");
  let margin = $state(2);

  // Output
  let qrDataUrl = $state<string | null>(null);
  let qrSvg = $state<string | null>(null);
  let copied = $state(false);
  let isGenerating = $state(false);

  // Generate QR data string based on type
  function getQRData(): string {
    switch (qrType) {
      case "text":
        return textContent;

      case "url":
        // Ensure URL has protocol
        if (textContent && !textContent.match(/^https?:\/\//i)) {
          return `https://${textContent}`;
        }
        return textContent;

      case "wifi":
        const hidden = wifiHidden ? "H:true;" : "";
        return `WIFI:T:${wifiSecurity};S:${wifiSsid};P:${wifiPassword};${hidden};`;

      case "vcard":
        let vcard = "BEGIN:VCARD\nVERSION:3.0\n";
        if (vcardName) vcard += `FN:${vcardName}\n`;
        if (vcardPhone) vcard += `TEL:${vcardPhone}\n`;
        if (vcardEmail) vcard += `EMAIL:${vcardEmail}\n`;
        if (vcardOrg) vcard += `ORG:${vcardOrg}\n`;
        if (vcardUrl) vcard += `URL:${vcardUrl}\n`;
        vcard += "END:VCARD";
        return vcard;

      case "email":
        let email = `mailto:${emailAddress}`;
        const params = [];
        if (emailSubject) params.push(`subject=${encodeURIComponent(emailSubject)}`);
        if (emailBody) params.push(`body=${encodeURIComponent(emailBody)}`);
        if (params.length) email += `?${params.join("&")}`;
        return email;

      case "phone":
        return `tel:${phoneNumber}`;

      default:
        return textContent;
    }
  }

  // Generate QR code
  async function generateQR() {
    const data = getQRData();
    if (!data) {
      qrDataUrl = null;
      qrSvg = null;
      return;
    }

    isGenerating = true;

    try {
      const options = {
        errorCorrectionLevel: errorCorrection as "L" | "M" | "Q" | "H",
        margin: margin,
        width: size,
        color: {
          dark: foregroundColor,
          light: backgroundColor,
        },
      };

      // Generate as Data URL
      qrDataUrl = await QRCode.toDataURL(data, options);

      // Generate as SVG
      qrSvg = await QRCode.toString(data, {
        ...options,
        type: "svg" as const,
      });
    } catch (error) {
      toaster.error({ title: "Error", description: "Failed to generate QR code" });
    }

    isGenerating = false;
  }

  // Download as PNG
  function downloadPNG() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qrcode-${Date.now()}.png`;
    link.click();
  }

  // Download as SVG
  function downloadSVG() {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qrcode-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Copy to clipboard (as image)
  async function copyToClipboard() {
    if (!qrDataUrl) return;

    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      copied = true;
      toaster.success({ title: "Copied!", description: "QR code copied to clipboard" });
      setTimeout(() => (copied = false), 1500);
    } catch {
      toaster.error({ title: "Error", description: "Failed to copy to clipboard" });
    }
  }

  // Clear all
  function clearAll() {
    textContent = "";
    wifiSsid = "";
    wifiPassword = "";
    vcardName = "";
    vcardPhone = "";
    vcardEmail = "";
    vcardOrg = "";
    vcardUrl = "";
    emailAddress = "";
    emailSubject = "";
    emailBody = "";
    phoneNumber = "";
    qrDataUrl = null;
    qrSvg = null;
  }

  // Auto-generate on changes
  $effect(() => {
    generateQR();
  });
</script>

<svelte:head>
  <title>QR Code Generator - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-5xl pb-20">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <QrCode class="size-8 text-primary-500" />
      QR Code Generator
      <span class="badge variant-filled-secondary text-xs">V0.7</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Generate QR codes for URLs, WiFi, contacts, and more
    </p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Input Section -->
    <div class="space-y-6">
      <!-- Type Selection -->
      <div class="card p-4 bg-surface-50 dark:bg-surface-900">
        <div class="flex flex-wrap gap-2">
          <button
            class="btn btn-sm {qrType === 'text' ? 'variant-filled-primary' : 'variant-soft-surface'}"
            onclick={() => (qrType = 'text')}
          >
            Text
          </button>
          <button
            class="btn btn-sm {qrType === 'url' ? 'variant-filled-primary' : 'variant-soft-surface'}"
            onclick={() => (qrType = 'url')}
          >
            <Link class="size-4" />
            URL
          </button>
          <button
            class="btn btn-sm {qrType === 'wifi' ? 'variant-filled-primary' : 'variant-soft-surface'}"
            onclick={() => (qrType = 'wifi')}
          >
            <Wifi class="size-4" />
            WiFi
          </button>
          <button
            class="btn btn-sm {qrType === 'vcard' ? 'variant-filled-primary' : 'variant-soft-surface'}"
            onclick={() => (qrType = 'vcard')}
          >
            <User class="size-4" />
            vCard
          </button>
          <button
            class="btn btn-sm {qrType === 'email' ? 'variant-filled-primary' : 'variant-soft-surface'}"
            onclick={() => (qrType = 'email')}
          >
            <Mail class="size-4" />
            Email
          </button>
          <button
            class="btn btn-sm {qrType === 'phone' ? 'variant-filled-primary' : 'variant-soft-surface'}"
            onclick={() => (qrType = 'phone')}
          >
            <Phone class="size-4" />
            Phone
          </button>
        </div>
      </div>

      <!-- Content Input -->
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
        {#if qrType === 'text' || qrType === 'url'}
          <label class="label">
            <span>{qrType === 'url' ? 'URL' : 'Text Content'}</span>
            <textarea
              class="textarea font-mono"
              rows="3"
              bind:value={textContent}
              placeholder={qrType === 'url' ? 'https://example.com' : 'Enter text...'}
            ></textarea>
          </label>
        {:else if qrType === 'wifi'}
          <label class="label">
            <span>Network Name (SSID)</span>
            <input type="text" class="input" bind:value={wifiSsid} placeholder="MyWiFi" />
          </label>
          <label class="label">
            <span>Password</span>
            <input type="password" class="input" bind:value={wifiPassword} placeholder="********" />
          </label>
          <label class="label">
            <span>Security Type</span>
            <select class="select" bind:value={wifiSecurity}>
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No Password</option>
            </select>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="checkbox" bind:checked={wifiHidden} />
            <span>Hidden Network</span>
          </label>
        {:else if qrType === 'vcard'}
          <label class="label">
            <span>Full Name</span>
            <input type="text" class="input" bind:value={vcardName} placeholder="John Doe" />
          </label>
          <label class="label">
            <span>Phone</span>
            <input type="tel" class="input" bind:value={vcardPhone} placeholder="+1 555 123 4567" />
          </label>
          <label class="label">
            <span>Email</span>
            <input type="email" class="input" bind:value={vcardEmail} placeholder="john@example.com" />
          </label>
          <label class="label">
            <span>Organization</span>
            <input type="text" class="input" bind:value={vcardOrg} placeholder="Company Inc." />
          </label>
          <label class="label">
            <span>Website</span>
            <input type="url" class="input" bind:value={vcardUrl} placeholder="https://example.com" />
          </label>
        {:else if qrType === 'email'}
          <label class="label">
            <span>Email Address</span>
            <input type="email" class="input" bind:value={emailAddress} placeholder="john@example.com" />
          </label>
          <label class="label">
            <span>Subject (Optional)</span>
            <input type="text" class="input" bind:value={emailSubject} placeholder="Hello!" />
          </label>
          <label class="label">
            <span>Body (Optional)</span>
            <textarea class="textarea" rows="2" bind:value={emailBody} placeholder="Your message..."></textarea>
          </label>
        {:else if qrType === 'phone'}
          <label class="label">
            <span>Phone Number</span>
            <input type="tel" class="input" bind:value={phoneNumber} placeholder="+1 555 123 4567" />
          </label>
        {/if}
      </div>

      <!-- Options -->
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
        <h2 class="font-medium">Customization</h2>

        <div class="grid grid-cols-2 gap-4">
          <label class="label">
            <span>Size: {size}px</span>
            <input type="range" class="range-slider" min="128" max="512" step="32" bind:value={size} />
          </label>

          <label class="label">
            <span>Error Correction</span>
            <select class="select" bind:value={errorCorrection}>
              <option value="L">Low (7%)</option>
              <option value="M">Medium (15%)</option>
              <option value="Q">Quartile (25%)</option>
              <option value="H">High (30%)</option>
            </select>
          </label>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <label class="label">
            <span>Foreground</span>
            <input type="color" class="input h-10 p-1" bind:value={foregroundColor} />
          </label>

          <label class="label">
            <span>Background</span>
            <input type="color" class="input h-10 p-1" bind:value={backgroundColor} />
          </label>
        </div>

        <label class="label">
          <span>Margin: {margin}</span>
          <input type="range" class="range-slider" min="0" max="4" bind:value={margin} />
        </label>
      </div>
    </div>

    <!-- Output Section -->
    <div class="space-y-6">
      <div class="card p-6 bg-surface-50 dark:bg-surface-900 space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="font-medium">Generated QR Code</h2>
          <button class="btn btn-sm variant-ghost-surface" onclick={clearAll}>
            <RefreshCw class="size-4" />
            Clear
          </button>
        </div>

        <div class="flex items-center justify-center p-8 bg-white rounded-lg min-h-[300px]">
          {#if qrDataUrl}
            <img src={qrDataUrl} alt="QR Code" class="max-w-full" style="width: {size}px;" />
          {:else}
            <p class="text-surface-400">QR code will appear here</p>
          {/if}
        </div>

        {#if qrDataUrl}
          <div class="flex flex-wrap gap-2">
            <button class="btn variant-filled-primary flex-1" onclick={downloadPNG}>
              <Download class="size-4" />
              Download PNG
            </button>
            <button class="btn variant-soft-surface flex-1" onclick={downloadSVG}>
              <Download class="size-4" />
              Download SVG
            </button>
            <button class="btn variant-soft-surface" onclick={copyToClipboard}>
              {#if copied}
                <Check class="size-4 text-success-500" />
              {:else}
                <Copy class="size-4" />
              {/if}
            </button>
          </div>
        {/if}
      </div>

      <!-- Preview Data -->
      {#if qrDataUrl}
        <div class="card p-4 bg-surface-50 dark:bg-surface-900">
          <h3 class="font-medium mb-2">Encoded Data</h3>
          <pre class="text-xs font-mono bg-surface-100 dark:bg-surface-800 p-3 rounded overflow-auto max-h-32">{getQRData()}</pre>
        </div>
      {/if}
    </div>
  </div>
</div>
