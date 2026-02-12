<script lang="ts">
  import { Container, Plus, Trash2, Copy, Check, Download, RefreshCw } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";

  interface Service {
    id: string;
    name: string;
    image: string;
    ports: string[];
    volumes: string[];
    environment: string[];
    depends_on: string[];
    restart: "always" | "unless-stopped" | "on-failure" | "no";
    networks: string[];
    command: string;
    labels: string[];
  }

  interface Network {
    id: string;
    name: string;
    driver: "bridge" | "overlay" | "host" | "none";
  }

  // Templates
  const templates: { name: string; services: Partial<Service>[] }[] = [
    {
      name: "Web Server (Nginx)",
      services: [
        {
          name: "nginx",
          image: "nginx:alpine",
          ports: ["80:80", "443:443"],
          volumes: ["./html:/usr/share/nginx/html", "./conf.d:/etc/nginx/conf.d"],
          restart: "always",
        },
      ],
    },
    {
      name: "Database (PostgreSQL)",
      services: [
        {
          name: "postgres",
          image: "postgres:15-alpine",
          environment: ["POSTGRES_USER=admin", "POSTGRES_PASSWORD=secret", "POSTGRES_DB=mydb"],
          volumes: ["postgres_data:/var/lib/postgresql/data"],
          ports: ["5432:5432"],
          restart: "always",
        },
      ],
    },
    {
      name: "Database (MySQL)",
      services: [
        {
          name: "mysql",
          image: "mysql:8",
          environment: ["MYSQL_ROOT_PASSWORD=secret", "MYSQL_DATABASE=mydb"],
          volumes: ["mysql_data:/var/lib/mysql"],
          ports: ["3306:3306"],
          restart: "always",
        },
      ],
    },
    {
      name: "Cache (Redis)",
      services: [
        {
          name: "redis",
          image: "redis:alpine",
          ports: ["6379:6379"],
          restart: "always",
        },
      ],
    },
    {
      name: "Full Stack (Nginx + Node + Postgres + Redis)",
      services: [
        {
          name: "nginx",
          image: "nginx:alpine",
          ports: ["80:80"],
          volumes: ["./nginx.conf:/etc/nginx/nginx.conf:ro"],
          depends_on: ["app"],
          restart: "always",
        },
        {
          name: "app",
          image: "node:18-alpine",
          command: "npm start",
          environment: ["NODE_ENV=production", "DATABASE_URL=postgres://admin:secret@postgres:5432/mydb"],
          depends_on: ["postgres", "redis"],
          restart: "always",
        },
        {
          name: "postgres",
          image: "postgres:15-alpine",
          environment: ["POSTGRES_USER=admin", "POSTGRES_PASSWORD=secret", "POSTGRES_DB=mydb"],
          volumes: ["postgres_data:/var/lib/postgresql/data"],
          restart: "always",
        },
        {
          name: "redis",
          image: "redis:alpine",
          restart: "always",
        },
      ],
    },
  ];

  // State
  let services = $state<Service[]>([]);
  let networks = $state<Network[]>([{ id: crypto.randomUUID(), name: "default", driver: "bridge" }]);
  let composeVersion = $state("3.8");
  let copied = $state(false);
  let selectedTemplate = $state("");

  // Add new service
  function addService() {
    const newService: Service = {
      id: crypto.randomUUID(),
      name: `service${services.length + 1}`,
      image: "",
      ports: [],
      volumes: [],
      environment: [],
      depends_on: [],
      restart: "always",
      networks: [],
      command: "",
      labels: [],
    };
    services = [...services, newService];
  }

  // Remove service
  function removeService(id: string) {
    services = services.filter((s) => s.id !== id);
  }

  // Add network
  function addNetwork() {
    networks = [...networks, { id: crypto.randomUUID(), name: "", driver: "bridge" }];
  }

  // Remove network
  function removeNetwork(id: string) {
    networks = networks.filter((n) => n.id !== id);
  }

  // Apply template
  function applyTemplate(templateName: string) {
    const template = templates.find((t) => t.name === templateName);
    if (!template) return;

    services = template.services.map((s) => ({
      id: crypto.randomUUID(),
      name: s.name || "",
      image: s.image || "",
      ports: s.ports || [],
      volumes: s.volumes || [],
      environment: s.environment || [],
      depends_on: s.depends_on || [],
      restart: s.restart || "always",
      networks: s.networks || [],
      command: s.command || "",
      labels: s.labels || [],
    }));

    selectedTemplate = "";
    toaster.success({ title: "Template Applied", description: templateName });
  }

  // Generate YAML
  function generateYaml(): string {
    let yaml = `version: "${composeVersion}"\n\n`;

    // Services
    yaml += "services:\n";
    for (const service of services) {
      yaml += `  ${service.name}:\n`;
      yaml += `    image: ${service.image}\n`;

      if (service.restart !== "no") {
        yaml += `    restart: ${service.restart}\n`;
      }

      if (service.ports.length > 0) {
        yaml += "    ports:\n";
        for (const port of service.ports) {
          if (port) yaml += `      - "${port}"\n`;
        }
      }

      if (service.volumes.length > 0) {
        yaml += "    volumes:\n";
        for (const vol of service.volumes) {
          if (vol) yaml += `      - ${vol}\n`;
        }
      }

      if (service.environment.length > 0) {
        yaml += "    environment:\n";
        for (const env of service.environment) {
          if (env) yaml += `      - ${env}\n`;
        }
      }

      if (service.depends_on.length > 0) {
        yaml += "    depends_on:\n";
        for (const dep of service.depends_on) {
          if (dep) yaml += `      - ${dep}\n`;
        }
      }

      if (service.networks.length > 0) {
        yaml += "    networks:\n";
        for (const net of service.networks) {
          if (net) yaml += `      - ${net}\n`;
        }
      }

      if (service.command) {
        yaml += `    command: ${service.command}\n`;
      }

      yaml += "\n";
    }

    // Networks
    const definedNetworks = networks.filter((n) => n.name && n.name !== "default");
    if (definedNetworks.length > 0) {
      yaml += "networks:\n";
      for (const net of definedNetworks) {
        yaml += `  ${net.name}:\n`;
        yaml += `    driver: ${net.driver}\n`;
      }
    }

    // Volumes
    const volumeNames = new Set<string>();
    for (const service of services) {
      for (const vol of service.volumes) {
        const match = vol.match(/^([^:]+):/);
        if (match && !match[1].startsWith(".") && !match[1].startsWith("/")) {
          volumeNames.add(match[1]);
        }
      }
    }
    if (volumeNames.size > 0) {
      yaml += "\nvolumes:\n";
      for (const vol of volumeNames) {
        yaml += `  ${vol}:\n`;
      }
    }

    return yaml;
  }

  // Copy YAML
  async function copyYaml() {
    const yaml = generateYaml();
    await navigator.clipboard.writeText(yaml);
    copied = true;
    toaster.success({ title: "Copied!", description: "docker-compose.yml copied" });
    setTimeout(() => (copied = false), 1500);
  }

  // Download YAML
  function downloadYaml() {
    const yaml = generateYaml();
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "docker-compose.yml";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Clear all
  function clearAll() {
    services = [];
    networks = [{ id: crypto.randomUUID(), name: "default", driver: "bridge" }];
  }
</script>

<svelte:head>
  <title>Docker Compose Generator - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-7xl">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Container class="size-8 text-primary-500" />
      Docker Compose Generator
    </h1>
    <p class="text-surface-500 mt-2">
      Generate docker-compose.yml files visually
    </p>
  </div>

  <!-- Controls -->
  <div class="card p-4 bg-surface-50 dark:bg-surface-900 mb-6">
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="flex gap-2 items-center">
        <select class="select select-sm" bind:value={composeVersion}>
          <option value="3.8">Version 3.8</option>
          <option value="3.9">Version 3.9</option>
          <option value="3.7">Version 3.7</option>
        </select>

        <select class="select select-sm" bind:value={selectedTemplate} onchange={() => applyTemplate(selectedTemplate)}>
          <option value="">Apply Template...</option>
          {#each templates as t}
            <option value={t.name}>{t.name}</option>
          {/each}
        </select>
      </div>

      <div class="flex gap-2">
        <button class="btn btn-sm variant-filled-primary" onclick={addService}>
          <Plus class="size-4" />
          Add Service
        </button>
        <button class="btn btn-sm variant-soft-surface" onclick={copyYaml}>
          {#if copied}
            <Check class="size-4 text-success-500" />
          {:else}
            <Copy class="size-4" />
          {/if}
          Copy
        </button>
        <button class="btn btn-sm variant-soft-surface" onclick={downloadYaml}>
          <Download class="size-4" />
          Download
        </button>
        <button class="btn btn-sm variant-ghost-surface" onclick={clearAll}>
          <RefreshCw class="size-4" />
          Clear
        </button>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Services Editor -->
    <div class="space-y-4">
      <h2 class="h2 font-bold">Services</h2>

      {#if services.length === 0}
        <div class="text-center py-8 text-surface-500 border-2 border-dashed border-surface-500/30 rounded-lg">
          <Container class="size-12 mx-auto mb-2 opacity-50" />
          <p>No services yet</p>
          <button class="btn btn-sm variant-soft-surface mt-2" onclick={addService}>
            Add Service
          </button>
        </div>
      {/if}

      {#each services as service, index (service.id)}
        <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-3">
          <div class="flex justify-between items-center">
            <span class="font-medium">Service {index + 1}</span>
            <button class="btn-icon btn-icon-sm variant-ghost-error" onclick={() => removeService(service.id)}>
              <Trash2 class="size-4" />
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <label class="label">
              <span class="text-xs">Name</span>
              <input type="text" class="input input-sm" bind:value={service.name} placeholder="app" />
            </label>
            <label class="label">
              <span class="text-xs">Image</span>
              <input type="text" class="input input-sm" bind:value={service.image} placeholder="nginx:alpine" />
            </label>
          </div>

          <label class="label">
            <span class="text-xs">Restart Policy</span>
            <select class="select select-sm" bind:value={service.restart}>
              <option value="always">always</option>
              <option value="unless-stopped">unless-stopped</option>
              <option value="on-failure">on-failure</option>
              <option value="no">no</option>
            </select>
          </label>

          <label class="label">
            <span class="text-xs">Ports (one per line)</span>
            <textarea
              class="textarea textarea-sm font-mono text-xs"
              rows="2"
              value={service.ports.join("\n")}
              oninput={(e) => (service.ports = e.currentTarget.value.split("\n").filter(Boolean))}
              placeholder="80:80&#10;443:443"
            ></textarea>
          </label>

          <label class="label">
            <span class="text-xs">Volumes (one per line)</span>
            <textarea
              class="textarea textarea-sm font-mono text-xs"
              rows="2"
              value={service.volumes.join("\n")}
              oninput={(e) => (service.volumes = e.currentTarget.value.split("\n").filter(Boolean))}
              placeholder="./data:/app/data&#10;postgres_data:/var/lib/postgresql/data"
            ></textarea>
          </label>

          <label class="label">
            <span class="text-xs">Environment Variables (one per line)</span>
            <textarea
              class="textarea textarea-sm font-mono text-xs"
              rows="2"
              value={service.environment.join("\n")}
              oninput={(e) => (service.environment = e.currentTarget.value.split("\n").filter(Boolean))}
              placeholder="NODE_ENV=production&#10;DATABASE_URL=postgres://..."
            ></textarea>
          </label>

          <label class="label">
            <span class="text-xs">Depends On (comma-separated)</span>
            <input
              type="text"
              class="input input-sm"
              value={service.depends_on.join(", ")}
              oninput={(e) => (service.depends_on = e.currentTarget.value.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="db, redis"
            />
          </label>
        </div>
      {/each}

      <!-- Networks -->
      <h2 class="h2 font-bold mt-6">Networks</h2>
      <div class="space-y-2">
        {#each networks as network (network.id)}
          <div class="flex gap-2 items-center">
            <input type="text" class="input input-sm flex-1" bind:value={network.name} placeholder="network_name" />
            <select class="select select-sm w-32" bind:value={network.driver}>
              <option value="bridge">bridge</option>
              <option value="overlay">overlay</option>
              <option value="host">host</option>
            </select>
            <button class="btn-icon btn-icon-sm" onclick={() => removeNetwork(network.id)} disabled={networks.length <= 1}>
              <Trash2 class="size-4" />
            </button>
          </div>
        {/each}
        <button class="btn btn-sm variant-ghost-surface" onclick={addNetwork}>
          <Plus class="size-4" />
          Add Network
        </button>
      </div>
    </div>

    <!-- YAML Output -->
    <div>
      <h2 class="h2 font-bold mb-4">docker-compose.yml</h2>
      <div class="card p-4 bg-surface-50 dark:bg-surface-900">
        <pre class="font-mono text-sm overflow-auto max-h-[700px] whitespace-pre-wrap">{generateYaml()}</pre>
      </div>
    </div>
  </div>
</div>
