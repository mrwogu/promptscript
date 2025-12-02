import { existsSync } from 'fs';
import { readdir } from 'fs/promises';

/**
 * Supported AI tool targets.
 */
export type AIToolTarget = 'github' | 'claude' | 'cursor';

/**
 * AI tool detection result.
 */
export interface AIToolsDetection {
  /** Detected AI tools with existing configuration */
  detected: AIToolTarget[];
  /** Details about detected files */
  details: Record<AIToolTarget, string[]>;
}

/**
 * File patterns for each AI tool.
 */
interface AIToolPattern {
  target: AIToolTarget;
  files: string[];
  directories: string[];
}

const AI_TOOL_PATTERNS: AIToolPattern[] = [
  {
    target: 'github',
    files: ['.github/copilot-instructions.md'],
    directories: ['.github'],
  },
  {
    target: 'claude',
    files: ['CLAUDE.md', '.claude/settings.json', 'claude.md'],
    directories: ['.claude'],
  },
  {
    target: 'cursor',
    files: ['.cursorrules', '.cursor/rules.md'],
    directories: ['.cursor'],
  },
];

/**
 * Check if a directory exists and is not empty.
 */
async function directoryHasContent(dir: string): Promise<boolean> {
  if (!existsSync(dir)) return false;
  try {
    const entries = await readdir(dir);
    return entries.length > 0;
  } catch {
    return false;
  }
}

/**
 * Detect existing AI tool configurations.
 */
export async function detectAITools(): Promise<AIToolsDetection> {
  const detected: AIToolTarget[] = [];
  const details: Record<AIToolTarget, string[]> = {
    github: [],
    claude: [],
    cursor: [],
  };

  for (const pattern of AI_TOOL_PATTERNS) {
    const foundFiles: string[] = [];

    // Check specific files
    for (const file of pattern.files) {
      if (existsSync(file)) {
        foundFiles.push(file);
      }
    }

    // Check directories
    for (const dir of pattern.directories) {
      if (await directoryHasContent(dir)) {
        foundFiles.push(`${dir}/`);
      }
    }

    if (foundFiles.length > 0) {
      detected.push(pattern.target);
      details[pattern.target] = foundFiles;
    }
  }

  return { detected, details };
}

/**
 * Get all available targets.
 */
export function getAllTargets(): AIToolTarget[] {
  return ['github', 'claude', 'cursor'];
}

/**
 * Get suggested targets based on detection.
 * If no tools detected, suggest all. Otherwise, suggest detected ones.
 */
export function getSuggestedTargets(detection: AIToolsDetection): AIToolTarget[] {
  return detection.detected.length > 0 ? detection.detected : getAllTargets();
}

/**
 * Format detection results for display.
 */
export function formatDetectionResults(detection: AIToolsDetection): string[] {
  const lines: string[] = [];

  if (detection.detected.length === 0) {
    lines.push('No existing AI tool configurations detected.');
    return lines;
  }

  lines.push('Detected AI tool configurations:');

  for (const target of detection.detected) {
    const files = detection.details[target];
    lines.push(`  • ${target}: ${files.join(', ')}`);
  }

  return lines;
}
