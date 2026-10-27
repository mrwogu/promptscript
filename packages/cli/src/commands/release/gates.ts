import type { ReleaseDiagnostic } from '../../utils/release-report.js';

/** What promote and rollback are about to write, for a gate to judge. */
export interface PromotionGateContext {
  command: 'promote' | 'rollback';
  projectRoot: string;
  environment: string;
  /** Entries the label will hold after the command, with the hash it held before */
  prompts: Array<{ id: string; contentHash: string; previousContentHash?: string }>;
}

export interface PromotionGateResult {
  passed: boolean;
  /** A finding fails the command and is reported as an error */
  findings: ReleaseDiagnostic[];
}

/**
 * Gates that a promotion or rollback must pass before the label is written.
 *
 * Runs inside the release lock. No gate exists yet; approval and policy gates are tracked
 * in https://github.com/mrwogu/promptscript/issues/587. Branch protection and required
 * reviews on the release directory protect labels until then.
 */
export function checkPromotionGates(_context: PromotionGateContext): PromotionGateResult {
  return { passed: true, findings: [] };
}
