import { posix } from 'node:path';
import { replacePathTokens, type PathTokenValues } from '@promptscript/core';
import type { FormatOptions, Formatter, FormatterOutput, FormatterWarning } from './types.js';

function trimSlashes(path: string): string {
  let result = path.replaceAll('\\', '/');
  while (result.startsWith('/')) result = result.slice(1);
  while (result.endsWith('/')) result = result.slice(0, -1);
  return result;
}

function collectFiles(output: FormatterOutput, files: FormatterOutput[]): void {
  files.push(output);
  for (const file of output.additionalFiles ?? []) collectFiles(file, files);
}

/** Directory of the skill a file belongs to: the deepest skill directory holding it. */
function findSkillDir(path: string, skillDirs: readonly string[]): string | undefined {
  let found: string | undefined;
  for (const dir of skillDirs) {
    if (path.startsWith(`${dir}/`) && (found === undefined || dir.length > found.length)) {
      found = dir;
    }
  }
  return found;
}

/**
 * Replace the `{{prs.dotDir}}`, `{{prs.skillsDir}}` and `{{prs.skillDir}}`
 * tokens in every file of a formatter output with the paths of that target.
 * `{{prs.skillDir}}` resolves only inside a skill directory. A token without
 * a value stays as written and gets a PS4002 warning.
 */
export function resolveOutputPathTokens(
  output: FormatterOutput,
  formatter: Formatter,
  options?: FormatOptions
): FormatterOutput {
  const files: FormatterOutput[] = [];
  collectFiles(output, files);
  if (!files.some((file) => file.content.includes('{{prs.'))) return output;

  // Plain object formatters from plugins do not always have these methods.
  const methods: Partial<Formatter> = formatter;
  const dotDir = methods.getDotDir?.() ?? undefined;
  const configuredSkillsDir = options?.targetConfig?.skillBaseDir;
  const skillsDir = configuredSkillsDir
    ? trimSlashes(configuredSkillsDir)
    : (methods.getSkillBasePath?.() ?? undefined);
  const skillFileName = methods.getSkillFileName?.();

  const skillDirs = skillFileName
    ? files
        .filter((file) => posix.basename(file.path) === skillFileName)
        .map((file) => posix.dirname(file.path))
    : [];

  const warnings: FormatterWarning[] = [];
  const resolveFile = (file: FormatterOutput): FormatterOutput => {
    const additionalFiles = file.additionalFiles?.map(resolveFile);
    const values: PathTokenValues = {
      dotDir,
      skillsDir,
      skillDir: findSkillDir(file.path, skillDirs),
    };
    const { text, unresolved } = replacePathTokens(file.content, values);
    for (const name of unresolved) {
      warnings.push({
        code: 'PS4002',
        ruleName: 'path-token',
        message: `{{prs.${name}}} in "${file.path}" has no value for target "${formatter.name}" and is written as is.`,
        suggestion:
          name === 'skillDir'
            ? 'Use {{prs.skillDir}} only in skill text, or use {{prs.skillsDir}}.'
            : `Target "${formatter.name}" has no such directory. Remove the token for this target.`,
      });
    }
    const resolved: FormatterOutput = { ...file, content: text };
    if (additionalFiles) resolved.additionalFiles = additionalFiles;
    return resolved;
  };

  const resolved = resolveFile(output);
  if (warnings.length === 0) return resolved;
  return { ...resolved, warnings: [...(resolved.warnings ?? []), ...warnings] };
}
