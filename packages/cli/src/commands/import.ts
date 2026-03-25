import { resolve, join, basename } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { stat, readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { importFile, validateRoundtrip } from '@promptscript/importer';
import type { DetectedFormat } from '@promptscript/importer';
import { createSpinner, ConsoleOutput } from '../output/console.js';

interface InstructionFrontmatter {
  applyTo: string[];
  body: string;
}

function parseInstructionFrontmatter(content: string): InstructionFrontmatter | undefined {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(content);
  if (!match) return undefined;

  const yaml = match[1]!;
  const body = match[2]!;

  const applyToMatch = /applyTo:\s*\n((?:\s+-\s+.*\n?)+)/m.exec(yaml);
  if (!applyToMatch) return undefined;

  const items = applyToMatch[1]!;
  const applyTo: string[] = [];
  for (const line of items.split('\n')) {
    const itemMatch = /^\s+-\s+"?([^"\n]+)"?\s*$/.exec(line);
    if (itemMatch) {
      applyTo.push(itemMatch[1]!.trim());
    }
  }

  if (applyTo.length === 0) return undefined;

  return { applyTo, body };
}

export async function importDirectory(dirPath: string): Promise<string> {
  const allFiles = await readdir(dirPath);
  const instructionFiles = allFiles.filter((f) => f.endsWith('.instructions.md')).sort();

  if (instructionFiles.length === 0) {
    throw new Error(`No .instructions.md files found in ${dirPath}`);
  }

  const lines: string[] = ['@meta {', '  version: "1.0"', '}', '', '@guards {'];

  for (const filename of instructionFiles) {
    const filePath = join(dirPath, filename);
    const content = await readFile(filePath, 'utf-8');
    const frontmatter = parseInstructionFrontmatter(content);
    const entryName = basename(filename).replace(/\.instructions\.md$/i, '');

    if (frontmatter) {
      const globPatterns = frontmatter.applyTo.map((p) => `"${p}"`).join(', ');
      lines.push(`  ${entryName}(${globPatterns}) {`);
      const bodyLines = frontmatter.body.trim().split('\n');
      for (const line of bodyLines) {
        lines.push(`    ${line}`);
      }
      lines.push(`  }`);
    } else {
      lines.push(`  ${entryName} {`);
      const bodyLines = content.trim().split('\n');
      for (const line of bodyLines) {
        lines.push(`    ${line}`);
      }
      lines.push(`  }`);
    }
  }

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

export interface ImportCommandOptions {
  format?: string;
  output?: string;
  dryRun?: boolean;
  validate?: boolean;
}

export async function importCommand(file: string, options: ImportCommandOptions): Promise<void> {
  const filepath = resolve(file);

  const inputStat = await stat(filepath).catch(() => null);
  if (inputStat?.isDirectory()) {
    const prsContent = await importDirectory(filepath);
    if (options.dryRun) {
      console.log(prsContent);
      return;
    }
    const outputDir = options.output ?? '.promptscript';
    await mkdir(outputDir, { recursive: true });
    const outputPath = join(outputDir, 'imported.prs');
    await writeFile(outputPath, prsContent);
    console.log(`✔ Imported directory to ${outputPath}`);
    return;
  }

  const spinner = createSpinner(`Importing ${file}...`).start();

  try {
    const result = await importFile(filepath, {
      format: options.format as DetectedFormat | undefined,
      dryRun: options.dryRun,
    });

    spinner.succeed(`Imported ${result.sections.length} sections`);

    // Show confidence summary
    const pct = Math.round(result.totalConfidence * 100);
    ConsoleOutput.info(`Overall confidence: ${pct}%`);

    // Show warnings
    for (const warning of result.warnings) {
      ConsoleOutput.warning(warning);
    }

    if (options.dryRun) {
      ConsoleOutput.newline();
      console.log(result.prsContent);
      return;
    }

    // Write output
    const outputDir = resolve(options.output ?? '.promptscript');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = resolve(outputDir, 'imported.prs');
    writeFileSync(outputPath, result.prsContent, 'utf-8');
    ConsoleOutput.success(`Written to ${outputPath}`);

    // Run roundtrip validation if requested
    if (options.validate) {
      const valSpinner = createSpinner('Validating roundtrip...').start();
      const valResult = await validateRoundtrip(filepath);

      if (valResult.valid) {
        valSpinner.succeed('Roundtrip validation passed');
      } else {
        valSpinner.fail('Roundtrip validation failed');
        for (const err of valResult.errors) {
          ConsoleOutput.error(err);
        }
      }
    }
  } catch (error) {
    spinner.fail('Import failed');
    ConsoleOutput.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
