#!/usr/bin/env npx ts-node --esm
/**
 * Script to add "Try in Playground" links after PromptScript code examples in markdown files.
 *
 * Usage:
 *   pnpm playground:links          # Add links to all docs
 *   pnpm playground:links --check  # Check if links are up to date (CI mode)
 *   pnpm playground:links --clean  # Remove all playground links
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import LZString from 'lz-string';

const PLAYGROUND_BASE_URL = 'https://getpromptscript.dev/playground/';
const PLAYGROUND_DEV_URL = 'https://getpromptscript.dev/playground-dev/';

// Use production playground by default
const PLAYGROUND_URL = PLAYGROUND_BASE_URL;

// Marker to identify auto-generated playground links
const LINK_MARKER_START = '<!-- playground-link-start -->';
const LINK_MARKER_END = '<!-- playground-link-end -->';

// Regex to match playground link blocks (for removal/update)
const LINK_BLOCK_REGEX = new RegExp(
  `\\n?${escapeRegex(LINK_MARKER_START)}[\\s\\S]*?${escapeRegex(LINK_MARKER_END)}\\n?`,
  'g'
);

// Regex to match PRS code blocks
// Matches ```prs, ```promptscript, or ```prs title="..." etc.
// Note: Use [ \t]+ (not \s+) to avoid matching newlines in the optional attribute part
const CODE_BLOCK_REGEX = /```(?:prs|promptscript)(?:[ \t]+[^\n]*)?\n([\s\S]*?)```/g;

interface ShareableState {
  files: Array<{ path: string; content: string }>;
  entry?: string;
  formatter?: string;
  version: string;
}

interface ProcessResult {
  file: string;
  added: number;
  removed: number;
  updated: number;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove common leading whitespace from all lines (dedent).
 * This is needed for code blocks inside tabbed content which have extra indentation.
 */
function dedent(text: string): string {
  const lines = text.split('\n');

  // Find minimum indentation (ignoring empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const match = line.match(/^(\s*)/);
    if (match) {
      minIndent = Math.min(minIndent, match[1].length);
    }
  }

  // If no indentation found or infinite, return as-is
  if (minIndent === Infinity || minIndent === 0) {
    return text;
  }

  // Remove the common indentation from all lines
  return lines.map((line) => line.slice(minIndent)).join('\n');
}

/**
 * Encode playground state to URL-safe string (same as playground uses).
 */
