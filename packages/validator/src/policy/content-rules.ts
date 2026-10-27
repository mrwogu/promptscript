import type {
  ContentRulesPolicy,
  PolicySubject,
  Program,
  SourceLocation,
} from '@promptscript/core';
import { authorityInjection } from '../rules/authority-injection.js';
import { blockedPatterns } from '../rules/blocked-patterns.js';
import { obfuscatedContent } from '../rules/obfuscated-content.js';
import { suspiciousUrls } from '../rules/suspicious-urls.js';
import { unicodeSecurity } from '../rules/unicode-security.js';
import type { ValidationRule } from '../types.js';
import type { PolicyContext } from './types.js';

/** Rules a content-rules policy can run, named by rule name or id. */
export const CONTENT_CHECK_RULES: readonly ValidationRule[] = [
  blockedPatterns,
  suspiciousUrls,
  authorityInjection,
  obfuscatedContent,
  unicodeSecurity,
];

/** One problem a policy found on a prompt. */
export interface PolicyFinding {
  message: string;
  suggestion?: string;
}

/**
 * Normalize text for `deny` matching: NFKC, default-ignorable code points
 * removed, whitespace collapsed, lowercase. It catches plain variants of a
 * phrase, not a determined author.
 */
export function normalizeDenyText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/\p{Default_Ignorable_Code_Point}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function textProgram(content: string, loc: SourceLocation): Program {
  return {
    type: 'Program',
    loc,
    uses: [],
    blocks: [
      { type: 'Block', name: 'prompt', loc, content: { type: 'TextContent', value: content, loc } },
    ],
    extends: [],
  };
}

/**
 * Run the checks and denied phrases of a content-rules policy on the texts of
 * one prompt. Each rule runs on a program that holds one text, with a capturing
 * report, so `disableRules`, rule severities and import excludes do not apply.
 * `allowedPatterns` and the policy's `allow` still remove blocked patterns.
 */
export function runContentRules(
  policy: ContentRulesPolicy,
  subject: PolicySubject,
  context: PolicyContext
): PolicyFinding[] {
  const checks = policy.checks ?? [];
  const rules = CONTENT_CHECK_RULES.filter((rule) =>
    checks.some((check) => check === rule.name || check === rule.id)
  );
  const config = {
    blockedPatterns: context.blockedPatterns,
    allowedPatterns: [...(context.allowedPatterns ?? []), ...(policy.allow ?? [])],
  };
  const denied = (policy.deny ?? []).map((phrase) => ({ phrase, text: normalizeDenyText(phrase) }));
  const loc = subject.loc ?? { file: subject.id, line: 1, column: 1 };
  const findings: PolicyFinding[] = [];

  for (const { role, content } of subject.texts) {
    const ast = textProgram(content, loc);
    for (const rule of rules) {
      rule.validate({
        ast,
        config,
        report: (msg) =>
          findings.push({
            message: `Prompt "${subject.id}": ${rule.name}: ${msg.message} in the ${role} message`,
            suggestion: msg.suggestion,
          }),
      });
    }
    const normalized = normalizeDenyText(content);
    for (const { phrase, text } of denied) {
      if (normalized.includes(text)) {
        findings.push({
          message: `Prompt "${subject.id}" contains the denied phrase "${phrase}" in the ${role} message`,
          suggestion: 'Rephrase the message. The policy denies this phrase for the prompt.',
        });
      }
    }
  }
  return findings;
}
