import { basename } from 'path';
import { type CliServices, createDefaultServices } from '../services.js';

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
export async function detectProject(
  services: CliServices = createDefaultServices()
): Promise<ProjectInfo> {
  const name = await detectProjectName(services);
  const languages = await detectLanguages(services);
  const frameworks = await detectFrameworks(services);

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
  const nameMatch = /^\s*name\s*=\s*"([^"]+)"/m.exec(content);
  return nameMatch?.[1] ?? null;
}

/**
 * Extract project name from go.mod content.
 */
function extractFromGoMod(content: string): string | null {
  const moduleMatch = /^module\s+(\S+)/m.exec(content);
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
  config: ManifestConfig,
  services: CliServices
): Promise<{ name: string; source: ProjectInfo['source'] } | null> {
  if (!services.fs.existsSync(config.file)) return null;

  try {
    const content = await services.fs.readFile(config.file, 'utf-8');
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
export async function detectProjectName(services: CliServices): Promise<{
  name: string;
  source: ProjectInfo['source'];
}> {
  for (const config of MANIFEST_CONFIGS) {
    const result = await tryExtractFromManifest(config, services);
    if (result) return result;
  }

  // Fallback to directory name
  return { name: basename(services.cwd), source: 'directory' };
}

/**
 * Detect programming languages used in the project.
 */
export async function detectLanguages(services: CliServices): Promise<string[]> {
  const languages: Set<string> = new Set();

  for (const pattern of LANGUAGE_PATTERNS) {
    for (const file of pattern.files) {
      if (file.includes('*')) {
        // Skip glob patterns for now
        continue;
      }
      if (services.fs.existsSync(file)) {
        languages.add(pattern.language);
        break;
      }
    }
  }

  // Check for TypeScript specifically (refine JS vs TS)
  if (languages.has('javascript') && services.fs.existsSync('tsconfig.json')) {
    languages.delete('javascript');
    languages.add('typescript');
  }

  return Array.from(languages);
}

/**
 * Check if any file from the list exists.
 */
function anyFileExists(files: string[], services: CliServices): boolean {
  return files.some((file) => !file.includes('*') && services.fs.existsSync(file));
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
 * Extract frameworks from files.
 */
function detectFrameworksFromFiles(frameworks: Set<string>, services: CliServices): void {
  for (const pattern of FRAMEWORK_PATTERNS) {
    if (pattern.files && anyFileExists(pattern.files, services)) {
      frameworks.add(pattern.framework);
    }
  }
}

/**
 * Extract frameworks from package.json dependencies.
 */
async function detectFrameworksFromPackageJson(
  frameworks: Set<string>,
  services: CliServices
): Promise<void> {
  if (!services.fs.existsSync('package.json')) return;

  try {
    const content = await services.fs.readFile('package.json', 'utf-8');
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
async function detectFrameworksFromPyproject(
  frameworks: Set<string>,
  services: CliServices
): Promise<void> {
  if (!services.fs.existsSync('pyproject.toml')) return;

  try {
    const content = await services.fs.readFile('pyproject.toml', 'utf-8');

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
export async function detectFrameworks(services: CliServices): Promise<string[]> {
  const frameworks: Set<string> = new Set();

  detectFrameworksFromFiles(frameworks, services);
  await detectFrameworksFromPackageJson(frameworks, services);
  await detectFrameworksFromPyproject(frameworks, services);

  return Array.from(frameworks);
}
