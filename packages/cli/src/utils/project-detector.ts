import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename } from 'path';

/**
 * Project detection result.
 */
export interface ProjectInfo {
  /** Detected project name */
  name: string;
  /** Source of the detected name */
  source: 'package.json' | 'pyproject.toml' | 'cargo.toml' | 'go.mod' | 'directory';
  /** Detected programming languages */
  languages: string[];
  /** Detected frameworks */
  frameworks: string[];
}

/**
 * Language detection patterns.
 */
interface LanguagePattern {
  files: string[];
  language: string;
}

const LANGUAGE_PATTERNS: LanguagePattern[] = [
  { files: ['package.json', 'tsconfig.json'], language: 'typescript' },
  { files: ['package.json'], language: 'javascript' },
  { files: ['pyproject.toml', 'requirements.txt', 'setup.py'], language: 'python' },
  { files: ['Cargo.toml'], language: 'rust' },
  { files: ['go.mod'], language: 'go' },
  { files: ['pom.xml', 'build.gradle'], language: 'java' },
  { files: ['Gemfile'], language: 'ruby' },
  { files: ['composer.json'], language: 'php' },
  { files: ['*.csproj', '*.sln'], language: 'csharp' },
];

/**
 * Framework detection patterns.
 */
interface FrameworkPattern {
  files?: string[];
  dependencies?: string[];
  framework: string;
}

const FRAMEWORK_PATTERNS: FrameworkPattern[] = [
  { files: ['next.config.js', 'next.config.mjs', 'next.config.ts'], framework: 'nextjs' },
  { dependencies: ['react'], framework: 'react' },
  { dependencies: ['vue'], framework: 'vue' },
  { dependencies: ['@angular/core'], framework: 'angular' },
  { dependencies: ['svelte'], framework: 'svelte' },
  { dependencies: ['express'], framework: 'express' },
  { dependencies: ['fastify'], framework: 'fastify' },
  { dependencies: ['nestjs', '@nestjs/core'], framework: 'nestjs' },
  { files: ['manage.py'], dependencies: ['django'], framework: 'django' },
  { dependencies: ['flask'], framework: 'flask' },
  { dependencies: ['fastapi'], framework: 'fastapi' },
];

/**
 * Detect project information from current directory.
 */
export async function detectProject(): Promise<ProjectInfo> {
  const name = await detectProjectName();
  const languages = await detectLanguages();
  const frameworks = await detectFrameworks();

  return {
    name: name.name,
    source: name.source,
    languages,
    frameworks,
  };
}

/**
 * Project manifest file configuration.
 */
interface ManifestConfig {
  file: string;
  source: ProjectInfo['source'];
  extract: (content: string) => string | null;
}

/**
 * Extract project name from package.json content.
 */
function extractFromPackageJson(content: string): string | null {
  const pkg = JSON.parse(content) as { name?: string };
  if (!pkg.name) return null;
  // Remove scope prefix if present (@org/name -> name)
  return pkg.name.startsWith('@') ? (pkg.name.split('/')[1] ?? pkg.name) : pkg.name;
}

/**
 * Extract project name from TOML content (pyproject.toml, Cargo.toml).
 */
function extractFromToml(content: string): string | null {
  const nameMatch = content.match(/^\s*name\s*=\s*"([^"]+)"/m);
  return nameMatch?.[1] ?? null;
}

/**
 * Extract project name from go.mod content.
 */
function extractFromGoMod(content: string): string | null {
  const moduleMatch = content.match(/^module\s+(\S+)/m);
  if (!moduleMatch?.[1]) return null;
  const parts = moduleMatch[1].split('/');
  return parts[parts.length - 1] ?? moduleMatch[1];
}

const MANIFEST_CONFIGS: ManifestConfig[] = [
  { file: 'package.json', source: 'package.json', extract: extractFromPackageJson },
  { file: 'pyproject.toml', source: 'pyproject.toml', extract: extractFromToml },
  { file: 'Cargo.toml', source: 'cargo.toml', extract: extractFromToml },
  { file: 'go.mod', source: 'go.mod', extract: extractFromGoMod },
];

