import { parse } from '@promptscript/parser';
import { importFile } from './importer.js';

export interface RoundtripResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sectionCount: { imported: number; parsed: number };
  hasMeta: boolean;
}

export async function validateRoundtrip(filepath: string): Promise<RoundtripResult> {
  const importResult = await importFile(filepath);

  const parseResult = parse(importResult.prsContent, {
    filename: '<roundtrip>',
    tolerant: true,
  });

  const errors: string[] = [];
  const warnings: string[] = [...importResult.warnings];

  if (parseResult.errors.length > 0) {
    for (const err of parseResult.errors) {
      errors.push(err.message);
    }
  }

  const ast = parseResult.ast;
  const hasMeta = ast?.meta != null;
  const parsedBlockCount = ast?.blocks.length ?? 0;

  if (!hasMeta) {
    errors.push('Generated PRS is missing @meta block');
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    sectionCount: {
      imported: importResult.sections.length,
      parsed: parsedBlockCount,
    },
    hasMeta,
  };
}
