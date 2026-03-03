<script lang="ts">
  import { Container, Plus, Trash2, Copy, Check, Download, RefreshCw, Upload, FileText, AlertCircle, Info } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";
  import yaml from "js-yaml";

  interface Service {
    id: string;
    name: string;
    image: string;
    ports: string[];
    volumes: string[];
    environment: string[];
    environmentMode: "array" | "map";
    environmentMap: Record<string, string | null> | null;
    depends_on: string[];
    dependsOnMode: "array" | "map";
    dependsOnMap: Record<string, unknown> | null;
    restart: "always" | "unless-stopped" | "on-failure" | "no";
    networks: string[];
    command: string;
    labels: string[];
    labelsMode: "array" | "map";
    labelsMap: Record<string, string> | null;
    // Extra fields to support any custom/unknown YAML properties
    extra: Record<string, string>;
    rawExtra: Record<string, unknown>;
  }

  interface Network {
    id: string;
    name: string;
    driver: "bridge" | "overlay" | "host" | "none";
  }

  interface YamlError {
    line: number;
    col?: number;
    message: string;
    suggestion?: string;
  }

  function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }

  function parseEnvironment(
    value: unknown,
  ): { list: string[]; mode: "array" | "map"; map: Record<string, string | null> | null } {
    if (Array.isArray(value)) {
      return {
        list: normalizeStringArray(value),
        mode: "array",
        map: null,
      };
    }

    if (!isRecord(value)) {
      return { list: [], mode: "array", map: null };
    }

    const environmentMap: Record<string, string | null> = {};
    const list: string[] = [];

    for (const [key, rawValue] of Object.entries(value)) {
      const normalizedKey = key.trim();
      if (!normalizedKey) continue;
      if (rawValue === null) {
        environmentMap[normalizedKey] = null;
        list.push(normalizedKey);
        continue;
      }
      const normalizedValue = String(rawValue);
      environmentMap[normalizedKey] = normalizedValue;
      list.push(`${normalizedKey}=${normalizedValue}`);
    }

    return { list, mode: "map", map: environmentMap };
  }

  function parseDependsOn(
    value: unknown,
  ): { list: string[]; mode: "array" | "map"; map: Record<string, unknown> | null } {
    if (Array.isArray(value)) {
      return {
        list: normalizeStringArray(value),
        mode: "array",
        map: null,
      };
    }

    if (!isRecord(value)) {
      return { list: [], mode: "array", map: null };
    }

    const dependsOnMap = cloneValue(value);
    const list = Object.keys(dependsOnMap).map((key) => key.trim()).filter(Boolean);
    return { list, mode: "map", map: dependsOnMap };
  }

  function parseLabels(
    value: unknown,
  ): { list: string[]; mode: "array" | "map"; map: Record<string, string> | null } {
    if (Array.isArray(value)) {
      return {
        list: normalizeStringArray(value),
        mode: "array",
        map: null,
      };
    }

    if (!isRecord(value)) {
      return { list: [], mode: "array", map: null };
    }

    const labelsMap: Record<string, string> = {};
    const list: string[] = [];
    for (const [key, rawValue] of Object.entries(value)) {
      const normalizedKey = key.trim();
      if (!normalizedKey) continue;
      const normalizedValue = String(rawValue);
      labelsMap[normalizedKey] = normalizedValue;
      list.push(`${normalizedKey}=${normalizedValue}`);
    }

    return { list, mode: "map", map: labelsMap };
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
  
  // YAML Editor state
  let fileInput: HTMLInputElement;
  let yamlContent = $state("");
  let yamlErrors = $state<YamlError[]>([]);
  let isEditorMode = $state(false);
  let yamlEditorFocused = $state(false);
  let yamlLines = $derived(yamlContent.split('\n'));

  // Parse YAML and extract errors
  function parseYamlErrors(input: string): YamlError[] {
    const errors: YamlError[] = [];
    if (!input.trim()) return errors;

    try {
      yaml.load(input);
    } catch (e: any) {
      const msg = e.message || 'Unknown error';
      
      // js-yaml error messages can be tricky - extract line number
      // Common formats: "at line 6 column 5", "line 6", "6:5", etc.
      let line = 0;
      let col = 0;
      
      // Try multiple patterns to extract line number
      // Pattern 1: "at line 6 column 5" or "at line 6"
      const lineColMatch = e.mark?.line !== undefined ? { line: e.mark.line + 1, col: e.mark.column + 1 } : null;
      
      if (lineColMatch) {
        line = lineColMatch.line;
        col = lineColMatch.col;
      } else {
        // Fallback to regex patterns
        const lineMatch = msg.match(/line (\d+)/i) || msg.match(/at line (\d+)/i);
        if (lineMatch) {
          line = parseInt(lineMatch[1]) || 0;
        }
        const colMatch = msg.match(/column (\d+)/i);
        if (colMatch) {
          col = parseInt(colMatch[1]) || 0;
        }
        // Also try "6:5" format
        const colonMatch = msg.match(/(\d+):(\d+)/);
        if (colonMatch) {
          line = parseInt(colonMatch[1]) || line;
          col = parseInt(colonMatch[2]) || col;
        }
      }

      // For indentation errors, the actual problem is often the PREVIOUS line
      // "bad indentation" typically means previous line has wrong indentation
      if (msg.includes('indentation') && line > 1) {
        // Suggest the previous line might be the issue
        errors.push({
          line: line - 1, // Show previous line as potentially problematic
          message: msg,
          suggestion: "Check previous line indentation - may be missing colon or has wrong indent"
        });
      } else {
        errors.push({
          line,
          col,
          message: msg,
          suggestion: getSuggestion(msg)
        });
      }
    }
    return errors;
  }

  function getSuggestion(errorMsg: string): string {
    const lower = errorMsg.toLowerCase();
    if (lower.includes('tab')) return 'Replace tabs with spaces (YAML requires spaces)';
    if (lower.includes('unexpected end')) return 'Check for missing quotes or brackets';
    if (lower.includes('colon')) return 'Add colon after key name, check for missing quotes';
    if (lower.includes('indent')) return 'Check indentation - use 2 spaces per level';
    if (lower.includes('unexpected')) return 'Check for extra characters or missing quotes';
    if (lower.includes('mapping')) return 'Check key-value formatting';
    if (lower.includes('sequence')) return 'Check array/list formatting (use - for items)';
    if (lower.includes('string')) return 'Add quotes around the string';
    if (lower.includes('duplicate')) return 'Remove duplicate key';
    return 'Check YAML syntax';
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
      environmentMode: "array",
      environmentMap: null,
      depends_on: s.depends_on || [],
      dependsOnMode: "array",
      dependsOnMap: null,
      restart: s.restart || "always",
      networks: s.networks || [],
      command: s.command || "",
      labels: s.labels || [],
      labelsMode: "array",
      labelsMap: null,
      extra: {},
      rawExtra: {},
    }));

    selectedTemplate = "";
    yamlContent = generateYaml();
    toaster.success({ title: "Template Applied", description: templateName });
  }

  // Import from file
  async function handleFileImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      yamlContent = text;
      yamlErrors = parseYamlErrors(text);
      
      if (yamlErrors.length === 0) {
        importFromYaml(text);
        toaster.success({ title: "File Imported", description: file.name });
      } else {
        toaster.error({ title: "Parse Error", description: `${yamlErrors.length} error(s) found` });
      }
    } catch (e: any) {
      toaster.error({ title: "Import Failed", description: e.message });
    }
    
    input.value = '';
  }

  // Import from parsed data
  function importFromParsedData(data: any) {
    // Parse services
    const parsedServices: Service[] = [];
    if (isRecord(data.services)) {
      for (const [name, svc] of Object.entries(data.services)) {
        if (!isRecord(svc)) continue;
        const service = svc as Record<string, unknown>;

        // Handle command - can be string, array, or null/undefined
        let command = "";
        if (service.command !== undefined && service.command !== null) {
          if (typeof service.command === 'string') {
            command = service.command;
          } else if (Array.isArray(service.command)) {
            command = service.command.join(" ");
          } else {
            command = String(service.command);
          }
        }

        // Handle restart - can be string or null/undefined
        let restart: "always" | "unless-stopped" | "on-failure" | "no" = "no";
        if (service.restart !== undefined && service.restart !== null) {
          const r = String(service.restart).toLowerCase();
          if (r === "always" || r === "unless-stopped" || r === "on-failure" || r === "no") {
            restart = r;
          }
        }

        const parsedEnvironment = parseEnvironment(service.environment);
        const parsedDependsOn = parseDependsOn(service.depends_on);
        const parsedLabels = parseLabels(service.labels);
        const { extra, rawExtra } = collectExtraFields(service);

        parsedServices.push({
          id: crypto.randomUUID(),
          name,
          image: service.image?.toString() || "",
          ports: normalizeStringArray(service.ports),
          volumes: normalizeStringArray(service.volumes),
          environment: parsedEnvironment.list,
          environmentMode: parsedEnvironment.mode,
          environmentMap: parsedEnvironment.map,
          depends_on: parsedDependsOn.list,
          dependsOnMode: parsedDependsOn.mode,
          dependsOnMap: parsedDependsOn.map,
          restart,
          networks: normalizeStringArray(service.networks),
          command,
          labels: parsedLabels.list,
          labelsMode: parsedLabels.mode,
          labelsMap: parsedLabels.map,
          // Collect extra fields not in the standard schema
          extra,
          rawExtra,
        });
      }
    }

    // Parse networks
    const parsedNetworks: Network[] = [{ id: crypto.randomUUID(), name: "default", driver: "bridge" }];
    if (isRecord(data.networks)) {
      for (const [name, net] of Object.entries(data.networks)) {
        if (name !== "default") {
          const networkObject = isRecord(net) ? net : {};
          const driverValue = String(networkObject.driver || "bridge");
          const driver: Network["driver"] =
            driverValue === "overlay" || driverValue === "host" || driverValue === "none"
              ? driverValue
              : "bridge";

          parsedNetworks.push({
            id: crypto.randomUUID(),
            name,
            driver,
          });
        }
      }
    }

    services = parsedServices;
    networks = parsedNetworks;
    composeVersion = data.version ? String(data.version) : "3.8";
  }

  // Import from YAML
  function importFromYaml(yamlText: string) {
    if (!yamlText.trim()) {
      toaster.error({ title: "Empty Input", description: "Please provide YAML content" });
      return;
    }

    let data: any = null;
    
    try {
      data = yaml.load(yamlText);
    } catch (e: any) {
      yamlErrors = parseYamlErrors(yamlText);
      toaster.error({ title: "Parse Error", description: yamlErrors[0]?.message || "Invalid YAML" });
      return;
    }

    if (!data || typeof data !== 'object') {
      toaster.error({ title: "Invalid YAML", description: "Could not parse docker-compose file" });
      return;
    }

    yamlErrors = [];
    importFromParsedData(data);
    toaster.success({ title: "Imported", description: `${services.length} services loaded` });
  }

  // Parse and switch to form editor
  function parseAndSwitchToForm() {
    importFromYaml(yamlContent);
    if (yamlErrors.length === 0) {
      isEditorMode = false;
    }
  }

  // Add new service
  function addService() {
    const newService: Service = {
      id: crypto.randomUUID(),
      name: `service${services.length + 1}`,
      image: "",
      ports: [],
      volumes: [],
      environment: [],
      environmentMode: "array",
      environmentMap: null,
      depends_on: [],
      dependsOnMode: "array",
      dependsOnMap: null,
      restart: "always",
      networks: [],
      command: "",
      labels: [],
      labelsMode: "array",
      labelsMap: null,
      extra: {},
      rawExtra: {},
    };
    services = [...services, newService];
    yamlContent = generateYaml();
  }

  // Remove service
  function removeService(id: string) {
    services = services.filter((s) => s.id !== id);
    yamlContent = generateYaml();
  }

  // Add network
  function addNetwork() {
    networks = [...networks, { id: crypto.randomUUID(), name: "", driver: "bridge" }];
    yamlContent = generateYaml();
  }

  // Remove network
  function removeNetwork(id: string) {
    networks = networks.filter((n) => n.id !== id);
    yamlContent = generateYaml();
  }

  // Toggle editor mode
  function toggleEditorMode() {
    if (isEditorMode) {
      // Switch to form - try to parse first
      parseAndSwitchToForm();
    } else {
      // Switch to editor - sync YAML
      yamlContent = generateYaml();
      yamlErrors = [];
      isEditorMode = true;
    }
  }

  // Update YAML from form changes
  function syncYamlFromForm() {
    yamlContent = generateYaml();
    yamlErrors = parseYamlErrors(yamlContent);
  }

  // Collect extra fields not in the standard schema
  function collectExtraFields(service: Record<string, unknown>): { extra: Record<string, string>; rawExtra: Record<string, unknown> } {
    const standardFields = ['image', 'ports', 'volumes', 'environment', 'depends_on', 'restart', 'networks', 'command', 'labels'];
    const extra: Record<string, string> = {};
    const rawExtra: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(service)) {
      if (!standardFields.includes(key) && value !== undefined && value !== null) {
        if (typeof value === 'string') {
          extra[key] = value;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          extra[key] = String(value);
        } else {
          rawExtra[key] = cloneValue(value);
        }
      }
    }
    return { extra, rawExtra };
  }

  function parsePairsToObject(values: string[]): Record<string, string> | null {
    const result: Record<string, string> = {};
    for (const rawValue of values) {
      const entry = rawValue.trim();
      if (!entry) continue;
      const separatorIndex = entry.indexOf("=");
      if (separatorIndex < 1) return null;
      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();
      if (!key) return null;
      result[key] = value;
    }
    return Object.keys(result).length > 0 ? result : null;
  }

  function buildServiceYamlObject(service: Service): Record<string, unknown> {
    const serviceDoc: Record<string, unknown> = {};

    if (service.image.trim()) {
      serviceDoc.image = service.image.trim();
    }

    if (service.restart !== "no") {
      serviceDoc.restart = service.restart;
    }

    const ports = service.ports.map((port) => port.trim()).filter(Boolean);
    if (ports.length > 0) {
      serviceDoc.ports = ports;
    }

    const volumes = service.volumes.map((volume) => volume.trim()).filter(Boolean);
    if (volumes.length > 0) {
      serviceDoc.volumes = volumes;
    }

    const environment = service.environment.map((value) => value.trim()).filter(Boolean);
    if (environment.length > 0) {
      if (service.environmentMode === "map" && service.environmentMap) {
        serviceDoc.environment = cloneValue(service.environmentMap);
      } else {
        const asMap = parsePairsToObject(environment);
        serviceDoc.environment = asMap ?? environment;
      }
    }

    const dependsOn = service.depends_on.map((value) => value.trim()).filter(Boolean);
    if (dependsOn.length > 0) {
      if (service.dependsOnMode === "map" && service.dependsOnMap) {
        serviceDoc.depends_on = cloneValue(service.dependsOnMap);
      } else {
        serviceDoc.depends_on = dependsOn;
      }
    }

    const networksList = service.networks.map((value) => value.trim()).filter(Boolean);
    if (networksList.length > 0) {
      serviceDoc.networks = networksList;
    }

    if (service.command.trim()) {
      serviceDoc.command = service.command;
    }

    const labels = service.labels.map((value) => value.trim()).filter(Boolean);
    if (labels.length > 0) {
      if (service.labelsMode === "map" && service.labelsMap) {
        serviceDoc.labels = cloneValue(service.labelsMap);
      } else {
        const asMap = parsePairsToObject(labels);
        serviceDoc.labels = asMap ?? labels;
      }
    }

    for (const [key, value] of Object.entries(service.rawExtra)) {
      if (key.trim() && value !== undefined) {
        serviceDoc[key] = cloneValue(value);
      }
    }

    for (const [key, value] of Object.entries(service.extra)) {
      if (key.trim() && value) {
        serviceDoc[key.trim()] = value;
      }
    }

    return serviceDoc;
  }

  // Generate YAML
  function generateYaml(): string {
    const composeDoc: Record<string, unknown> = {
      version: composeVersion,
      services: {},
    };

    const serviceDoc = composeDoc.services as Record<string, Record<string, unknown>>;
    services.forEach((service, index) => {
      const serviceName = service.name.trim() || `service${index + 1}`;
      serviceDoc[serviceName] = buildServiceYamlObject(service);
    });

    // Networks
    const definedNetworks = networks.filter((n) => n.name && n.name !== "default");
    if (definedNetworks.length > 0) {
      const composeNetworks: Record<string, { driver: Network["driver"] }> = {};
      for (const net of definedNetworks) {
        const netName = net.name.trim();
        if (!netName) continue;
        composeNetworks[netName] = { driver: net.driver };
      }
      if (Object.keys(composeNetworks).length > 0) {
        composeDoc.networks = composeNetworks;
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
      const volumeDoc: Record<string, Record<string, never>> = {};
      for (const vol of volumeNames) {
        volumeDoc[vol] = {};
      }
      composeDoc.volumes = volumeDoc;
    }

    return yaml.dump(composeDoc, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });
  }

  // Copy YAML
  async function copyYaml() {
    const content = isEditorMode ? yamlContent : generateYaml();
    await navigator.clipboard.writeText(content);
    copied = true;
    toaster.success({ title: "Copied!", description: "docker-compose.yml copied" });
    setTimeout(() => (copied = false), 1500);
  }

  // Download YAML
  function downloadYaml() {
    const content = isEditorMode ? yamlContent : generateYaml();
    const blob = new Blob([content], { type: "text/yaml" });
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
    yamlContent = "";
    yamlErrors = [];
  }

  // Check if line has error
  function getLineErrors(lineNum: number): YamlError[] {
    return yamlErrors.filter(e => e.line === lineNum);
  }

  // Drag and drop handlers
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file) {
      file.text().then(t => {
        yamlContent = t;
        yamlErrors = parseYamlErrors(t);
        if (yamlErrors.length === 0) {
          importFromYaml(t);
          toaster.success({ title: "File Imported", description: file.name });
        } else {
          isEditorMode = true;
          toaster.error({ title: "Parse Error", description: `${yamlErrors.length} error(s) found` });
        }
      });
    }
  }

  // Update errors on content change
  function handleYamlInput() {
    yamlErrors = parseYamlErrors(yamlContent);
  }
