<script lang="ts">
  import { untrack } from "svelte";
  import {
    FileJson,
    Copy,
    Check,
    RefreshCw,
    Minimize2,
    Maximize2,
    SortAsc,
    AlertCircle,
    CheckCircle,
    Lock,
    Unlock,
  } from "@lucide/svelte";
  import { toaster } from "$lib/toaster.svelte";
  import { isToolVerified } from "$lib/data/verified-tools";

  type IndentType = 2 | 4 | "tab";
  type TableRow = Record<string, string>;
  type PathSegment = string | number;
  type TableCandidate = {
    path: string;
    segments: PathSegment[];
    label: string;
  };
  type JsonNodeKind = "object" | "array" | "string" | "number" | "boolean" | "null";
  type StructureNode = {
    path: string;
    segments: PathSegment[];
    depth: number;
    kind: JsonNodeKind;
    preview: string;
  };

  const isVerified = isToolVerified("json");

  let inputJson = $state("");
  let outputJson = $state("");
  let indentSize = $state<IndentType>(2);
  let sortKeys = $state(false);
  let isValid = $state(false);
  let error = $state<{ message: string; line?: number } | null>(null);
  let copied = $state(false);
  let inputStats = $state<{ keys: number; depth: number; size: string } | null>(null);
  let tableColumns = $state<string[]>([]);
  let tableRows = $state<TableRow[]>([]);
  let newColumnName = $state("");
  let tableCandidates = $state<TableCandidate[]>([]);
  let selectedTablePath = $state("");
  let tableSupported = $state(false);
  let tableMessage = $state("");

  let structureRoot = $state<unknown>(null);
  let structureNodes = $state<StructureNode[]>([]);
  let selectedStructurePath = $state("$");
  let structureMessage = $state("");
  let newObjectKey = $state("");
  let newObjectValue = $state("");
  let newArrayValue = $state("");
  let primitiveEditorValue = $state("");
  let primitiveEditorType = $state<"string" | "number" | "boolean" | "null" | "json">("string");
  let hasPendingPrimitiveUpdate = $state(false);
  let isStructureEditUnlocked = $state(false);
  let autoNavigateStructureEdit = $state(false);
  let shouldFocusAfterAutoNavigate = $state(false);
  let primitiveInputRef = $state<HTMLInputElement | null>(null);
  let primitiveTextareaRef = $state<HTMLTextAreaElement | null>(null);
  let structureOriginal = $state<unknown>(null);
  let structureChangeCount = $state(0);

  function resetTableState(message = "") {
    tableColumns = [];
    tableRows = [];
    tableCandidates = [];
    selectedTablePath = "";
    tableSupported = false;
    tableMessage = message;
  }

  function resetStructureState(message = "") {
    structureRoot = null;
    structureOriginal = null;
    structureNodes = [];
    selectedStructurePath = "$";
    structureMessage = message;
    isStructureEditUnlocked = false;
    autoNavigateStructureEdit = false;
    structureChangeCount = 0;
    newObjectKey = "";
    newObjectValue = "";
    newArrayValue = "";
    primitiveEditorValue = "";
    primitiveEditorType = "string";
    hasPendingPrimitiveUpdate = false;
    shouldFocusAfterAutoNavigate = false;
    primitiveInputRef = null;
    primitiveTextareaRef = null;
  }

  function countJsonChanges(originalValue: unknown, currentValue: unknown): number {
    const originalKind = getJsonNodeKind(originalValue);
    const currentKind = getJsonNodeKind(currentValue);

    if (originalKind !== currentKind) return 1;

    if (originalKind === "array") {
      const originalArray = originalValue as unknown[];
      const currentArray = currentValue as unknown[];
      const maxLength = Math.max(originalArray.length, currentArray.length);

      let count = 0;
      for (let index = 0; index < maxLength; index += 1) {
        if (index >= originalArray.length || index >= currentArray.length) {
          count += 1;
          continue;
        }

        count += countJsonChanges(originalArray[index], currentArray[index]);
      }

      return count;
    }

    if (originalKind === "object") {
      const originalObject = originalValue as Record<string, unknown>;
      const currentObject = currentValue as Record<string, unknown>;
      const keys = new Set([...Object.keys(originalObject), ...Object.keys(currentObject)]);

      let count = 0;
      keys.forEach((key) => {
        if (!(key in originalObject) || !(key in currentObject)) {
          count += 1;
          return;
        }

        count += countJsonChanges(originalObject[key], currentObject[key]);
      });

      return count;
    }

    return Object.is(originalValue, currentValue) ? 0 : 1;
  }

  function refreshStructureChangeCount() {
    if (structureOriginal === null || structureRoot === null) {
      structureChangeCount = 0;
      return;
    }

    structureChangeCount = countJsonChanges(structureOriginal, structureRoot);
  }

  function isNodeChanged(segments: PathSegment[]): boolean {
    if (structureOriginal === null || structureRoot === null) return false;
    const originalValue = getNodeAtPath(structureOriginal, segments);
    const currentValue = getNodeAtPath(structureRoot, segments);
    return countJsonChanges(originalValue, currentValue) > 0;
  }

  function isPlainObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function toEditableCellValue(value: unknown): string {
    if (value === undefined) return "";
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  }

  function cloneJson<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  function getJsonNodeKind(value: unknown): JsonNodeKind {
    if (Array.isArray(value)) return "array";
    if (value === null) return "null";
    if (typeof value === "object") return "object";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    return "string";
  }

  function getValuePreview(value: unknown): string {
    const kind = getJsonNodeKind(value);
    if (kind === "object") {
      return `{${Object.keys(value as Record<string, unknown>).length} keys}`;
    }
    if (kind === "array") {
      return `[${(value as unknown[]).length} items]`;
    }
    if (kind === "string") {
      const text = value as string;
      return text.length > 40 ? `${text.slice(0, 40)}...` : text;
    }
    return String(value);
  }

  function formatPath(segments: PathSegment[]): string {
    if (segments.length === 0) return "$";

    return segments.reduce<string>((path, segment) => {
      if (typeof segment === "number") {
        return `${path}[${segment}]`;
      }

      if (/^[A-Za-z_$][\w$]*$/.test(segment)) {
        return `${path}.${segment}`;
      }

      return `${path}[${JSON.stringify(segment)}]`;
    }, "$");
  }

  function getNodeAtPath(data: unknown, segments: PathSegment[]): unknown {
    let current: unknown = data;

    for (const segment of segments) {
      if (current === null || typeof current !== "object") {
        return undefined;
      }

      if (Array.isArray(current) && typeof segment === "number") {
        current = current[segment];
      } else if (!Array.isArray(current) && typeof segment === "string") {
        current = (current as Record<string, unknown>)[segment];
      } else {
        return undefined;
      }
    }

    return current;
  }

  function collectStructureNodes(data: unknown): StructureNode[] {
    const nodes: StructureNode[] = [];

    function walk(node: unknown, segments: PathSegment[], depth: number) {
      nodes.push({
        path: formatPath(segments),
        segments: [...segments],
        depth,
        kind: getJsonNodeKind(node),
        preview: getValuePreview(node)
      });

      if (Array.isArray(node)) {
        node.forEach((item, index) => walk(item, [...segments, index], depth + 1));
        return;
      }

      if (isPlainObject(node)) {
        Object.entries(node).forEach(([key, value]) => walk(value, [...segments, key], depth + 1));
      }
    }

    walk(data, [], 0);
    return nodes;
  }

  function syncPrimitiveEditorFromSelection() {
    if (structureRoot === null) return;

    const node = structureNodes.find((item) => item.path === selectedStructurePath);
    if (!node) return;

    const value = getNodeAtPath(structureRoot, node.segments);
    const kind = getJsonNodeKind(value);

    if (kind === "string") {
      primitiveEditorType = "string";
      primitiveEditorValue = value as string;
      return;
    }

    if (kind === "number") {
      primitiveEditorType = "number";
      primitiveEditorValue = String(value);
      return;
    }

    if (kind === "boolean") {
      primitiveEditorType = "boolean";
      primitiveEditorValue = String(value);
      return;
    }

    if (kind === "null") {
      primitiveEditorType = "null";
      primitiveEditorValue = "null";
      return;
    }

    primitiveEditorType = "json";
    primitiveEditorValue = JSON.stringify(value, null, 2);
  }

  function updatePendingPrimitiveState() {
    if (!isStructureEditUnlocked) {
      hasPendingPrimitiveUpdate = false;
      return;
    }

    const node = getSelectedStructureNode();
    if (!node || node.kind === "object" || node.kind === "array") {
      hasPendingPrimitiveUpdate = false;
      return;
    }

    const currentValue = getSelectedStructureValue();
    try {
      const draftValue = parseValueByType(primitiveEditorValue, primitiveEditorType);
      hasPendingPrimitiveUpdate = countJsonChanges(currentValue, draftValue) > 0;
    } catch {
      hasPendingPrimitiveUpdate = primitiveEditorValue.trim().length > 0;
    }
  }

  function syncStructureFromData(data: unknown) {
    structureOriginal = cloneJson(data);
    structureRoot = cloneJson(data);
    structureNodes = collectStructureNodes(structureRoot);
    structureMessage = "";
    structureChangeCount = 0;
    isStructureEditUnlocked = false;
    autoNavigateStructureEdit = false;

    const exists = structureNodes.some((node) => node.path === selectedStructurePath);
    selectedStructurePath = exists ? selectedStructurePath : "$";
    syncPrimitiveEditorFromSelection();
  }

  function collectTableCandidates(data: unknown): TableCandidate[] {
    const candidates: TableCandidate[] = [];

    function visit(node: unknown, segments: PathSegment[]) {
      if (Array.isArray(node)) {
        const isObjectArray = node.length === 0 || node.every((item) => isPlainObject(item));
        if (isObjectArray) {
          const path = formatPath(segments);
          const rowCount = node.length;
          candidates.push({
            path,
            segments: [...segments],
            label: `${path} (${rowCount} row${rowCount === 1 ? "" : "s"})`,
          });
        }

        node.forEach((item, index) => {
          if (Array.isArray(item) || isPlainObject(item)) {
            visit(item, [...segments, index]);
          }
        });
        return;
      }

      if (isPlainObject(node)) {
        Object.entries(node).forEach(([key, value]) => {
          if (Array.isArray(value) || isPlainObject(value)) {
            visit(value, [...segments, key]);
          }
        });
      }
    }

    visit(data, []);
    return candidates;
  }

  function loadTableFromPath(data: unknown, path: string, candidates: TableCandidate[]) {
    const candidate = candidates.find((item) => item.path === path);
    if (!candidate) {
      resetTableState("No editable array source found.");
      return;
    }

    const node = getNodeAtPath(data, candidate.segments);
    if (!Array.isArray(node) || !node.every((item) => isPlainObject(item))) {
      resetTableState("Selected source is not an array of objects.");
      return;
    }

    const columns: string[] = [];
    node.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (!columns.includes(key)) {
          columns.push(key);
        }
      });
    });

    const rows = node.map((item) => {
      const row: TableRow = {};
      columns.forEach((column) => {
        row[column] = toEditableCellValue(item[column]);
      });
      return row;
    });

    tableColumns = columns;
    tableRows = rows;
    tableSupported = true;
    tableMessage = node.length === 0 ? `Selected source ${path} is empty. Add columns and rows to start editing.` : "";
  }

  function syncTableFromData(data: unknown) {
    const candidates = collectTableCandidates(data);
    if (candidates.length === 0) {
      resetTableState("No table-compatible array found. Use an array of objects anywhere in JSON.");
      return;
    }

    tableCandidates = candidates;

    const stillExists = candidates.some((candidate) => candidate.path === selectedTablePath);
    const nextPath = stillExists ? selectedTablePath : candidates[0].path;
    selectedTablePath = nextPath;

    loadTableFromPath(data, nextPath, candidates);
  }

  function parseTableCellValue(rawValue: string): unknown {
    const trimmed = rawValue.trim();
    if (!trimmed) return "";

    try {
      return JSON.parse(trimmed);
    } catch {
      return rawValue;
    }
  }

  function applyTableToInput() {
    if (!tableSupported) return;

    const { data, error: parseError } = parseJson(inputJson);
    if (parseError || data === null) {
      toaster.error({ title: "Invalid JSON", description: "Fix JSON before applying table changes" });
      return;
    }

    const candidate = tableCandidates.find((item) => item.path === selectedTablePath);
    if (!candidate) {
      toaster.error({ title: "Missing source", description: "Select a valid table source first" });
      return;
    }

    const nextData = tableRows.map((row) => {
      const nextRow: Record<string, unknown> = {};
      tableColumns.forEach((column) => {
        const rawValue = row[column] ?? "";
        if (!rawValue.trim()) return;
        nextRow[column] = parseTableCellValue(rawValue);
      });
      return nextRow;
    });

    let mergedData: unknown;
    if (candidate.segments.length === 0) {
      mergedData = nextData;
    } else {
      const rootClone = JSON.parse(JSON.stringify(data)) as unknown;
      const parentPath = candidate.segments.slice(0, -1);
      const lastSegment = candidate.segments[candidate.segments.length - 1];
      const parentNode = getNodeAtPath(rootClone, parentPath);

      if (parentNode === undefined || parentNode === null || typeof parentNode !== "object") {
        toaster.error({ title: "Apply failed", description: "Could not resolve table source path" });
        return;
      }

      if (Array.isArray(parentNode) && typeof lastSegment === "number") {
        parentNode[lastSegment] = nextData;
      } else if (!Array.isArray(parentNode) && typeof lastSegment === "string") {
        (parentNode as Record<string, unknown>)[lastSegment] = nextData;
      } else {
        toaster.error({ title: "Apply failed", description: "Invalid table source path" });
        return;
      }

      mergedData = rootClone;
    }

    const processed = sortKeys ? sortObjectKeys(mergedData) : mergedData;
    const indent = indentSize === "tab" ? "\t" : indentSize;
    inputJson = JSON.stringify(processed, null, indent);
    toaster.success({ title: "Table Applied", description: "Table changes synced to JSON" });
  }

  function changeTableSource(path: string) {
    if (!path) return;

    const { data, error: parseError } = parseJson(inputJson);
    if (parseError || data === null) return;

    selectedTablePath = path;
    loadTableFromPath(data, path, tableCandidates);
  }

  function updateTableCell(rowIndex: number, column: string, value: string) {
    tableRows = tableRows.map((row, index) => {
      if (index !== rowIndex) return row;
      return { ...row, [column]: value };
    });
  }

  function addTableRow() {
    const row: TableRow = {};
    tableColumns.forEach((column) => {
      row[column] = "";
    });
    tableRows = [...tableRows, row];
  }

  function removeTableRow(rowIndex: number) {
    tableRows = tableRows.filter((_, index) => index !== rowIndex);
  }

  function addTableColumn() {
    const column = newColumnName.trim();
    if (!column) return;

    if (tableColumns.includes(column)) {
      toaster.error({ title: "Duplicate column", description: "That column already exists" });
      return;
    }

    tableColumns = [...tableColumns, column];
    tableRows = tableRows.map((row) => ({ ...row, [column]: "" }));
    newColumnName = "";
  }

  function removeTableColumn(column: string) {
    tableColumns = tableColumns.filter((item) => item !== column);
    tableRows = tableRows.map((row) => {
      const next = { ...row };
      delete next[column];
      return next;
    });
  }

  function parseValueByType(input: string, type: "string" | "number" | "boolean" | "null" | "json"): unknown {
    if (type === "string") return input;
    if (type === "number") {
      const parsed = Number(input);
      if (Number.isNaN(parsed)) {
        throw new Error("Invalid number value");
      }
      return parsed;
    }
    if (type === "boolean") {
      const normalized = input.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
      throw new Error("Boolean value must be true or false");
    }
    if (type === "null") {
      return null;
    }

    return JSON.parse(input);
  }

  function getStructureNode(path: string): StructureNode | undefined {
    return structureNodes.find((node) => node.path === path);
  }

  function getSelectedStructureNode(): StructureNode | undefined {
    return getStructureNode(selectedStructurePath);
  }

  function getSelectedStructureValue(): unknown {
    const node = getSelectedStructureNode();
    if (!node || structureRoot === null) return undefined;
    return getNodeAtPath(structureRoot, node.segments);
  }

  function getSelectedObjectEntries() {
    const node = getSelectedStructureNode();
    const value = getSelectedStructureValue();
    if (!node || !isPlainObject(value)) {
      return [] as Array<{ key: string; path: string; segments: PathSegment[]; value: string }>;
    }

    return Object.keys(value).map((key) => {
      const childSegments = [...node.segments, key];
      const childPath = formatPath(childSegments);
      return {
        key,
        path: childPath,
        segments: childSegments,
        value: toEditableCellValue((value as Record<string, unknown>)[key])
      };
    });
  }

  function getSelectedArrayEntries() {
    const node = getSelectedStructureNode();
    const value = getSelectedStructureValue();
    if (!node || !Array.isArray(value)) {
      return [] as Array<{ index: number; path: string; segments: PathSegment[]; value: string }>;
    }

    return value.map((item, index) => ({
      index,
      path: formatPath([...node.segments, index]),
      segments: [...node.segments, index],
      value: toEditableCellValue(item)
    }));
  }

  function mutateStructure(mutator: (root: unknown) => string | void) {
    if (structureRoot === null) return;

    const nextRoot = cloneJson(structureRoot);
    const nextPath = mutator(nextRoot);

    structureRoot = nextRoot;
    structureNodes = collectStructureNodes(structureRoot);

    if (typeof nextPath === "string" && structureNodes.some((node) => node.path === nextPath)) {
      selectedStructurePath = nextPath;
    } else if (!structureNodes.some((node) => node.path === selectedStructurePath)) {
      selectedStructurePath = "$";
    }

    refreshStructureChangeCount();
    syncPrimitiveEditorFromSelection();
  }

  function selectStructurePath(path: string) {
    if (!path || !getStructureNode(path)) return;
    selectedStructurePath = path;
    syncPrimitiveEditorFromSelection();
  }

  function replaceSelectedValue() {
    if (!isStructureEditUnlocked) return;

    const node = getSelectedStructureNode();
    if (!node) return;

    let nextValue: unknown;
    try {
      nextValue = parseValueByType(primitiveEditorValue, primitiveEditorType);
    } catch (e) {
      toaster.error({ title: "Invalid value", description: e instanceof Error ? e.message : "Could not parse value" });
      return;
    }

    if (node.segments.length === 0) {
      structureRoot = nextValue;
      structureNodes = collectStructureNodes(structureRoot);
      selectedStructurePath = "$";
      refreshStructureChangeCount();
      syncPrimitiveEditorFromSelection();
      return;
    }

    mutateStructure((root) => {
      const parentSegments = node.segments.slice(0, -1);
      const lastSegment = node.segments[node.segments.length - 1];
      const parent = getNodeAtPath(root, parentSegments);

      if (Array.isArray(parent) && typeof lastSegment === "number") {
        parent[lastSegment] = nextValue;
      } else if (isPlainObject(parent) && typeof lastSegment === "string") {
        parent[lastSegment] = nextValue;
      }

      return node.path;
    });
  }

  function removeSelectedValue() {
    if (!isStructureEditUnlocked) return;

    const node = getSelectedStructureNode();
    if (!node || node.segments.length === 0) return;

    mutateStructure((root) => {
      const parentSegments = node.segments.slice(0, -1);
      const lastSegment = node.segments[node.segments.length - 1];
      const parent = getNodeAtPath(root, parentSegments);
      const parentPath = formatPath(parentSegments);

      if (Array.isArray(parent) && typeof lastSegment === "number") {
        parent.splice(lastSegment, 1);
      } else if (isPlainObject(parent) && typeof lastSegment === "string") {
        delete parent[lastSegment];
      }

      return parentPath;
    });
  }

  function removeStructurePath(path: string) {
    if (!isStructureEditUnlocked) return;

    const node = getStructureNode(path);
    if (!node || node.segments.length === 0) return;

    mutateStructure((root) => {
      const parentSegments = node.segments.slice(0, -1);
      const lastSegment = node.segments[node.segments.length - 1];
      const parent = getNodeAtPath(root, parentSegments);
      const parentPath = formatPath(parentSegments);

      if (Array.isArray(parent) && typeof lastSegment === "number") {
        parent.splice(lastSegment, 1);
      } else if (isPlainObject(parent) && typeof lastSegment === "string") {
        delete parent[lastSegment];
      }

      return parentPath;
    });
  }

  function toggleStructureEditLock() {
    isStructureEditUnlocked = !isStructureEditUnlocked;
    if (!isStructureEditUnlocked) {
      autoNavigateStructureEdit = false;
    }
  }

  function getNextPathAfterInlineEdit(parentPath: string, childPath: string): string {
    if (autoNavigateStructureEdit) {
      shouldFocusAfterAutoNavigate = true;
      return childPath;
    }

    return parentPath;
  }

  function updateSelectedObjectValue(key: string, rawValue: string) {
    if (!isStructureEditUnlocked) return;

    const node = getSelectedStructureNode();
    if (!node) return;

    mutateStructure((root) => {
      const target = getNodeAtPath(root, node.segments);
      if (!isPlainObject(target)) return;

      target[key] = parseTableCellValue(rawValue);
      return getNextPathAfterInlineEdit(node.path, formatPath([...node.segments, key]));
    });
  }

  function renameSelectedObjectKey(oldKey: string, nextKeyRaw: string) {
    if (!isStructureEditUnlocked) return;

    const node = getSelectedStructureNode();
    if (!node) return;

    const nextKey = nextKeyRaw.trim();
    if (!nextKey || nextKey === oldKey) return;

    const currentValue = getSelectedStructureValue();
    if (!isPlainObject(currentValue)) return;

    if (Object.prototype.hasOwnProperty.call(currentValue, nextKey)) {
      toaster.error({ title: "Duplicate key", description: `Key '${nextKey}' already exists` });
      return;
    }

    mutateStructure((root) => {
      const target = getNodeAtPath(root, node.segments);
      if (!isPlainObject(target)) return;

      const existing = target[oldKey];
      delete target[oldKey];
      target[nextKey] = existing;
      return getNextPathAfterInlineEdit(node.path, formatPath([...node.segments, nextKey]));
    });
  }

  function updateSelectedArrayItem(index: number, rawValue: string) {
    if (!isStructureEditUnlocked) return;

    const node = getSelectedStructureNode();
    if (!node) return;

    mutateStructure((root) => {
      const target = getNodeAtPath(root, node.segments);
      if (!Array.isArray(target)) return;

      target[index] = parseTableCellValue(rawValue);
      return getNextPathAfterInlineEdit(node.path, formatPath([...node.segments, index]));
    });
  }

  function addObjectFieldToSelected() {
    if (!isStructureEditUnlocked) return;

    const node = getSelectedStructureNode();
    if (!node) return;

    const key = newObjectKey.trim();
    if (!key) return;

    let parsedValue: unknown;
    try {
      parsedValue = newObjectValue.trim() ? JSON.parse(newObjectValue) : "";
    } catch {
      parsedValue = newObjectValue;
    }

    mutateStructure((root) => {
      const target = getNodeAtPath(root, node.segments);
      if (!isPlainObject(target)) return;

      target[key] = parsedValue;
      return node.path;
    });

    newObjectKey = "";
    newObjectValue = "";
  }

  function addArrayItemToSelected() {
    if (!isStructureEditUnlocked) return;

    const node = getSelectedStructureNode();
    if (!node) return;

    let parsedValue: unknown;
    try {
      parsedValue = newArrayValue.trim() ? JSON.parse(newArrayValue) : "";
    } catch {
      parsedValue = newArrayValue;
    }

    mutateStructure((root) => {
      const target = getNodeAtPath(root, node.segments);
      if (!Array.isArray(target)) return;

      target.push(parsedValue);
      return node.path;
    });

    newArrayValue = "";
  }

  function applyStructureToInput() {
    if (structureRoot === null) return;

    if (structureChangeCount === 0) {
      toaster.success({ title: "No changes", description: "Structure matches current JSON" });
      return;
    }

    const processed = sortKeys ? sortObjectKeys(structureRoot) : structureRoot;
    const indent = indentSize === "tab" ? "\t" : indentSize;
    inputJson = JSON.stringify(processed, null, indent);
    toaster.success({ title: "Structure Applied", description: "Structure edits synced to JSON" });
  }

  // Parse and validate
  function parseJson(input: string): { data: unknown; error: string | null } {
    try {
      const data = JSON.parse(input);
      return { data, error: null };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid JSON";
      const lineMatch = message.match(/position (\d+)/);
      let line: number | undefined;
      if (lineMatch) {
        const pos = parseInt(lineMatch[1]);
        line = input.substring(0, pos).split("\n").length;
      }
      error = { message, line };
      return { data: null, error: message };
    }
  }

  // Format JSON
  function format() {
    error = null;
    const { data, error: parseError } = parseJson(inputJson);

    if (parseError) {
      isValid = false;
      outputJson = "";
      resetTableState("Fix JSON errors to enable table editor.");
      resetStructureState("Fix JSON errors to enable structure editor.");
      return;
    }

    isValid = true;

    // Sort keys if enabled
    const processed = sortKeys ? sortObjectKeys(data) : data;

    const indent = indentSize === "tab" ? "\t" : indentSize;
    outputJson = JSON.stringify(processed, null, indent);

    // Calculate stats
    calculateStats(data);
    syncTableFromData(data);
    syncStructureFromData(data);
  }

  // Minify JSON
  function minify() {
    error = null;
    const { data, error: parseError } = parseJson(inputJson);

    if (parseError) {
      isValid = false;
      outputJson = "";
      resetTableState("Fix JSON errors to enable table editor.");
      resetStructureState("Fix JSON errors to enable structure editor.");
      return;
    }

    isValid = true;
    outputJson = JSON.stringify(data);
    calculateStats(data);
    syncTableFromData(data);
    syncStructureFromData(data);
  }

  // Sort object keys recursively
  function sortObjectKeys(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    } else if (obj !== null && typeof obj === "object") {
      const sorted: Record<string, unknown> = {};
      Object.keys(obj)
        .sort()
        .forEach((key) => {
          sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
        });
      return sorted;
    }
    return obj;
  }

  // Calculate JSON statistics
  function calculateStats(data: unknown) {
    const jsonStr = JSON.stringify(data);
    const size = new Blob([jsonStr]).size;

    let keyCount = 0;
    let maxDepth = 0;

    function traverse(obj: unknown, depth: number) {
      maxDepth = Math.max(maxDepth, depth);
      if (Array.isArray(obj)) {
        obj.forEach((item) => traverse(item, depth + 1));
      } else if (obj !== null && typeof obj === "object") {
        keyCount += Object.keys(obj).length;
        Object.values(obj).forEach((val) => traverse(val, depth + 1));
      }
    }

    traverse(data, 0);

    inputStats = {
      keys: keyCount,
      depth: maxDepth,
      size: formatSize(size),
    };
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  // Copy to clipboard
  async function copyOutput() {
    await navigator.clipboard.writeText(outputJson);
    copied = true;
    toaster.success({ title: "Copied!", description: "JSON copied to clipboard" });
    setTimeout(() => (copied = false), 1500);
  }

  // Clear all
  function clearAll() {
    inputJson = "";
    outputJson = "";
    error = null;
    isValid = false;
    inputStats = null;
    resetTableState();
    resetStructureState();
  }

  // Load sample
  function loadSample() {
    inputJson = JSON.stringify(
      {
        name: "NetOps Solutions",
        version: "1.0.0",
        tools: [
          { id: "ip", name: "IP Calculator", category: "network" },
          { id: "dns", name: "DNS Lookup", category: "network" },
          { id: "jwt", name: "JWT Debugger", category: "dev" },
        ],
        config: {
          theme: "dark",
          language: "en",
          features: {
            autoSave: true,
            notifications: false,
          },
        },
      },
      null,
      2,
    );
  }

  // Auto-format on input change
  $effect(() => {
    const json = inputJson;
    sortKeys;
    indentSize;

    if (json) {
      untrack(() => format());
    } else {
      outputJson = "";
      error = null;
      isValid = false;
      inputStats = null;
      resetTableState();
      resetStructureState();
    }
  });

  // Keep editing flow smooth after Auto Navigate jumps
  $effect(() => {
    selectedStructurePath;
    primitiveEditorType;
    const shouldFocus = shouldFocusAfterAutoNavigate;

    if (!shouldFocus) return;

    requestAnimationFrame(() => {
      const target = primitiveEditorType === "json" ? primitiveTextareaRef : primitiveInputRef;
      if (target) {
        target.focus();
        if ("selectionStart" in target && "value" in target) {
          const end = target.value.length;
          target.selectionStart = end;
          target.selectionEnd = end;
        }
      }

      shouldFocusAfterAutoNavigate = false;
    });
  });

  // Highlight pending primitive value updates before clicking Update Value
  $effect(() => {
    selectedStructurePath;
    primitiveEditorType;
    primitiveEditorValue;
    isStructureEditUnlocked;
    structureRoot;

    updatePendingPrimitiveState();
  });
</script>

<svelte:head>
  <title>JSON Formatter - NetOps Solutions</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-6xl pb-20">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="h1 font-bold flex items-center gap-3">
      <FileJson class="size-8 text-primary-500" />
      JSON Formatter
      <span class="badge preset-filled-secondary-500 text-xs">V0.6</span>
      {#if isVerified}
        <span class="badge preset-tonal-success text-xs">Verified</span>
      {/if}
    </h1>
    <p class="text-surface-500 mt-2">Format, validate, minify, and explore JSON data</p>
  </div>

  <!-- Controls -->
  <div class="card p-4 bg-surface-50 dark:bg-surface-900 mb-6">
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="flex flex-wrap gap-2">
        <button class="btn preset-filled-primary-500" onclick={format}>
          <Maximize2 class="size-4" />
          Format
        </button>
        <button class="btn preset-tonal-surface" onclick={minify}>
          <Minimize2 class="size-4" />
          Minify
        </button>
        <button class="btn preset-tonal-surface" onclick={clearAll}>
          <RefreshCw class="size-4" />
          Clear
        </button>
        <button
          class="btn bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface"
          onclick={loadSample}
        >
          Load Sample
        </button>
      </div>

      <div class="flex flex-wrap gap-4 items-center">
        <label class="flex items-center gap-2">
          <span class="text-sm">Indent:</span>
          <select class="select select-sm" bind:value={indentSize}>
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </label>

        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" class="checkbox" bind:checked={sortKeys} />
          <span class="text-sm">Sort Keys</span>
        </label>
      </div>
    </div>
  </div>

  <!-- Status -->
  {#if inputJson}
    <div class="flex items-center gap-4 mb-4">
      {#if isValid}
        <div class="flex items-center gap-2 text-success-700 dark:text-success-300 font-medium">
          <CheckCircle class="size-5" />
          <span>Valid JSON</span>
        </div>
      {:else if error}
        <div class="flex items-center gap-2 text-error-700 dark:text-error-300 font-medium">
          <AlertCircle class="size-5" />
          <span>{error.message}</span>
          {#if error.line}
            <span class="text-sm">(line {error.line})</span>
          {/if}
        </div>
      {/if}

      {#if inputStats}
        <div class="flex items-center gap-4 text-sm text-surface-500 ml-auto">
          <span>{inputStats.keys} keys</span>
          <span>Depth: {inputStats.depth}</span>
          <span>{inputStats.size}</span>
        </div>
      {/if}
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Input -->
    <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
      <p class="font-medium">Input JSON</p>
      <textarea
        class="textarea font-mono text-sm min-h-[400px]"
        class:text-error-500={!isValid && inputJson}
        bind:value={inputJson}
        placeholder="Paste your JSON here..."
      ></textarea>
    </div>

    <!-- Output -->
    <div class="card p-4 bg-surface-50 dark:bg-surface-900 space-y-2">
      <div class="flex justify-between items-center">
        <p class="font-medium">Output</p>
        {#if outputJson}
          <button class="btn btn-sm preset-tonal-surface" onclick={copyOutput}>
            {#if copied}
              <Check class="size-4 text-success-500" />
            {:else}
              <Copy class="size-4" />
            {/if}
            Copy
          </button>
        {/if}
      </div>
      <textarea
        class="textarea font-mono text-sm min-h-[400px]"
        readonly
        value={outputJson}
        placeholder="Formatted JSON will appear here..."
      ></textarea>
    </div>
  </div>

  <!-- Human Structure Editor -->
  {#if inputJson}
    <div class={`card p-4 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4 ${structureChangeCount > 0 ? 'ring-2 ring-warning-500/40' : ''}`}>
      <div class="flex flex-wrap gap-3 items-center justify-between">
        <h2 class="h3 font-bold">Human Structure Editor</h2>
        <div class="flex flex-wrap gap-2 items-center">
          {#if structureChangeCount > 0}
            <span class="badge preset-filled-warning-500 text-xs animate-pulse">{structureChangeCount} changes</span>
          {:else}
            <span class="badge preset-tonal-surface text-xs">No changes</span>
          {/if}

          <button
            class={`badge text-xs px-3 py-1 cursor-pointer ${isStructureEditUnlocked ? 'preset-filled-success-500' : 'preset-filled-warning-500'}`}
            onclick={toggleStructureEditLock}
          >
            {#if isStructureEditUnlocked}
              <Unlock class="size-3.5" />
              Unlocked
            {:else}
              <Lock class="size-3.5" />
              Locked
            {/if}
          </button>

          <button
            class={`badge text-xs px-3 py-1 cursor-pointer ${autoNavigateStructureEdit ? 'preset-filled-primary-500' : 'preset-tonal-surface'}`}
            onclick={() => (autoNavigateStructureEdit = !autoNavigateStructureEdit)}
            disabled={!isStructureEditUnlocked}
          >
            Auto Navigate: {autoNavigateStructureEdit ? 'On' : 'Off'}
          </button>

          <button
            class={`btn btn-sm ${structureChangeCount > 0 ? 'preset-filled-warning-500 animate-bounce shadow-lg shadow-warning-500/25' : 'preset-filled-primary-500'}`}
            onclick={applyStructureToInput}
            disabled={structureRoot === null}
          >
            Apply Structure to JSON
          </button>
        </div>
      </div>

      {#if structureChangeCount > 0}
        <div class="alert alert-warning py-2">
          <span>Unsaved structure changes detected. Click <span class="font-medium">Apply Structure to JSON</span> to persist.</span>
        </div>
      {/if}

      {#if structureNodes.length > 0}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="space-y-2">
            <p class="text-sm font-medium">Navigate</p>
            <div class="max-h-[340px] overflow-auto rounded-lg border border-surface-500/20">
              {#each structureNodes as node}
                <button
                  class={`w-full text-left px-2 py-1.5 border-b border-surface-500/10 hover:bg-surface-500/5 ${selectedStructurePath === node.path ? 'bg-primary-500/10' : ''}`}
                  onclick={() => selectStructurePath(node.path)}
                  style={`padding-left: ${Math.min(node.depth, 8) * 16 + 10}px`}
                >
                  <div class="font-mono text-xs">{node.path}</div>
                  <div class="text-xs text-surface-500">{node.kind} · {node.preview}</div>
                </button>
              {/each}
            </div>
          </div>

          <div class="lg:col-span-2 space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm text-surface-500">Selected: <span class="font-mono">{selectedStructurePath}</span></p>
              {#if isStructureEditUnlocked}
                <span class="badge preset-filled-success-500 text-xs">Editing Enabled</span>
              {:else}
                <span class="badge preset-tonal-surface text-xs">Read Only</span>
              {/if}
            </div>

            {#if getSelectedStructureNode()?.kind === 'object'}
              <div class="space-y-3">
                <div class="overflow-auto rounded-lg border border-surface-500/20">
                  <table class="table table-hover min-w-full text-sm">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th>Value</th>
                        <th class="w-40">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each getSelectedObjectEntries() as entry}
                        <tr class={isNodeChanged(entry.segments) ? 'bg-warning-500/10' : ''}>
                          <td>
                            <input
                              class="input input-sm font-mono w-full"
                              value={entry.key}
                              disabled={!isStructureEditUnlocked}
                              onchange={(event) => renameSelectedObjectKey(entry.key, (event.currentTarget as HTMLInputElement).value)}
                            />
                          </td>
                          <td>
                            <input
                              class="input input-sm w-full"
                              value={entry.value}
                              disabled={!isStructureEditUnlocked}
                              oninput={(event) => updateSelectedObjectValue(entry.key, (event.currentTarget as HTMLInputElement).value)}
                            />
                          </td>
                          <td class="flex gap-2">
                            <button class="btn btn-xs preset-tonal-surface" onclick={() => selectStructurePath(entry.path)}>Open</button>
                            <button class="btn btn-xs preset-filled-error-500" onclick={() => removeStructurePath(entry.path)} disabled={!isStructureEditUnlocked}>Remove</button>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input class="input input-sm" bind:value={newObjectKey} placeholder="New key" disabled={!isStructureEditUnlocked} />
                  <input class="input input-sm" bind:value={newObjectValue} placeholder="Value (JSON or text)" disabled={!isStructureEditUnlocked} />
                  <button class="btn btn-sm preset-tonal-surface" onclick={addObjectFieldToSelected} disabled={!isStructureEditUnlocked}>Add Field</button>
                </div>
              </div>
            {:else if getSelectedStructureNode()?.kind === 'array'}
              <div class="space-y-3">
                <div class="overflow-auto rounded-lg border border-surface-500/20">
                  <table class="table table-hover min-w-full text-sm">
                    <thead>
                      <tr>
                        <th>Index</th>
                        <th>Value</th>
                        <th class="w-40">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each getSelectedArrayEntries() as entry}
                        <tr class={isNodeChanged(entry.segments) ? 'bg-warning-500/10' : ''}>
                          <td>{entry.index}</td>
                          <td>
                            <input
                              class="input input-sm w-full"
                              value={entry.value}
                              disabled={!isStructureEditUnlocked}
                              oninput={(event) => updateSelectedArrayItem(entry.index, (event.currentTarget as HTMLInputElement).value)}
                            />
                          </td>
                          <td class="flex gap-2">
                            <button class="btn btn-xs preset-tonal-surface" onclick={() => selectStructurePath(entry.path)}>Open</button>
                            <button class="btn btn-xs preset-filled-error-500" onclick={() => removeStructurePath(entry.path)} disabled={!isStructureEditUnlocked}>Remove</button>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input class="input input-sm" bind:value={newArrayValue} placeholder="New item (JSON or text)" disabled={!isStructureEditUnlocked} />
                  <button class="btn btn-sm preset-tonal-surface" onclick={addArrayItemToSelected} disabled={!isStructureEditUnlocked}>Add Item</button>
                </div>
              </div>
            {:else if getSelectedStructureNode()}
              <div class="space-y-3">
                <div class="flex flex-wrap gap-2">
                  <select class="select select-sm" bind:value={primitiveEditorType} disabled={!isStructureEditUnlocked}>
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="null">Null</option>
                    <option value="json">JSON</option>
                  </select>
                  <button
                    class={`btn btn-sm ${isStructureEditUnlocked
                      ? (hasPendingPrimitiveUpdate ? 'preset-filled-warning-500 animate-bounce' : 'preset-filled-primary-500')
                      : 'preset-tonal-surface'}`}
                    onclick={replaceSelectedValue}
                    disabled={!isStructureEditUnlocked}
                  >
                    Update Value
                  </button>
                  {#if selectedStructurePath !== '$'}
                    <button class="btn btn-sm preset-filled-error-500" onclick={removeSelectedValue} disabled={!isStructureEditUnlocked}>Remove Node</button>
                  {/if}
                </div>

                {#if primitiveEditorType === 'json'}
                  <textarea
                    class="textarea font-mono text-sm min-h-[140px]"
                    bind:this={primitiveTextareaRef}
                    bind:value={primitiveEditorValue}
                    disabled={!isStructureEditUnlocked}
                  ></textarea>
                {:else}
                  <input
                    class="input"
                    bind:this={primitiveInputRef}
                    bind:value={primitiveEditorValue}
                    disabled={!isStructureEditUnlocked}
                  />
                {/if}
              </div>
            {:else}
              <div class="alert alert-warning">
                <span>{structureMessage || 'Select a node from navigator.'}</span>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <div class="alert alert-warning">
          <span>{structureMessage || 'Structure editor is waiting for valid JSON.'}</span>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Human Readable Table Editor -->
  {#if inputJson}
    <div class="card p-4 bg-surface-50 dark:bg-surface-900 mt-6 space-y-4">
      <div class="flex flex-wrap gap-3 items-center justify-between">
        <h2 class="h3 font-bold">Human Table Editor</h2>
        {#if tableSupported}
          <div class="flex flex-wrap gap-2">
            {#if tableCandidates.length > 1}
              <select
                class="select select-sm"
                bind:value={selectedTablePath}
                onchange={(event) => changeTableSource((event.currentTarget as HTMLSelectElement).value)}
              >
                {#each tableCandidates as candidate}
                  <option value={candidate.path}>{candidate.label}</option>
                {/each}
              </select>
            {/if}
            <button class="btn btn-sm preset-tonal-surface" onclick={addTableRow}>Add Row</button>
            <input class="input input-sm" bind:value={newColumnName} placeholder="Column name" />
            <button class="btn btn-sm preset-tonal-surface" onclick={addTableColumn}>Add Column</button>
            <button class="btn btn-sm preset-filled-primary-500" onclick={applyTableToInput}>Apply to JSON</button>
          </div>
        {/if}
      </div>

      {#if tableSupported}
        <p class="text-sm text-surface-500">
          Editing source: <span class="font-medium">{selectedTablePath}</span>. Click
          <span class="font-medium">Apply to JSON</span> when done.
        </p>

        <div class="overflow-auto rounded-lg border border-surface-500/20">
          <table class="table table-hover min-w-full text-sm">
            <thead>
              <tr>
                <th class="w-16">#</th>
                {#each tableColumns as column}
                  <th>
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-medium">{column}</span>
                      <button
                        class="btn-icon btn-icon-xs"
                        onclick={() => removeTableColumn(column)}
                        title="Remove column">✕</button>
                    </div>
                  </th>
                {/each}
                <th class="w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#if tableRows.length === 0}
                <tr>
                  <td class="text-surface-500" colspan={tableColumns.length + 2}>
                    No rows yet. Click <span class="font-medium">Add Row</span>.
                  </td>
                </tr>
              {:else}
                {#each tableRows as row, rowIndex}
                  <tr>
                    <td class="text-surface-500">{rowIndex + 1}</td>
                    {#each tableColumns as column}
                      <td>
                        <input
                          class="input input-sm w-full"
                          value={row[column] ?? ""}
                          oninput={(event) =>
                            updateTableCell(rowIndex, column, (event.currentTarget as HTMLInputElement).value)}
                          placeholder="value"
                        />
                      </td>
                    {/each}
                    <td>
                      <button class="btn btn-sm preset-filled-error-500" onclick={() => removeTableRow(rowIndex)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>

        {#if tableMessage}
          <p class="text-xs text-surface-500">{tableMessage}</p>
        {/if}
      {:else}
        <div class="alert alert-warning">
          <span>{tableMessage || "Table editor works with arrays of objects anywhere in JSON."}</span>
        </div>
      {/if}
    </div>
  {/if}
</div>
