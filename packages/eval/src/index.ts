/**
 * Eval suites, datasets and assertions for PromptScript prompts.
 *
 * Loads suite files from `.promptscript/evals/`, reads and checks their
 * datasets, scans dataset values with the validator's security rules and PII
 * detectors, and checks responses with deterministic assertions and with
 * `llm-judge` assertions that a rubric prompt scores, optionally against human labels.
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
export { detectPii, scrubPii, type ScrubCounts } from './dataset/pii.js';
export {
  importSamples,
  type ImportContract,
  type ImportResult,
  type ImportRow,
  type ImportSamplesOptions,
} from './import/import.js';
export { FEEDBACK_LABEL_PATTERN, parseSample } from './import/sample.js';
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
export { readLabels, unmatchedLabels, type LabelContext, type ReadLabels } from './labels.js';
export { readVerdict, type JudgeVerdict } from './judge.js';
export {
  planEval,
  runEval,
  runEvalDetailed,
  type EvalPlan,
  type EvalPlanModel,
  type EvalPlanSuite,
  type EvalProgress,
  type EvalRun,
  type PriceSource,
  type RunEvalOptions,
} from './run.js';
export {
  compareReports,
  missingFromCandidate,
  readReport,
  type CompareOptions,
} from './compare.js';
export {
  formatComparison,
  formatPlan,
  formatReport,
  reportFileName,
  type EvalComparisonFormat,
  type EvalReportFormat,
  type FormatOptions,
} from './format.js';
export { cleanText, cleanValue } from './sanitize.js';
export {
  createAnthropicProvider,
  createOpenAICompatibleProvider,
  refuseProviderUrl,
  DEFAULT_PROVIDER_HOSTS,
  type ProviderConfig,
  type ProviderDeps,
} from './http-provider.js';
export {
  createProviderFactory,
  type ProviderFactoryOptions,
  type ProviderUse,
} from './provider-setup.js';
export {
  createMockProvider,
  type EvalProvider,
  type EvalProviderContext,
  type EvalProviderLookup,
  type EvalRequest,
  type EvalResponse,
  type MockAnswer,
  type MockCall,
  type MockProvider,
  type MockScript,
} from './provider.js';
