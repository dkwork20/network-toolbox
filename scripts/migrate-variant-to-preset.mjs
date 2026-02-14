#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

const VARIANT_TO_PRESET_MAP = [
  ["variant-filled-primary", "preset-filled-primary-500"],
  ["variant-filled-secondary", "preset-filled-secondary-500"],
  ["variant-filled-tertiary", "preset-filled-tertiary-500"],
  ["variant-filled-success", "preset-filled-success-500"],
  ["variant-filled-warning", "preset-filled-warning-500"],
  ["variant-filled-error", "preset-filled-error-500"],
  ["variant-filled-surface", "preset-filled-surface-500"],
  ["variant-filled", "preset-filled"],
  ["variant-soft-primary", "preset-tonal-primary"],
  ["variant-soft-secondary", "preset-tonal-secondary"],
  ["variant-soft-warning", "preset-tonal-warning"],
  ["variant-soft-error", "preset-tonal-error"],
  ["variant-soft-surface", "preset-tonal-surface"],
  ["variant-soft", "preset-tonal"],
  ["variant-ringed-surface", "preset-outlined-surface-500"],
  [
    "variant-ghost-surface",
    "bg-transparent text-surface-900 dark:text-surface-100 hover:preset-tonal-surface",
  ],
  [
    "variant-ghost-error",
    "bg-transparent text-error-600 dark:text-error-400 hover:preset-tonal-error",
  ],
  ["variant-ghost", "bg-transparent"],
].sort((first, second) => second[0].length - first[0].length);

const args = new Set(process.argv.slice(2));
const writeMode = args.has("--write");
const verboseMode = args.has("--verbose");

const projectRoot = process.cwd();
const targetRoot = path.join(projectRoot, "src");
const targetExtensions = new Set([".svelte"]);

function escapeForRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function collectFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
      continue;
    }

    if (targetExtensions.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

function countOccurrences(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

async function run() {
  const files = await collectFiles(targetRoot);
  let touchedFiles = 0;
  let totalReplacements = 0;

  const replacementSummary = new Map(
    VARIANT_TO_PRESET_MAP.map(([from]) => [from, 0]),
  );

  for (const file of files) {
    const original = await fs.readFile(file, "utf8");
    let next = original;
    const perFileChanges = [];

    for (const [from, to] of VARIANT_TO_PRESET_MAP) {
      const tokenRegex = new RegExp(
        `(?<![A-Za-z0-9-])${escapeForRegex(from)}(?![A-Za-z0-9-])`,
        "g",
      );

      const count = countOccurrences(next, tokenRegex);
      if (count === 0) continue;

      next = next.replace(tokenRegex, to);
      perFileChanges.push({ from, to, count });
      replacementSummary.set(from, replacementSummary.get(from) + count);
      totalReplacements += count;
    }

    if (perFileChanges.length === 0) continue;

    touchedFiles += 1;
    const relativePath = path.relative(projectRoot, file).replaceAll("\\", "/");
    const perFileCount = perFileChanges.reduce(
      (sum, change) => sum + change.count,
      0,
    );

    console.log(`[${writeMode ? "write" : "dry-run"}] ${relativePath} (${perFileCount})`);

    if (verboseMode) {
      for (const change of perFileChanges) {
        console.log(`  - ${change.from} -> ${change.to} (${change.count})`);
      }
    }

    if (writeMode) {
      await fs.writeFile(file, next, "utf8");
    }
  }

  const unresolvedTokens = new Map();

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const matches = content.match(/\bvariant-[a-z0-9-]+\b/g) ?? [];

    for (const token of matches) {
      unresolvedTokens.set(token, (unresolvedTokens.get(token) ?? 0) + 1);
    }
  }

  console.log("");
  console.log(`Mode: ${writeMode ? "WRITE" : "DRY-RUN"}`);
  console.log(`Files scanned: ${files.length}`);
  console.log(`Files affected: ${touchedFiles}`);
  console.log(`Total replacements: ${totalReplacements}`);

  const usedMappings = Array.from(replacementSummary.entries()).filter(
    (entry) => entry[1] > 0,
  );
  if (usedMappings.length > 0) {
    console.log("Mappings applied:");
    for (const [token, count] of usedMappings) {
      console.log(`  - ${token}: ${count}`);
    }
  }

  if (unresolvedTokens.size > 0) {
    console.log("Remaining variant tokens (manual review):");
    for (const [token, count] of Array.from(unresolvedTokens.entries()).sort()) {
      console.log(`  - ${token}: ${count}`);
    }
  } else {
    console.log("Remaining variant tokens: none");
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

