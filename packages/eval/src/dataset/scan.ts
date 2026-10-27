import type {
  EvalDatasetAllow,
  EvalDatasetAllowPii,
  EvalFindingSeverity,
  EvalFindingV1,
  Program,
  SourceLocation,
} from '@promptscript/core';
import {
  authorityInjection,
  blockedPatterns,
  obfuscatedContent,
  suspiciousUrls,
  unicodeSecurity,
  type ValidationRule,
  type ValidatorConfig,
} from '@promptscript/validator';
import { EVAL_CODES } from '../errors.js';
import { detectPii } from './pii.js';
import type { DatasetRecord } from './read.js';

/** Validator rules the dataset scan runs on every string value. */
export const SCAN_RULES: readonly ValidationRule[] = [
  blockedPatterns,
  suspiciousUrls,
  authorityInjection,
  obfuscatedContent,
  unicodeSecurity,
];

/** Options of {@link scanDatasetRow}. */
export interface ScanOptions {
  /** Dataset path relative to the project root */
  file: string;
  /** `validation.allowedPatterns` of the project, the only validation setting the scan honors */
  allowedPatterns?: readonly string[];
  /** Rules whose findings the suite expects, from `dataset.allow` */
  allow?: readonly EvalDatasetAllow[];
  /** The suite's decision that the dataset may hold personal data */
  allowPii?: EvalDatasetAllowPii;
}

interface Leaf {
  path: string;
  text: string;
}

function stringLeaves(row: DatasetRecord['row']): Leaf[] {
  const leaves: Leaf[] = [];
  for (const [key, value] of Object.entries(row.inputs)) {
    if (typeof value === 'string') leaves.push({ path: `inputs.${key}`, text: value });
  }
  if (typeof row.expected === 'string') {
    leaves.push({ path: 'expected', text: row.expected });
    return leaves;
  }
  for (const [key, value] of Object.entries(row.expected ?? {})) {
    if (typeof value === 'string') leaves.push({ path: `expected.${key}`, text: value });
    if (Array.isArray(value)) {
      value.forEach((text, index) => leaves.push({ path: `expected.${key}[${index}]`, text }));
    }
  }
  return leaves;
}

// One program per value, so every report maps back to one row and path.
function leafProgram(leaf: Leaf, loc: SourceLocation): Program {
  return {
    type: 'Program',
    loc,
    uses: [],
    blocks: [
      {
        type: 'Block',
        name: leaf.path,
        loc,
        content: { type: 'TextContent', value: leaf.text, loc },
      },
    ],
    extends: [],
  };
}

function ruleSeverity(
  rule: ValidationRule,
  ast: Program,
  config: ValidatorConfig
): EvalFindingSeverity | undefined {
  let severity: EvalFindingSeverity | undefined;
  rule.validate({
    ast,
    config,
    report: (message) => {
      severity =
        (message.severity ?? rule.defaultSeverity) === 'error' ? 'error' : (severity ?? 'warning');
    },
  });
  return severity;
}

function ruleFinding(
  rule: ValidationRule,
  severity: EvalFindingSeverity,
  where: Pick<EvalFindingV1, 'rowId' | 'path' | 'line'>,
  allow: ScanOptions['allow']
): EvalFindingV1 {
  const allowed = allow?.find((entry) => entry.rule === rule.id);
  return {
    code: severity === 'error' ? EVAL_CODES.SCAN_ERROR : EVAL_CODES.SCAN_WARNING,
    rule: rule.id,
    ruleName: rule.name,
    severity: allowed === undefined ? severity : 'warning',
    ...where,
    ...(allowed === undefined ? {} : { allowedBecause: allowed.reason }),
  };
}

/**
 * Scan the string values of one row (`inputs` and `expected`) with the
 * validator's security rules (PS005, PS010, PS011, PS012, PS014) and the PII
 * detectors. A finding names the rule, row id, path and line, never the rule
 * message, which can quote the value. Rules listed in `allow` are downgraded
 * to warnings, and they and PII under `allowPii` carry the suite's reason.
 *
 * @param record - Row read by `readDataset`
 * @param options - Dataset path, allowed patterns and the suite's review decisions
 * @returns Findings in value order, rules before PII
 */
export function scanDatasetRow(record: DatasetRecord, options: ScanOptions): EvalFindingV1[] {
  const config: ValidatorConfig = {
    scanExternalContent: true,
    allowedPatterns: [...(options.allowedPatterns ?? [])],
  };
  const pii = options.allowPii === undefined ? {} : { allowedBecause: options.allowPii.reason };
  const findings: EvalFindingV1[] = [];
  for (const [index, leaf] of stringLeaves(record.row).entries()) {
    const where = { rowId: record.row.id, path: leaf.path, line: record.line };
    const ast = leafProgram(leaf, { file: options.file, line: record.line, column: index + 1 });
    for (const rule of SCAN_RULES) {
      const severity = ruleSeverity(rule, ast, config);
      if (severity !== undefined) findings.push(ruleFinding(rule, severity, where, options.allow));
    }
    for (const code of detectPii(leaf.text)) {
      findings.push({ code, severity: 'warning', ...where, ...pii });
    }
  }
  return findings;
}
