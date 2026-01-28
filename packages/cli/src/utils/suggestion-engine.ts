import type {
  RegistryManifest,
  SuggestionCondition,
  SuggestionResult,
  SuggestionReasoning,
  ProjectContext,
  CatalogEntry,
} from '@promptscript/core';
import type { ProjectInfo } from './project-detector.js';
import type { CliServices } from '../services.js';
import { createDefaultServices } from '../services.js';

/**
 * Build project context from detected project info.
 */
export async function buildProjectContext(
  projectInfo: ProjectInfo,
  services: CliServices = createDefaultServices()
): Promise<ProjectContext> {
  const files = await detectProjectFiles(services);
  const dependencies = await detectDependencies(services);

  return {
    files,
    dependencies,
    languages: projectInfo.languages,
    frameworks: projectInfo.frameworks,
  };
}

/**
 * Detect relevant project files.
 */
async function detectProjectFiles(services: CliServices): Promise<string[]> {
  const relevantFiles = [
    'package.json',
    'tsconfig.json',
    'pyproject.toml',
    'requirements.txt',
    'Cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    '.git',
    '.env',
    '.env.example',
    'jest.config.js',
    'vitest.config.ts',
    'vitest.config.js',
    'pytest.ini',
    'next.config.js',
    'next.config.mjs',
    'next.config.ts',
    'nuxt.config.js',
    'nuxt.config.ts',
    'vite.config.js',
    'vite.config.ts',
    'Dockerfile',
    'docker-compose.yml',
  ];

  const existingFiles: string[] = [];
  for (const file of relevantFiles) {
    if (services.fs.existsSync(file)) {
      existingFiles.push(file);
    }
  }
  return existingFiles;
}

/**
 * Detect project dependencies from package.json.
 */
