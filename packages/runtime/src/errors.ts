/** Codes of errors thrown while rendering. */
export type PromptRenderErrorCode = 'missing-input' | 'invalid-type' | 'invalid-option';

/** Codes of errors thrown while loading. */
export type PromptLoadErrorCode =
  | 'unsupported-schema'
  | 'invalid-bundle'
  | 'hash-mismatch'
  | 'index-mismatch'
  | 'invalid-index'
  | 'unsupported-label'
  | 'not-found'
  | 'source-error'
  | 'timeout'
  | 'too-large'
  | 'redirect-refused'
  | 'url-refused';

/** Codes of errors thrown while mapping to a provider request. */
export type PromptMapErrorCode = 'provider-mismatch' | 'missing-model' | 'missing-max-tokens';

/** Code of the error thrown for a bad assignment key. */
export type PromptKeyErrorCode = 'invalid-key';

/** Codes of errors the telemetry entry throws or reports. */
export type PromptTelemetryErrorCode = 'invalid-feedback' | 'invalid-pricing' | 'telemetry-failed';

/** Every runtime error code. */
export type PromptErrorCode =
  | PromptRenderErrorCode
  | PromptLoadErrorCode
  | PromptMapErrorCode
  | PromptKeyErrorCode
  | PromptTelemetryErrorCode;

/** Base of every error the runtime throws. Messages name keys and paths, never values. */
export class PromptRuntimeError extends Error {
  readonly code: PromptErrorCode;

  constructor(code: PromptErrorCode, message: string) {
    super(message);
    this.name = 'PromptRuntimeError';
    this.code = code;
  }
}

/** A bundle, index or label could not be loaded or verified. */
export class PromptLoadError extends PromptRuntimeError {
  declare readonly code: PromptLoadErrorCode;
  /** Path of the file relative to the source, when one is known */
  readonly path?: string;

  constructor(code: PromptLoadErrorCode, message: string, path?: string) {
    super(code, message);
    this.name = 'PromptLoadError';
    this.path = path;
  }
}

/** The caller inputs do not satisfy the declared inputs. */
export class PromptRenderError extends PromptRuntimeError {
  declare readonly code: PromptRenderErrorCode;
  /** Names of the inputs at fault */
  readonly names: readonly string[];

  constructor(code: PromptRenderErrorCode, message: string, names: readonly string[]) {
    super(code, message);
    this.name = 'PromptRenderError';
    this.names = names;
  }
}
