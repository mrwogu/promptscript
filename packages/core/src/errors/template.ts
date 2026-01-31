import type { SourceLocation } from '../types/source.js';
import { ErrorCode, PSError } from './base.js';

/**
 * Error thrown when a required template parameter is not provided.
 *
 * @example
 * ```
 * // Parent defines: projectName: string (required)
 * // Child uses: @inherit ./parent()  // Missing projectName
 * ```
 */
export class MissingParamError extends PSError {
  /** Name of the missing parameter */
  readonly paramName: string;
  /** Path of the template file */
  readonly templatePath: string;

  constructor(paramName: string, templatePath: string, options?: { location?: SourceLocation }) {
    super(
      `Missing required parameter '${paramName}' for template '${templatePath}'`,
      ErrorCode.MISSING_PARAM,
      options
    );
    this.name = 'MissingParamError';
    this.paramName = paramName;
    this.templatePath = templatePath;
  }
}

/**
 * Error thrown when an unknown parameter is provided to a template.
 *
 * @example
 * ```
 * // Parent defines: projectName: string
 * // Child uses: @inherit ./parent(projectName: "app", unknownParam: "foo")
 * ```
 */
export class UnknownParamError extends PSError {
  /** Name of the unknown parameter */
  readonly paramName: string;
  /** Path of the template file */
  readonly templatePath: string;
  /** Available parameter names */
  readonly availableParams: string[];

  constructor(
    paramName: string,
    templatePath: string,
    availableParams: string[],
    options?: { location?: SourceLocation }
  ) {
    const suggestion =
      availableParams.length > 0
        ? `. Available parameters: ${availableParams.join(', ')}`
        : '. This template has no parameters.';
    super(
      `Unknown parameter '${paramName}' for template '${templatePath}'${suggestion}`,
      ErrorCode.UNKNOWN_PARAM,
      options
    );
    this.name = 'UnknownParamError';
    this.paramName = paramName;
    this.templatePath = templatePath;
    this.availableParams = availableParams;
  }
}

/**
 * Error thrown when a parameter value doesn't match the expected type.
 *
 * @example
 * ```
 * // Parent defines: strict: boolean
 * // Child uses: @inherit ./parent(strict: "yes")  // Should be true/false
 * ```
 */
export class ParamTypeMismatchError extends PSError {
  /** Name of the parameter */
  readonly paramName: string;
  /** Expected type */
  readonly expectedType: string;
  /** Actual type */
  readonly actualType: string;

  constructor(
    paramName: string,
    expectedType: string,
    actualType: string,
    options?: { location?: SourceLocation }
  ) {
    super(
      `Type mismatch for parameter '${paramName}': expected ${expectedType}, got ${actualType}`,
      ErrorCode.PARAM_TYPE_MISMATCH,
      options
    );
    this.name = 'ParamTypeMismatchError';
    this.paramName = paramName;
    this.expectedType = expectedType;
    this.actualType = actualType;
  }
}

/**
 * Error thrown when a template variable is used but not defined.
 *
 * @example
 * ```
 * // Template has: {{projectName}}
 * // But projectName was not provided and has no default
 * ```
 */
export class UndefinedVariableError extends PSError {
  /** Name of the undefined variable */
  readonly variableName: string;
  /** File where the variable was used */
  readonly sourceFile: string;

  constructor(variableName: string, sourceFile: string, options?: { location?: SourceLocation }) {
    super(
      `Undefined template variable '{{${variableName}}}' in '${sourceFile}'`,
      ErrorCode.UNDEFINED_VARIABLE,
      options
    );
    this.name = 'UndefinedVariableError';
    this.variableName = variableName;
    this.sourceFile = sourceFile;
  }
}