async function detectDependencies(services: CliServices): Promise<string[]> {
  if (!services.fs.existsSync('package.json')) {
    return [];
  }

  try {
    const content = await services.fs.readFile('package.json', 'utf-8');
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    return [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
  } catch {
    return [];
  }
}

/**
 * Calculate suggestions based on project context and manifest rules.
 *
 * @param manifest - The registry manifest with suggestion rules
 * @param context - Project context with detected features
 * @returns Suggestions with reasoning
 *
 * @example
 * ```typescript
 * const suggestions = calculateSuggestions(manifest, {
 *   files: ['package.json', 'tsconfig.json'],
 *   dependencies: ['react', 'typescript'],
 *   languages: ['typescript'],
 *   frameworks: ['react']
 * });
 * // suggestions.inherit = '@stacks/react'
 * // suggestions.use = ['@fragments/testing', '@fragments/typescript']
 * ```
 */
export function calculateSuggestions(
  manifest: RegistryManifest,
  context: ProjectContext
): SuggestionResult {
  const result: SuggestionResult = {
    inherit: undefined,
    use: [],
    skills: [],
    reasoning: [],
  };

  // Track what we've already suggested to avoid duplicates
  const suggestedUse = new Set<string>();
  const suggestedSkills = new Set<string>();

  for (const rule of manifest.suggestionRules) {
    const match = matchCondition(rule.condition, context);
    if (match.matches) {
      // Handle inherit suggestion
      if (rule.suggest.inherit) {
        // Only set inherit if not already set (first match wins for inherit)
        if (!result.inherit) {
          result.inherit = rule.suggest.inherit;
          result.reasoning.push({
            suggestion: `inherit: ${rule.suggest.inherit}`,
            reason: match.reason,
            trigger: match.trigger,
            matchedValue: match.matchedValue,
          });
        }
      }

      // Handle use suggestions
      if (rule.suggest.use) {
        for (const useItem of rule.suggest.use) {
          if (!suggestedUse.has(useItem)) {
            suggestedUse.add(useItem);
            result.use.push(useItem);
            result.reasoning.push({
              suggestion: `use: ${useItem}`,
              reason: match.reason,
              trigger: match.trigger,
              matchedValue: match.matchedValue,
            });
          }
        }
      }

      // Handle skills suggestions
      if (rule.suggest.skills) {
        for (const skill of rule.suggest.skills) {
          if (!suggestedSkills.has(skill)) {
            suggestedSkills.add(skill);
            result.skills.push(skill);
            result.reasoning.push({
              suggestion: `skill: ${skill}`,
              reason: match.reason,
              trigger: match.trigger,
              matchedValue: match.matchedValue,
            });
          }
        }
      }
    }
  }

  return result;
}

/**
 * Match result with reasoning.
 */
interface MatchResult {
  matches: boolean;
  reason: string;
  trigger: SuggestionReasoning['trigger'];
  matchedValue?: string;
}

/**
 * Check if a condition matches the project context.
 */
function matchCondition(condition: SuggestionCondition, context: ProjectContext): MatchResult {
  // Always condition
  if (condition.always) {
    return {
      matches: true,
      reason: 'Default recommendation',
      trigger: 'always',
    };
  }

  // File condition
  if (condition.files) {
    for (const file of condition.files) {
      if (context.files.includes(file)) {
        return {
          matches: true,
          reason: `Detected file: ${file}`,
          trigger: 'file',
          matchedValue: file,
        };
      }
    }
  }

  // Dependency condition
  if (condition.dependencies) {
    for (const dep of condition.dependencies) {
      if (context.dependencies.includes(dep)) {
        return {
          matches: true,
          reason: `Detected dependency: ${dep}`,
          trigger: 'dependency',
          matchedValue: dep,
        };
      }
    }
  }

  // Language condition
  if (condition.languages) {
    for (const lang of condition.languages) {
      if (context.languages.includes(lang)) {
        return {
          matches: true,
          reason: `Detected language: ${lang}`,
          trigger: 'language',
          matchedValue: lang,
        };
      }
    }
  }

  // Framework condition
  if (condition.frameworks) {
    for (const framework of condition.frameworks) {
      if (context.frameworks.includes(framework)) {
        return {
          matches: true,
          reason: `Detected framework: ${framework}`,
          trigger: 'framework',
          matchedValue: framework,
        };
      }
    }
  }

  return {
    matches: false,
    reason: '',
    trigger: 'always',
  };
}

/**
 * Get catalog entries that match detection hints for a project context.
 */
export function getMatchingCatalogEntries(
  manifest: RegistryManifest,
  context: ProjectContext
): Array<{ entry: CatalogEntry; reason: string }> {
  const matches: Array<{ entry: CatalogEntry; reason: string }> = [];

  for (const entry of manifest.catalog) {
    if (!entry.detectionHints) continue;

    const hints = entry.detectionHints;

    // Always match
    if (hints.always) {
      matches.push({ entry, reason: 'Recommended for all projects' });
      continue;
    }

    // File match
    if (hints.files) {
      const matchedFile = hints.files.find((f) => context.files.includes(f));
      if (matchedFile) {
        matches.push({ entry, reason: `Detected file: ${matchedFile}` });
        continue;
      }
    }

    // Dependency match
    if (hints.dependencies) {
      const matchedDep = hints.dependencies.find((d) => context.dependencies.includes(d));
      if (matchedDep) {
        matches.push({ entry, reason: `Detected dependency: ${matchedDep}` });
        continue;
      }
    }

    // Language match
    if (hints.languages) {
      const matchedLang = hints.languages.find((l) => context.languages.includes(l));
      if (matchedLang) {
        matches.push({ entry, reason: `Detected language: ${matchedLang}` });
        continue;
      }
    }

    // Framework match
    if (hints.frameworks) {
      const matchedFramework = hints.frameworks.find((f) => context.frameworks.includes(f));
      if (matchedFramework) {
        matches.push({ entry, reason: `Detected framework: ${matchedFramework}` });
        continue;
      }
    }
  }

  return matches;
}

/**
 * Format suggestion result for display.
 */
export function formatSuggestionResult(result: SuggestionResult): string[] {
  const lines: string[] = [];

  if (result.inherit) {
    lines.push(`📦 Inherit: ${result.inherit}`);
  }

  if (result.use.length > 0) {
    lines.push(`🔧 Use: ${result.use.join(', ')}`);
  }

  if (result.skills.length > 0) {
    lines.push(`⚡ Skills: ${result.skills.join(', ')}`);
  }

  if (result.reasoning.length > 0) {
    lines.push('');
    lines.push('Reasoning:');
    for (const r of result.reasoning) {
      lines.push(`  • ${r.suggestion} (${r.reason})`);
    }
  }

  return lines;
}

/**
 * Create interactive choices from suggestions.
 */
export function createSuggestionChoices(
  manifest: RegistryManifest,
  result: SuggestionResult
): Array<{ name: string; value: string; checked: boolean; description?: string }> {
  const choices: Array<{ name: string; value: string; checked: boolean; description?: string }> =
    [];

  // Add inherit as a choice if present
  if (result.inherit) {
    const entry = manifest.catalog.find((e) => e.id === result.inherit);
    choices.push({
      name: `${result.inherit} (inherit)`,
      value: `inherit:${result.inherit}`,
      checked: true,
      description: entry?.description,
    });
  }

  // Add all use items as choices
  for (const use of result.use) {
    const entry = manifest.catalog.find((e) => e.id === use);
    choices.push({
      name: `${use} (use)`,
      value: `use:${use}`,
      checked: true,
      description: entry?.description,
    });
  }

  // Add all skills as choices
  for (const skill of result.skills) {
    const entry = manifest.catalog.find((e) => e.id === skill);
    choices.push({
      name: `${skill} (skill)`,
      value: `skill:${skill}`,
      checked: true,
      description: entry?.description,
    });
  }

  return choices;
}

/**
 * Parse selected choices back into a suggestion result.
 */
export function parseSelectedChoices(selected: string[]): {
  inherit?: string;
  use: string[];
  skills: string[];
} {
  const result: { inherit?: string; use: string[]; skills: string[] } = {
    use: [],
    skills: [],
  };

  for (const choice of selected) {
    if (choice.startsWith('inherit:')) {
      result.inherit = choice.slice('inherit:'.length);
    } else if (choice.startsWith('use:')) {
      result.use.push(choice.slice('use:'.length));
    } else if (choice.startsWith('skill:')) {
      result.skills.push(choice.slice('skill:'.length));
    }
  }

  return result;
}