function encodeState(content: string, filename = 'example.prs'): string {
  const state: ShareableState = {
    files: [{ path: filename, content }],
    entry: filename,
    version: '1',
  };

  const json = JSON.stringify(state);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Generate playground URL for a code example.
 */
function generatePlaygroundUrl(code: string, filename = 'example.prs'): string {
  const encoded = encodeState(code, filename);
  return `${PLAYGROUND_URL}?s=${encoded}`;
}

/**
 * Create the markdown link block.
 */
function createLinkBlock(url: string): string {
  // Using a styled link that works in both GitHub and MkDocs
  return `
${LINK_MARKER_START}
<a href="${url}" target="_blank" rel="noopener noreferrer">
  <img src="https://img.shields.io/badge/Try_in-Playground-blue?style=flat-square" alt="Try in Playground" />
</a>
${LINK_MARKER_END}
`;
}

/**
 * Process a single markdown file.
 */
function processMarkdownFile(filePath: string, mode: 'add' | 'check' | 'clean'): ProcessResult {
  const originalContent = readFileSync(filePath, 'utf-8');
  let content = originalContent;
  let added = 0;
  let removed = 0;
  let updated = 0;

  // First, remove all existing playground links
  const withoutLinks = content.replace(LINK_BLOCK_REGEX, '');
  const existingLinkCount = (content.match(LINK_BLOCK_REGEX) || []).length;

  if (mode === 'clean') {
    if (existingLinkCount > 0) {
      writeFileSync(filePath, withoutLinks);
      removed = existingLinkCount;
    }
    return { file: filePath, added: 0, removed, updated: 0 };
  }

  // Work with content without existing links
  content = withoutLinks;

  // Find all PRS code blocks and add links after them
  const newContent = content.replace(CODE_BLOCK_REGEX, (match, codeContent: string) => {
    // Dedent first (removes common leading whitespace from tabbed content), then trim
    const trimmedCode = dedent(codeContent).trim();

    // Skip empty or very short examples
    if (trimmedCode.length < 10) {
      return match;
    }

    // Skip examples that are clearly fragments (no meta block, just showing syntax)
    // But include examples that look complete (have --- or meaningful content)
    const looksComplete =
      trimmedCode.includes('---') ||
      trimmedCode.startsWith('name:') ||
      trimmedCode.startsWith('# ') ||
      trimmedCode.includes('inherit ') ||
      trimmedCode.includes('use ');

    // Also include examples that are just content blocks (instructions)
    const hasContent = trimmedCode.length > 30;

    if (!looksComplete && !hasContent) {
      return match;
    }

    const url = generatePlaygroundUrl(trimmedCode);
    const linkBlock = createLinkBlock(url);
    added++;

    return match + linkBlock;
  });

  if (mode === 'check') {
    // In check mode, compare and report differences
    if (newContent !== originalContent) {
      const diff = Math.abs(added - existingLinkCount);
      if (existingLinkCount === 0 && added > 0) {
        return { file: filePath, added, removed: 0, updated: 0 };
      } else if (added !== existingLinkCount) {
        return { file: filePath, added: 0, removed: 0, updated: diff };
      }
    }
    return { file: filePath, added: 0, removed: 0, updated: 0 };
  }

  // Write the updated content
  if (newContent !== originalContent) {
    writeFileSync(filePath, newContent);
    if (existingLinkCount > 0) {
      updated = added;
      added = 0;
    }
  }

  return { file: filePath, added, removed: 0, updated };
}

/**
 * Recursively find all markdown files in a directory.
 */
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, .git, etc.
      if (!['node_modules', 'dist', '.git', 'coverage', 'api-reference'].includes(entry)) {
        files.push(...findMarkdownFiles(fullPath));
      }
    } else if (entry.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Main function.
 */
function main(): void {
  const args = process.argv.slice(2);
  const mode = args.includes('--check') ? 'check' : args.includes('--clean') ? 'clean' : 'add';
  const rootDir = process.cwd();

  console.log(`\n🎮 Playground Links - Mode: ${mode.toUpperCase()}\n`);

  // Find all markdown files in docs/ and README.md
  const files: string[] = [];

  // Add docs directory
  const docsDir = join(rootDir, 'docs');
  files.push(...findMarkdownFiles(docsDir));

  // Add root README
  const readmePath = join(rootDir, 'README.md');
  files.push(readmePath);

  const results: ProcessResult[] = [];
  let totalAdded = 0;
  let totalRemoved = 0;
  let totalUpdated = 0;

  for (const file of files) {
    try {
      const result = processMarkdownFile(file, mode);
      if (result.added > 0 || result.removed > 0 || result.updated > 0) {
        results.push(result);
        totalAdded += result.added;
        totalRemoved += result.removed;
        totalUpdated += result.updated;
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  // Print results
  if (results.length === 0) {
    console.log('✅ No changes needed.\n');
    return;
  }

  console.log('Changes:');
  for (const result of results) {
    const relPath = relative(rootDir, result.file);
    const changes: string[] = [];
    if (result.added > 0) changes.push(`+${result.added} added`);
    if (result.removed > 0) changes.push(`-${result.removed} removed`);
    if (result.updated > 0) changes.push(`~${result.updated} updated`);
    console.log(`  ${relPath}: ${changes.join(', ')}`);
  }

  console.log(`\nSummary:`);
  console.log(`  Files processed: ${files.length}`);
  console.log(`  Files changed: ${results.length}`);
  if (totalAdded > 0) console.log(`  Links added: ${totalAdded}`);
  if (totalRemoved > 0) console.log(`  Links removed: ${totalRemoved}`);
  if (totalUpdated > 0) console.log(`  Links updated: ${totalUpdated}`);
  console.log();

  // Exit with error in check mode if changes are needed
  if (mode === 'check' && results.length > 0) {
    console.error('❌ Playground links are out of date. Run `pnpm playground:links` to update.\n');
    process.exit(1);
  }

  console.log('✅ Done!\n');
}

main();
