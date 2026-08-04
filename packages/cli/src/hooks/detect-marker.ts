import { readFile } from 'node:fs/promises';
import { isGeneratedByPromptScript } from '@promptscript/core';

export interface MarkerResult {
  isGenerated: boolean;
  source: string | null;
  target: string | null;
}

/**
 * Number of leading lines inspected for a generation marker. Generated outputs
 * always carry the marker in their header, so a short window keeps quoted
 * markers deeper in a file from being mistaken for real ones.
 */
const MARKER_HEAD_LINES = 5;

// Assembled from fragments so this file is not itself detected as generated
// output by marker scanners.
const LEGACY_MARKER = new RegExp(`^>\\s*Auto-${'generated'} by PromptScript(?:\\s.*)?$`);

const SOURCE_TARGET_RE = /\|\s*source:\s*(\S+)\s*\|\s*target:\s*(\S+)/;

export async function detectMarker(filePath: string): Promise<MarkerResult> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    return { isGenerated: false, source: null, target: null };
  }

  const head = content.split('\n', MARKER_HEAD_LINES);
  const markerLine = head.find(
    (line) => isGeneratedByPromptScript(line) || LEGACY_MARKER.test(line.trim())
  );
  if (markerLine === undefined) {
    return { isGenerated: false, source: null, target: null };
  }

  const match = SOURCE_TARGET_RE.exec(markerLine);
  return {
    isGenerated: true,
    source: match?.[1] ?? null,
    target: match?.[2] ?? null,
  };
}
