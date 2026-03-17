import { resolve } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { importFile, validateRoundtrip } from '@promptscript/importer';
import type { DetectedFormat } from '@promptscript/importer';
import { createSpinner, ConsoleOutput } from '../output/console.js';

export interface ImportCommandOptions {
  format?: string;
  output?: string;
  dryRun?: boolean;
  validate?: boolean;
}

export async function importCommand(file: string, options: ImportCommandOptions): Promise<void> {
  const filepath = resolve(file);
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