/**
 * Try to extract project name from a manifest file.
 */
async function tryExtractFromManifest(
  config: ManifestConfig
): Promise<{ name: string; source: ProjectInfo['source'] } | null> {
  if (!existsSync(config.file)) return null;

  try {
    const content = await readFile(config.file, 'utf-8');
    const name = config.extract(content);
    if (name) {
      return { name, source: config.source };
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Detect project name from various sources.
 */
export async function detectProjectName(): Promise<{
  name: string;
  source: ProjectInfo['source'];
}> {
  for (const config of MANIFEST_CONFIGS) {
    const result = await tryExtractFromManifest(config);
    if (result) return result;
  }

  // Fallback to directory name
  return { name: basename(process.cwd()), source: 'directory' };
}

/**
 * Detect programming languages used in the project.
 */
export async function detectLanguages(): Promise<string[]> {
  const languages: Set<string> = new Set();

  for (const pattern of LANGUAGE_PATTERNS) {
    for (const file of pattern.files) {
      if (file.includes('*')) {
        // Skip glob patterns for now
        continue;
      }
      if (existsSync(file)) {
        languages.add(pattern.language);
        break;
      }
    }
  }

  // Check for TypeScript specifically (refine JS vs TS)
  if (languages.has('javascript') && existsSync('tsconfig.json')) {
    languages.delete('javascript');
    languages.add('typescript');
  }

  return Array.from(languages);
}

/**
 * Check if any file from the list exists.
 */
function anyFileExists(files: string[]): boolean {
  return files.some((file) => !file.includes('*') && existsSync(file));
}

/**
 * Check if any dependency matches in the dependencies object.
 */
function hasDependency(deps: Record<string, string>, patterns: string[]): boolean {
  return patterns.some((dep) => deps[dep] !== undefined);
}

/**
 * Check if any dependency name appears in TOML content.
 */
function hasDependencyInToml(content: string, patterns: string[]): boolean {
  return patterns.some((dep) => content.includes(`"${dep}"`) || content.includes(`'${dep}'`));
}

/**
 * Extract frameworks from file-based patterns.
 */
function detectFrameworksFromFiles(frameworks: Set<string>): void {
  for (const pattern of FRAMEWORK_PATTERNS) {
    if (pattern.files && anyFileExists(pattern.files)) {
      frameworks.add(pattern.framework);
    }
  }
}

/**
 * Extract frameworks from package.json dependencies.
 */
async function detectFrameworksFromPackageJson(frameworks: Set<string>): Promise<void> {
  if (!existsSync('package.json')) return;

  try {
    const content = await readFile('package.json', 'utf-8');
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    for (const pattern of FRAMEWORK_PATTERNS) {
      if (pattern.dependencies && hasDependency(allDeps, pattern.dependencies)) {
        frameworks.add(pattern.framework);
      }
    }
  } catch {
    // Ignore parse errors
  }
}

/**
 * Extract frameworks from pyproject.toml dependencies.
 */
async function detectFrameworksFromPyproject(frameworks: Set<string>): Promise<void> {
  if (!existsSync('pyproject.toml')) return;

  try {
    const content = await readFile('pyproject.toml', 'utf-8');

    for (const pattern of FRAMEWORK_PATTERNS) {
      if (pattern.dependencies && hasDependencyInToml(content, pattern.dependencies)) {
        frameworks.add(pattern.framework);
      }
    }
  } catch {
    // Ignore parse errors
  }
}

/**
 * Detect frameworks used in the project.
 */
export async function detectFrameworks(): Promise<string[]> {
  const frameworks: Set<string> = new Set();

  detectFrameworksFromFiles(frameworks);
  await detectFrameworksFromPackageJson(frameworks);
  await detectFrameworksFromPyproject(frameworks);

  return Array.from(frameworks);
}
