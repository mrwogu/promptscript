/**
 * Eval suites, datasets and assertions for PromptScript prompts.
 *
 * Loads suite files from `.promptscript/evals/`, reads and checks their
 * datasets, scans dataset values with the validator's security rules and PII
 * detectors, and checks responses with deterministic assertions.
 *
 * @packageDocumentation
 */

export {
  EVAL_CODES,
  EvalError,
  EvalDatasetError,
  EvalProviderError,
  type EvalCode,
  type EvalFinding,
} from './errors.js';
export { resolveProjectPath } from './paths.js';
export { readDataset, type DatasetRecord, type ReadDatasetOptions } from './dataset/read.js';
export { checkDatasetRow, type DatasetCheckContext } from './dataset/check.js';
export { scanDatasetRow, type ScanOptions } from './dataset/scan.js';
export {
  loadSuites,
  type LoadedSuite,
  type LoadSuitesOptions,
  type LoadSuitesResult,
} from './suite/load.js';
export { checkSuites, type CheckContext } from './suite/check.js';
export {
  evaluateAssertions,
  type AssertionContext,
  type DeterministicAssertion,
} from './assertions.js';
export {
  createMockProvider,
  type EvalProvider,
  type EvalProviderContext,
  type EvalRequest,
  type EvalResponse,
  type MockAnswer,
  type MockCall,
  type MockProvider,
  type MockScript,
} from './provider.js';
