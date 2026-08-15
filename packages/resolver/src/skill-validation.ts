import { basename, dirname, join } from 'path';
import { existsSync } from 'fs';
import { parseSkillMd, type ParsedSkillMd } from './skills.js';

/**
 * Severity of a skill validation issue.
 * - `error`: violates the Agent Skills specification — must be fixed
 * - `warning`: legal per spec, but breaks quality/security/reproducibility recommendations
 */
export type SkillValidationSeverity = 'error' | 'warning';

/**
 * A single validation finding for a SKILL.md file.
 */
export interface SkillValidationIssue {
  severity: SkillValidationSeverity;
  /** Stable identifier (e.g. `SK001`) for documentation and suppression */
  code: string;
  message: string;
  /** Frontmatter field the issue relates to (when applicable) */
  field?: string;
}

/**
 * Aggregate result of validating a SKILL.md file.
 */
export interface SkillValidationResult {
  valid: boolean;
  issues: SkillValidationIssue[];
}

/**
 * Options for `validateSkillFrontmatter`.
 */
export interface SkillValidationOptions {
  /**
   * Absolute path to the SKILL.md file being validated. When provided,
   * enables checks that depend on the surrounding directory (name ↔ folder
   * match, references existence, body size).
   */
  filePath?: string;
  /**
   * Names already registered in the current project. Used to detect
   * collisions (two skills resolving to the same output folder).
   */
  existingNames?: ReadonlySet<string>;
}

/**
 * Validate a SKILL.md frontmatter and body against the Agent Skills
 * specification (see https://agentskills.io/specification) and PromptScript's
 * additional quality recommendations.
 *
 * Errors mirror what `skills-ref validate` rejects (name format, description
 * presence, directory match, …). Warnings cover quality smells the spec
 * recommends but does not strictly enforce (short description, oversized
 * body, missing license, unpinned version, …).
 */