</script>

<svelte:head>
  <title>Docker Compose Generator - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-7xl">
  <!-- Header -->
  <div class="mb-6">
    <h1 class="h1 font-bold flex items-center gap-3">
      <Container class="size-8 text-primary-500" />
      Docker Compose Generator
      <span class="badge preset-filled-secondary-500 text-xs">V0.11 ~ V0.17</span>
    </h1>
    <p class="text-surface-500 mt-2">
      Generate, import & edit docker-compose.yml files visually
    </p>
  </div>

  <!-- Controls -->
  <div class="card p-4 bg-surface-50 dark:bg-surface-600 mb-6">
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="flex gap-2 items-center flex-wrap">
        <select class="select select-sm" bind:value={composeVersion} onchange={syncYamlFromForm}>
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

        <!-- File Import -->
        <input
          type="file"
          accept=".yml,.yaml,.txt"
          class="hidden"
          bind:this={fileInput}
          onchange={handleFileImport}
        />
        <button class="btn btn-sm preset-tonal-surface" onclick={() => fileInput.click()}>
          <Upload class="size-4" />
          Import File
        </button>

        <!-- Editor Toggle -->
        <button class="btn btn-sm {isEditorMode ? 'preset-filled-primary-500' : 'preset-tonal-secondary'}" onclick={toggleEditorMode}>
          <FileText class="size-4" />
          {isEditorMode ? 'Form Editor' : 'Raw YAML'}
        </button>
      </div>

      <div class="flex gap-2">
        <button class="btn btn-sm preset-filled-primary-500" onclick={addService}>
          <Plus class="size-4" />
          Add Service
        </button>
        <button class="btn btn-sm preset-tonal-surface" onclick={copyYaml}>
          {#if copied}
            <Check class="size-4 text-success-500" />
          {:else}
            <Copy class="size-4" />
          {/if}
          Copy
        </button>
        <button class="btn btn-sm preset-tonal-surface" onclick={downloadYaml}>
          <Download class="size-4" />
          Download
        </button>
        <button class="btn btn-sm bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface" onclick={clearAll}>
          <RefreshCw class="size-4" />
          Clear
        </button>
      </div>
    </div>
  </div>

  <!-- Parse errors -->
  {#if yamlErrors.length > 0}
    <div class="alert preset-filled-error-500 mb-4" role="alert">
      <AlertCircle class="size-5 shrink-0" />
      <div class="flex-1 space-y-2">
        <strong>YAML Parse Error(s): {yamlErrors.length} found</strong>
        <div class="text-sm space-y-2 max-h-48 overflow-y-auto">
          {#each yamlErrors as err}
            <div class="bg-white/10 dark:bg-black/20 rounded p-2">
              <div class="flex items-start gap-2">
                <span class="font-mono bg-error-500/30 px-1.5 py-0.5 rounded text-xs shrink-0">Line {err.line}</span>
                <span class="text-error-100">{err.message}</span>
              </div>
              {#if err.suggestion}
                <div class="text-surface-200 dark:text-surface-300 text-xs mt-1 ml-14">💡 {err.suggestion}</div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Empty state with drop zone -->
  {#if services.length === 0 && !isEditorMode}
    <div 
      class="border-2 border-dashed border-surface-500/60 rounded-lg p-12 mb-6 text-center"
      ondragover={handleDragOver}
      ondrop={handleDrop}
      role="region"
      aria-label="Drop zone for docker-compose files"
    >
      <Upload class="size-16 mx-auto mb-4 text-surface-400" />
      <p class="text-lg font-medium mb-2">Drop docker-compose.yml here</p>
      <p class="text-surface-500 mb-4">or use the Import File button above</p>
      <div class="flex justify-center gap-2">
        <button class="btn btn-sm preset-tonal-surface" onclick={() => fileInput.click()}>
          <Upload class="size-4" />
          Import File
        </button>
        <span class="text-surface-400">or</span>
        <button class="btn btn-sm preset-filled-primary-500" onclick={addService}>
          <Plus class="size-4" />
          Add Service
        </button>
      </div>
    </div>
  {/if}

  {#if isEditorMode}
    <!-- YAML Editor with line numbers and error highlighting -->
    <div class="card bg-surface-50 dark:bg-surface-600 overflow-hidden border border-surface-200 dark:border-surface-700">
      <div class="flex items-center justify-between px-4 py-2 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-2">
          <span class="font-medium">YAML Editor</span>
          <span class="text-xs text-surface-500 dark:text-surface-400">• {yamlLines.length} lines</span>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-sm bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface" onclick={handleYamlInput}>
            Check Syntax
          </button>
          {#if yamlErrors.length === 0}
            <button class="btn btn-sm preset-filled-success-500" onclick={parseAndSwitchToForm}>
              Apply to Form
            </button>
          {/if}
        </div>
      </div>
      
      <div class="flex">
        <!-- Line numbers -->
        <div class="py-3 px-2 bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 text-right select-none font-mono text-sm leading-6 border-r border-surface-200 dark:border-surface-700" style="min-width: 3.5rem;">
          {#each yamlLines as _, i}
            {@const lineNum = i + 1}
            {@const lineErrs = getLineErrors(lineNum)}
            <div class="h-6 {lineErrs.length > 0 ? 'bg-error-500/20 text-error-600 dark:text-error-300' : ''}">
              {lineNum}
            </div>
          {/each}
        </div>
        
        <!-- Editor -->
        <textarea
          class="flex-1 p-3 bg-transparent font-mono text-sm leading-6 resize-none focus:outline-none text-surface-900 dark:text-surface-200 placeholder:text-surface-400"
          style="min-height: 500px;"
          bind:value={yamlContent}
          oninput={handleYamlInput}
          onfocus={() => yamlEditorFocused = true}
          onblur={() => yamlEditorFocused = false}
          placeholder="version: '3.8'

services:
  app:
    image: nginx:alpine
    ports:
      - '80:80'"
          spellcheck="false"
        ></textarea>
      </div>

      <!-- Error markers -->
      {#if yamlErrors.length > 0}
        <div class="px-4 py-3 bg-surface-100 dark:bg-error-500/10 border-t border-surface-200 dark:border-error-500/30 text-sm">
          <div class="flex items-center gap-2 text-error-600 dark:text-error-300 mb-2">
            <AlertCircle class="size-4" />
            <span>{yamlErrors.length} error(s) found</span>
          </div>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            {#each yamlErrors as err}
              <div class="bg-surface-200/50 dark:bg-error-500/10 rounded p-2">
                <div class="flex items-center gap-2">
                  <span class="font-mono bg-error-500/20 dark:bg-error-500/30 px-1.5 py-0.5 rounded text-xs">L{err.line}</span>
                  <span class="text-error-700 dark:text-error-200">{err.message}</span>
                </div>
                {#if err.suggestion}
                  <div class="text-surface-500 dark:text-surface-400 text-xs mt-1 ml-14">💡 {err.suggestion}</div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Info -->
    <div class="mt-4 flex items-start gap-2 text-sm text-surface-500">
      <Info class="size-4 shrink-0 mt-0.5" />
      <p>Edit YAML directly. Use "Check Syntax" to validate. Click "Apply to Form" when error-free to switch to visual editor.</p>
    </div>
  {:else}
    <!-- Form Editor -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Services Editor -->
      <div class="space-y-4">
        <h2 class="h2 font-bold">Services</h2>

        {#if services.length === 0}
          <div class="text-center py-8 text-surface-500 border-2 border-dashed border-surface-500/60 rounded-lg">
            <Container class="size-12 mx-auto mb-2 opacity-50" />
            <p>No services yet</p>
            <button class="btn btn-sm preset-tonal-surface mt-2" onclick={addService}>
              Add Service
            </button>
          </div>
        {/if}

        {#each services as service, index (service.id)}
          <div class="card p-4 bg-surface-50 dark:bg-surface-600 space-y-3">
            <div class="flex justify-between items-center">
              <span class="font-medium">Service {index + 1}</span>
              <button class="btn-icon btn-icon-sm bg-transparent text-error-600 dark:text-error-400 hover:preset-tonal-error" onclick={() => removeService(service.id)}>
                <Trash2 class="size-4" />
              </button>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <label class="label">
                <span class="text-xs">Name</span>
                <input type="text" class="input input-sm" bind:value={service.name} oninput={syncYamlFromForm} placeholder="app" />
              </label>
              <label class="label">
                <span class="text-xs">Image</span>
                <input type="text" class="input input-sm" bind:value={service.image} oninput={syncYamlFromForm} placeholder="nginx:alpine" />
              </label>
            </div>

            <label class="label">
              <span class="text-xs">Restart Policy</span>
              <select class="select select-sm" bind:value={service.restart} onchange={syncYamlFromForm}>
                <option value="always">always</option>
                <option value="unless-stopped">unless-stopped</option>
                <option value="on-failure">on-failure</option>
                <option value="no">no</option>
              </select>
            </label>

            <label class="label">
              <span class="text-xs">Command (optional)</span>
              <textarea 
                class="textarea textarea-sm font-mono" 
                rows="2"
                bind:value={service.command} 
                oninput={syncYamlFromForm} 
                placeholder="npm start"
              ></textarea>
            </label>

            <label class="label">
              <span class="text-xs">Ports (one per line)</span>
              <textarea
                class="textarea textarea-sm font-mono text-xs"
                rows="2"
                value={service.ports.join("\n")}
                oninput={(e) => { service.ports = e.currentTarget.value.split("\n").filter(Boolean); syncYamlFromForm(); }}
                placeholder="80:80&#10;443:443"
              ></textarea>
            </label>

            <label class="label">
              <span class="text-xs">Volumes (one per line)</span>
              <textarea
                class="textarea textarea-sm font-mono text-xs"
                rows="2"
                value={service.volumes.join("\n")}
                oninput={(e) => { service.volumes = e.currentTarget.value.split("\n").filter(Boolean); syncYamlFromForm(); }}
                placeholder="./data:/app/data&#10;postgres_data:/var/lib/postgresql/data"
              ></textarea>
            </label>

            <label class="label">
              <span class="text-xs">Environment Variables (one per line)</span>
              <textarea
                class="textarea textarea-sm font-mono text-xs"
                rows="2"
                value={service.environment.join("\n")}
                oninput={(e) => {
                  service.environmentMode = "array";
                  service.environmentMap = null;
                  service.environment = e.currentTarget.value.split("\n").filter(Boolean);
                  syncYamlFromForm();
                }}
                placeholder="NODE_ENV=production&#10;DATABASE_URL=postgres://..."
              ></textarea>
            </label>

            <label class="label">
              <span class="text-xs">Depends On (comma-separated)</span>
              <input
                type="text"
                class="input input-sm"
                value={service.depends_on.join(", ")}
                oninput={(e) => {
                  service.dependsOnMode = "array";
                  service.dependsOnMap = null;
                  service.depends_on = e.currentTarget.value.split(",").map((s) => s.trim()).filter(Boolean);
                  syncYamlFromForm();
                }}
                placeholder="db, redis"
              />
            </label>

            <!-- Extra Fields for custom/unknown properties -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-surface-400">Extra Fields (custom)</span>
                <button 
                  class="btn btn-xs bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface" 
                  onclick={() => { 
                    const key = prompt('Enter field name:'); 
                    if (key) { 
                      service.extra = service.extra || {}; 
                      service.extra[key] = ''; 
                      syncYamlFromForm(); 
                    } 
                  }}
                >
                  <Plus class="size-3" /> Add
                </button>
              </div>
              {#if service.extra && Object.keys(service.extra).length > 0}
                {#each Object.entries(service.extra) as [key, value], i}
                  <div class="flex gap-2 items-center">
                    <input
                      type="text"
                      class="input input-sm flex-1 font-mono"
                      value={key}
                      placeholder="field_name"
                      oninput={(e) => {
                        const newKey = e.currentTarget.value;
                        const newExtra = { ...service.extra };
                        const oldValue = newExtra[key];
                        delete newExtra[key];
                        if (newKey) {
                          newExtra[newKey] = oldValue;
                          service.extra = newExtra;
                          syncYamlFromForm();
                        }
                      }}
                    />
                    <input
                      type="text"
                      class="input input-sm flex-1 font-mono"
                      bind:value={service.extra[key]}
                      oninput={syncYamlFromForm}
                      placeholder="value"
                    />
                    <button 
                      class="btn-icon btn-icon-sm bg-transparent text-error-600 dark:text-error-400 hover:preset-tonal-error" 
                      onclick={() => { 
                        const newExtra = { ...service.extra };
                        delete newExtra[key];
                        service.extra = newExtra;
                        syncYamlFromForm();
                      }}
                    >
                      <Trash2 class="size-3" />
                    </button>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        {/each}

        <!-- Networks -->
        <h2 class="h2 font-bold mt-6">Networks</h2>
        <div class="space-y-2">
          {#each networks as network (network.id)}
            <div class="flex gap-2 items-center">
              <input type="text" class="input input-sm flex-1" bind:value={network.name} oninput={syncYamlFromForm} placeholder="network_name" />
              <select class="select select-sm w-32" bind:value={network.driver} onchange={syncYamlFromForm}>
                <option value="bridge">bridge</option>
                <option value="overlay">overlay</option>
                <option value="host">host</option>
              </select>
              <button class="btn-icon btn-icon-sm" onclick={() => removeNetwork(network.id)} disabled={networks.length <= 1}>
                <Trash2 class="size-4" />
              </button>
            </div>
          {/each}
          <button class="btn btn-sm bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface" onclick={addNetwork}>
            <Plus class="size-4" />
            Add Network
          </button>
        </div>
      </div>

      <!-- YAML Output -->
      <div>
        <h2 class="h2 font-bold mb-4">docker-compose.yml</h2>
        <div class="card p-4 bg-surface-50 dark:bg-surface-600">
          <pre class="font-mono text-sm overflow-auto max-h-[700px] whitespace-pre-wrap">{generateYaml()}</pre>
        </div>
      </div>
    </div>
  {/if}
</div>
