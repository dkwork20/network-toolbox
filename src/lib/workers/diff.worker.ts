import * as Diff from "diff";

type SplitLineType = "unchanged" | "removed" | "added" | "changed" | "empty";
type UnifiedLineType = "unchanged" | "removed" | "added";

interface SplitLineCell {
  text: string;
  type: SplitLineType;
  html?: string;
}

export interface SplitDiffRow {
  id: number;
  left: SplitLineCell;
  right: SplitLineCell;
}

export interface UnifiedDiffRow {
  id: number;
  prefix: "+" | "-" | " ";
  text: string;
  type: UnifiedLineType;
}

export interface DiffWorkerRequest {
  id: number;
  originalText: string;
  modifiedText: string;
  largeFileMode?: boolean;
  contextLines?: number;
}

export interface DiffWorkerResponse {
  id: number;
  splitRows: SplitDiffRow[];
  unifiedRows: UnifiedDiffRow[];
  additions: number;
  deletions: number;
  meta: {
    charDiffEnabled: boolean;
    charDiffAppliedPairs: number;
  };
  error?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function splitToLines(value: string): string[] {
  if (!value) return [];
  const lines = value.split("\n");
  if (value.endsWith("\n")) {
    lines.pop();
  }
  return lines;
}

function buildCharDiffHtml(oldLine: string, newLine: string, side: "left" | "right"): string {
  const charDiff = Diff.diffChars(oldLine, newLine);
  return charDiff
    .map((part) => {
      if (side === "left" && part.added) return "";
      if (side === "right" && part.removed) return "";

      const escaped = escapeHtml(part.value);
      if (part.added) {
        return `<span class="bg-success-500/40 text-success-600 dark:text-success-400">${escaped}</span>`;
      }
      if (part.removed) {
        return `<span class="bg-error-500/40 text-error-600 dark:text-error-400">${escaped}</span>`;
      }
      return escaped;
    })
    .join("");
}

function getLineCount(change: Diff.Change): number {
  return splitToLines(change.value).length;
}

function getMergedIntervals(changedIndices: number[], total: number, contextLines: number): Array<{ start: number; end: number }> {
  const intervals: Array<{ start: number; end: number }> = [];
  if (changedIndices.length === 0 || total === 0) return intervals;

  let currentStart = Math.max(0, changedIndices[0] - contextLines);
  let currentEnd = Math.min(total - 1, changedIndices[0] + contextLines);

  for (let i = 1; i < changedIndices.length; i++) {
    const index = changedIndices[i];
    const start = Math.max(0, index - contextLines);
    const end = Math.min(total - 1, index + contextLines);

    if (start <= currentEnd + 1) {
      currentEnd = Math.max(currentEnd, end);
    } else {
      intervals.push({ start: currentStart, end: currentEnd });
      currentStart = start;
      currentEnd = end;
    }
  }

  intervals.push({ start: currentStart, end: currentEnd });
  return intervals;
}

function isSplitRowUnchanged(row: SplitDiffRow): boolean {
  return row.left.type === "unchanged" && row.right.type === "unchanged";
}

function createSplitMarkerRow(id: number, omittedLines: number): SplitDiffRow {
  const text = `… ${omittedLines} unchanged lines omitted …`;
  return {
    id,
    left: { text, type: "unchanged" },
    right: { text, type: "unchanged" },
  };
}

function createUnifiedMarkerRow(id: number, omittedLines: number): UnifiedDiffRow {
  return {
    id,
    prefix: " ",
    text: `… ${omittedLines} unchanged lines omitted …`,
    type: "unchanged",
  };
}

function collapseSplitRows(rows: SplitDiffRow[], contextLines: number): SplitDiffRow[] {
  if (rows.length === 0) return rows;

  const changedIndices: number[] = [];
  for (let index = 0; index < rows.length; index++) {
    if (!isSplitRowUnchanged(rows[index])) {
      changedIndices.push(index);
    }
  }

  if (changedIndices.length === 0) {
    return [
      {
        id: 0,
        left: { text: `No differences · ${rows.length} unchanged lines`, type: "unchanged" },
        right: { text: `No differences · ${rows.length} unchanged lines`, type: "unchanged" },
      },
    ];
  }

  const intervals = getMergedIntervals(changedIndices, rows.length, contextLines);
  const collapsed: SplitDiffRow[] = [];
  let nextId = 0;
  let previousEnd = -1;

  intervals.forEach((interval) => {
    if (interval.start > previousEnd + 1) {
      collapsed.push(createSplitMarkerRow(nextId++, interval.start - (previousEnd + 1)));
    }

    for (let i = interval.start; i <= interval.end; i++) {
      collapsed.push({ ...rows[i], id: nextId++ });
    }

    previousEnd = interval.end;
  });

  if (previousEnd < rows.length - 1) {
    collapsed.push(createSplitMarkerRow(nextId++, rows.length - (previousEnd + 1)));
  }

  return collapsed;
}

function collapseUnifiedRows(rows: UnifiedDiffRow[], contextLines: number): UnifiedDiffRow[] {
  if (rows.length === 0) return rows;

  const changedIndices: number[] = [];
  for (let index = 0; index < rows.length; index++) {
    if (rows[index].type !== "unchanged") {
      changedIndices.push(index);
    }
  }

  if (changedIndices.length === 0) {
    return [
      {
        id: 0,
        prefix: " ",
        text: `No differences · ${rows.length} unchanged lines`,
        type: "unchanged",
      },
    ];
  }

  const intervals = getMergedIntervals(changedIndices, rows.length, contextLines);
  const collapsed: UnifiedDiffRow[] = [];
  let nextId = 0;
  let previousEnd = -1;

  intervals.forEach((interval) => {
    if (interval.start > previousEnd + 1) {
      collapsed.push(createUnifiedMarkerRow(nextId++, interval.start - (previousEnd + 1)));
    }

    for (let i = interval.start; i <= interval.end; i++) {
      collapsed.push({ ...rows[i], id: nextId++ });
    }

    previousEnd = interval.end;
  });

  if (previousEnd < rows.length - 1) {
    collapsed.push(createUnifiedMarkerRow(nextId++, rows.length - (previousEnd + 1)));
  }

  return collapsed;
}

function buildDiffPayload(
  id: number,
  originalText: string,
  modifiedText: string,
  largeFileMode = false,
  contextLines = 3,
): DiffWorkerResponse {
  if (!originalText && !modifiedText) {
    return {
      id,
      splitRows: [],
      unifiedRows: [],
      additions: 0,
      deletions: 0,
      meta: {
        charDiffEnabled: true,
        charDiffAppliedPairs: 0,
      },
    };
  }

  const diffResult = Diff.diffLines(originalText, modifiedText);
  const additions = diffResult.filter((part) => part.added).reduce((sum, part) => sum + getLineCount(part), 0);
  const deletions = diffResult.filter((part) => part.removed).reduce((sum, part) => sum + getLineCount(part), 0);

  const totalLength = originalText.length + modifiedText.length;
  const normalizedContextLines = Math.max(0, Math.min(contextLines, 30));
  const charDiffEnabled = !largeFileMode && totalLength <= 250_000;
  const maxCharDiffPairs =
    totalLength <= 80_000 ? 1200 :
    totalLength <= 150_000 ? 500 :
    180;
  const maxCharDiffLineLength = totalLength <= 80_000 ? 900 : 360;

  let charDiffAppliedPairs = 0;
  const splitRows: SplitDiffRow[] = [];
  const unifiedRows: UnifiedDiffRow[] = [];

  let splitRowId = 0;
  let unifiedRowId = 0;
  let index = 0;

  while (index < diffResult.length) {
    const current = diffResult[index];
    const next = diffResult[index + 1];

    if (current.removed && next?.added) {
      const oldLines = splitToLines(current.value);
      const newLines = splitToLines(next.value);
      const maxLen = Math.max(oldLines.length, newLines.length);

      for (let lineIndex = 0; lineIndex < maxLen; lineIndex++) {
        const oldLine = oldLines[lineIndex] ?? "";
        const newLine = newLines[lineIndex] ?? "";

        if (oldLine && newLine) {
          const canHighlight =
            charDiffEnabled &&
            oldLine !== newLine &&
            charDiffAppliedPairs < maxCharDiffPairs &&
            oldLine.length + newLine.length <= maxCharDiffLineLength;

          if (canHighlight) {
            charDiffAppliedPairs += 1;
          }

          splitRows.push({
            id: splitRowId++,
            left: {
              text: oldLine,
              type: oldLine === newLine ? "unchanged" : "changed",
              html: canHighlight ? buildCharDiffHtml(oldLine, newLine, "left") : undefined,
            },
            right: {
              text: newLine,
              type: oldLine === newLine ? "unchanged" : "changed",
              html: canHighlight ? buildCharDiffHtml(oldLine, newLine, "right") : undefined,
            },
          });
        } else if (oldLine) {
          splitRows.push({
            id: splitRowId++,
            left: { text: oldLine, type: "removed" },
            right: { text: "", type: "empty" },
          });
        } else if (newLine) {
          splitRows.push({
            id: splitRowId++,
            left: { text: "", type: "empty" },
            right: { text: newLine, type: "added" },
          });
        }
      }

      oldLines.forEach((line) => {
        unifiedRows.push({
          id: unifiedRowId++,
          prefix: "-",
          text: line,
          type: "removed",
        });
      });

      newLines.forEach((line) => {
        unifiedRows.push({
          id: unifiedRowId++,
          prefix: "+",
          text: line,
          type: "added",
        });
      });

      index += 2;
      continue;
    }

    if (current.removed) {
      const lines = splitToLines(current.value);
      lines.forEach((line) => {
        splitRows.push({
          id: splitRowId++,
          left: { text: line, type: "removed" },
          right: { text: "", type: "empty" },
        });
        unifiedRows.push({
          id: unifiedRowId++,
          prefix: "-",
          text: line,
          type: "removed",
        });
      });
      index += 1;
      continue;
    }

    if (current.added) {
      const lines = splitToLines(current.value);
      lines.forEach((line) => {
        splitRows.push({
          id: splitRowId++,
          left: { text: "", type: "empty" },
          right: { text: line, type: "added" },
        });
        unifiedRows.push({
          id: unifiedRowId++,
          prefix: "+",
          text: line,
          type: "added",
        });
      });
      index += 1;
      continue;
    }

    const lines = splitToLines(current.value);
    lines.forEach((line) => {
      splitRows.push({
        id: splitRowId++,
        left: { text: line, type: "unchanged" },
        right: { text: line, type: "unchanged" },
      });
      unifiedRows.push({
        id: unifiedRowId++,
        prefix: " ",
        text: line,
        type: "unchanged",
      });
    });
    index += 1;
  }

  const finalSplitRows = largeFileMode ? collapseSplitRows(splitRows, normalizedContextLines) : splitRows;
  const finalUnifiedRows = largeFileMode ? collapseUnifiedRows(unifiedRows, normalizedContextLines) : unifiedRows;

  return {
    id,
    splitRows: finalSplitRows,
    unifiedRows: finalUnifiedRows,
    additions,
    deletions,
    meta: {
      charDiffEnabled,
      charDiffAppliedPairs,
    },
  };
}

self.onmessage = (event: MessageEvent<DiffWorkerRequest>) => {
  const { id, originalText, modifiedText, largeFileMode = false, contextLines = 3 } = event.data;

  try {
    const payload = buildDiffPayload(id, originalText, modifiedText, largeFileMode, contextLines);
    self.postMessage(payload);
  } catch (error) {
    const response: DiffWorkerResponse = {
      id,
      splitRows: [],
      unifiedRows: [],
      additions: 0,
      deletions: 0,
      meta: {
        charDiffEnabled: false,
        charDiffAppliedPairs: 0,
      },
      error: (error as Error).message,
    };
    self.postMessage(response);
  }
};