export function validateSkillFrontmatter(
  rawContent: string,
  options: SkillValidationOptions = {}
): SkillValidationResult {
  const issues: SkillValidationIssue[] = [];

  // Hard requirement: a frontmatter block must exist.
  if (!hasFrontmatterDelimiters(rawContent)) {
    issues.push({
      severity: 'error',
      code: 'SK001',
      message: 'SKILL.md must start with a YAML frontmatter block delimited by `---` lines.',
    });
    return { valid: false, issues };
  }

  let parsed: ParsedSkillMd;
  try {
    parsed = parseSkillMd(rawContent, options.filePath);
  } catch (error: unknown) {
    issues.push({
      severity: 'error',
      code: 'SK000',
      message: error instanceof Error ? error.message : String(error),
    });
    return { valid: false, issues };
  }

  validateName(parsed, options, issues);
  validateDescription(parsed, issues);
  validateCompatibility(parsed.compatibility, issues);
  validateLicense(parsed.license, issues);
  validateBody(parsed.content, issues);
  validateReferences(parsed.references, options.filePath, issues);
  validateAllowedTools(parsed.allowedTools, issues);

  const hasErrors = issues.some((i) => i.severity === 'error');
  return { valid: !hasErrors, issues };
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME_LEN = 64;
const MIN_DESC_LEN = 1;
const MAX_DESC_LEN = 1024;
const MAX_COMPATIBILITY_LEN = 500;
const SHORT_DESC_WARN_LEN = 40;
const MAX_BODY_LINES = 500;

function validateName(
  parsed: ParsedSkillMd,
  options: SkillValidationOptions,
  issues: SkillValidationIssue[]
): void {
  const name = parsed.name;

  if (!name || name.length === 0) {
    issues.push({
      severity: 'error',
      code: 'SK002',
      field: 'name',
      message: '`name` is required in SKILL.md frontmatter.',
    });
    return;
  }

  if (name.length > MAX_NAME_LEN) {
    issues.push({
      severity: 'error',
      code: 'SK003',
      field: 'name',
      message: `\`name\` must be at most ${MAX_NAME_LEN} characters (got ${name.length}).`,
    });
  }

  if (!NAME_PATTERN.test(name)) {
    issues.push({
      severity: 'error',
      code: 'SK004',
      field: 'name',
      message: `\`name\` "${name}" is invalid. Use lowercase letters, digits, and single hyphens only. Cannot start or end with a hyphen or contain consecutive hyphens.`,
    });
  }

  // Spec: name MUST match the parent directory name (when we know the path).
  if (options.filePath) {
    const parentDir = basename(dirname(options.filePath));
    if (parentDir && parentDir !== name) {
      issues.push({
        severity: 'error',
        code: 'SK005',
        field: 'name',
        message: `\`name\` "${name}" must match the parent directory name "${parentDir}".`,
      });
    }
  }

  if (options.existingNames?.has(name)) {
    issues.push({
      severity: 'error',
      code: 'SK006',
      field: 'name',
      message: `Skill name "${name}" collides with an already-installed skill. Two skills cannot share the same name (they would be written to the same output folder).`,
    });
  }
}

function validateDescription(parsed: ParsedSkillMd, issues: SkillValidationIssue[]): void {
  const description = parsed.description;

  if (!description || description.trim().length < MIN_DESC_LEN) {
    issues.push({
      severity: 'error',
      code: 'SK010',
      field: 'description',
      message: '`description` is required and must be non-empty.',
    });
    return;
  }

  if (description.length > MAX_DESC_LEN) {
    issues.push({
      severity: 'error',
      code: 'SK011',
      field: 'description',
      message: `\`description\` must be at most ${MAX_DESC_LEN} characters (got ${description.length}).`,
    });
  }

  if (description.length < SHORT_DESC_WARN_LEN) {
    issues.push({
      severity: 'warning',
      code: 'SK012',
      field: 'description',
      message: `\`description\` is very short (${description.length} chars). The spec recommends describing both what the skill does AND when to use it so agents can match it to tasks.`,
    });
  } else if (!/\bwhen\b|\buse\b/i.test(description)) {
    issues.push({
      severity: 'warning',
      code: 'SK013',
      field: 'description',
      message:
        '`description` should mention WHEN to use the skill (e.g. "Use when …"). This improves agent trigger accuracy.',
    });
  }
}

function validateCompatibility(
  compatibility: string | undefined,
  issues: SkillValidationIssue[]
): void {
  if (compatibility === undefined) return;
  if (compatibility.length > MAX_COMPATIBILITY_LEN) {
    issues.push({
      severity: 'error',
      code: 'SK020',
      field: 'compatibility',
      message: `\`compatibility\` must be at most ${MAX_COMPATIBILITY_LEN} characters (got ${compatibility.length}).`,
    });
  }
}

function validateLicense(license: string | undefined, issues: SkillValidationIssue[]): void {
  if (license === undefined || license.length === 0) {
    issues.push({
      severity: 'warning',
      code: 'SK030',
      field: 'license',
      message:
        '`license` is missing. Enterprises typically require an explicit license declaration before adopting a third-party skill.',
    });
    return;
  }
}

function validateBody(body: string, issues: SkillValidationIssue[]): void {
  const lines = body.split('\n').length;
  if (lines > MAX_BODY_LINES) {
    issues.push({
      severity: 'warning',
      code: 'SK040',
      message: `SKILL.md body has ${lines} lines (>${MAX_BODY_LINES}). The spec recommends splitting long content into separate files under references/ for progressive disclosure.`,
    });
  }
}

function validateReferences(
  references: string[] | undefined,
  filePath: string | undefined,
  issues: SkillValidationIssue[]
): void {
  if (!references || references.length === 0) return;
  if (!filePath) return;
  const skillDir = dirname(filePath);
  for (const ref of references) {
    // Reject paths that escape the skill directory.
    if (isUnsafeReferencePath(ref)) {
      issues.push({
        severity: 'error',
        code: 'SK050',
        field: 'references',
        message: `Reference "${ref}" must be a relative path inside the skill directory (no leading "/" or "..").`,
      });
      continue;
    }
    const target = join(skillDir, ref.replace(/\\/g, '/'));
    if (!existsSync(target)) {
      issues.push({
        severity: 'error',
        code: 'SK051',
        field: 'references',
        message: `Reference "${ref}" listed in frontmatter does not exist (looked for ${target}).`,
      });
    }
  }
}

function isUnsafeReferencePath(ref: string): boolean {
  const portable = ref.replace(/\\/g, '/');
  return (
    portable.length === 0 ||
    portable.includes('\0') ||
    portable.startsWith('/') ||
    /^[A-Za-z]:/.test(portable) ||
    portable.split('/').some((segment) => segment === '..')
  );
}

function validateAllowedTools(
  allowedTools: string[] | undefined,
  issues: SkillValidationIssue[]
): void {
  if (allowedTools === undefined) return;
  // The field is space-separated tool entries. Each entry should look like
  // `Tool` or `Tool(scope:pattern)`. We only warn — the spec marks the field
  // experimental and individual agents may extend the grammar.
  for (const token of allowedTools) {
    if (!/^[A-Za-z][A-Za-z0-9_-]*(\([^)]*\))?$/.test(token)) {
      issues.push({
        severity: 'warning',
        code: 'SK060',
        field: 'allowed-tools',
        message: `\`allowed-tools\` entry "${token}" does not match the expected \`Tool\` or \`Tool(scope:pattern)\` shape.`,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasFrontmatterDelimiters(content: string): boolean {
  const lines = content.split('\n');
  const firstLine = (lines[0] ?? '').replace(/^\uFEFF/, '').replace(/\r$/, '');
  if (firstLine !== '---') return false;
  for (let i = 1; i < lines.length; i++) {
    if ((lines[i] ?? '').replace(/\r$/, '') === '---') return true;
  }
  return false;
}

/**
 * Format validation issues as a multi-line string suitable for CLI output.
 * Each line is prefixed with the severity and code.
 */
export function formatSkillValidationIssues(issues: readonly SkillValidationIssue[]): string {
  return issues
    .map((i) => {
      const tag = i.severity === 'error' ? '✗' : '⚠';
      const field = i.field ? ` [${i.field}]` : '';
      return `  ${tag} ${i.code}${field}: ${i.message}`;
    })
    .join('\n');
}
