import { basename } from 'path';
import { importFile } from './importer.js';
import { mergeSections, type SourcedSection } from './merger.js';
import { emitModularFiles, type ModularEmitOptions } from './emitter.js';

export type MultiImportOptions = ModularEmitOptions;

export interface FileReport {
  file: string;
  sectionCount: number;
  confidence: number;
}

export interface MultiImportResult {
  files: Map<string, string>;
  perFileReports: FileReport[];
  deduplicatedCount: number;
  overallConfidence: number;
  warnings: string[];
}

export async function importMultipleFiles(
  filePaths: string[],
  options: MultiImportOptions
): Promise<MultiImportResult> {
  const allSections: SourcedSection[] = [];
  const perFileReports: FileReport[] = [];
  const warnings: string[] = [];

  for (const filePath of filePaths) {
    try {
      const result = await importFile(filePath);
      const source = basename(filePath);
      for (const section of result.sections) {
        allSections.push({ ...section, source });
      }
      perFileReports.push({
        file: filePath,
        sectionCount: result.sections.length,
        confidence: result.totalConfidence,
      });
      warnings.push(...result.warnings);
    } catch (error) {
      warnings.push(
        `Could not import ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  if (allSections.length === 0) {
    return {
      files: new Map([['project.prs', emitEmptyProject(options)]]),
      perFileReports,
      deduplicatedCount: 0,
      overallConfidence: 0,
      warnings,
    };
  }

  const mergeResult = mergeSections(allSections);
  const files = emitModularFiles(mergeResult.merged, options);

  return {
    files,
    perFileReports,
    deduplicatedCount: mergeResult.deduplicatedCount,
    overallConfidence: mergeResult.overallConfidence,
    warnings,
  };
}

function emitEmptyProject(options: MultiImportOptions): string {
  return `@meta {\n  id: "${options.projectName}"\n  syntax: "${options.syntaxVersion ?? '1.0.0'}"\n}\n\n@identity {\n  """\n  [No content could be imported. Edit this file manually.]\n  """\n}\n`;
}
