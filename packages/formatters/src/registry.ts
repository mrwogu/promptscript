import type { Formatter, FormatterClass, FormatterFactory } from './types.js';

/**
 * Registry for formatter implementations.
 * Allows dynamic registration and discovery of formatters.
 *
 * Formatters can be registered via class constructor (preferred) or factory function.
 * When registered via class constructor, the static `getSupportedVersions()` method
 * is enforced at both compile time (via the `FormatterClass` type) and runtime.
 */
export class FormatterRegistry {
  private static factories = new Map<string, FormatterFactory>();

  /**
   * Register a formatter class.
   *
   * Enforces that the class implements a static `getSupportedVersions()` method
   * at compile time via the `FormatterClass` type and at runtime via validation.
   *
   * @param name - Unique formatter identifier
   * @param FormatterCtor - Formatter class with static getSupportedVersions()
   * @throws Error if the formatter is already registered
   * @throws Error if the class lacks a static getSupportedVersions() method
   */
  static register(name: string, FormatterCtor: FormatterClass): void;

  /**
   * Register a formatter factory function.
   *
   * @param name - Unique formatter identifier
   * @param factory - Factory function that creates formatter instances
   * @throws Error if the formatter is already registered
   * @deprecated Use the class-based overload to enforce getSupportedVersions()
   */
  static register(name: string, factory: FormatterFactory): void;

  static register(name: string, ctorOrFactory: FormatterClass | FormatterFactory): void {
    if (this.factories.has(name)) {
      throw new Error(`Formatter '${name}' is already registered`);
    }

    if (isFormatterClass(ctorOrFactory)) {
      // Runtime validation: ensure getSupportedVersions exists and returns a valid map
      validateFormatterClass(name, ctorOrFactory);
      this.factories.set(name, () => new ctorOrFactory());
    } else {
      this.factories.set(name, ctorOrFactory);
    }
  }

  /**
   * Get a formatter instance by name.
   * @param name - Formatter identifier
   * @returns Formatter instance or undefined if not found
   */
  static get(name: string): Formatter | undefined {
    const factory = this.factories.get(name);
    return factory?.();
  }

  /**
   * Get all registered formatters.
   * @returns Array of formatter instances
   */
  static getAll(): Formatter[] {
    return Array.from(this.factories.values()).map((factory) => factory());
  }

  /**
   * List all registered formatter names.
   * @returns Array of formatter identifiers
   */
  static list(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Check if a formatter is registered.
   * @param name - Formatter identifier
   */
  static has(name: string): boolean {
    return this.factories.has(name);
  }

  /**
   * Unregister a formatter (useful for testing).
   * @param name - Formatter identifier
   */
  static unregister(name: string): boolean {
    return this.factories.delete(name);
  }

  /**
   * Clear all registered formatters (useful for testing).
   */
  static clear(): void {
    this.factories.clear();
  }
}

/**
 * Type guard to distinguish a FormatterClass (constructor) from a FormatterFactory (function).
 *
 * A FormatterClass is a constructor function with a `prototype` property,
 * while a FormatterFactory is a plain function returning a Formatter instance.
 */
function isFormatterClass(value: FormatterClass | FormatterFactory): value is FormatterClass {
  return value.prototype !== undefined && value.prototype.constructor === value;
}

/**
 * Validate that a formatter class has a proper static getSupportedVersions() method.
 *
 * @param name - Formatter name (used in error messages)
 * @param ctor - The formatter class constructor to validate
 * @throws Error if getSupportedVersions is missing or returns an invalid value
 */
function validateFormatterClass(name: string, ctor: FormatterClass): void {
  // The FormatterClass type already enforces this at compile time,
  // but we add a runtime check for safety (e.g., JavaScript consumers).
  const asRecord = ctor as unknown as Record<string, unknown>;
  if (typeof asRecord['getSupportedVersions'] !== 'function') {
    throw new Error(
      `Formatter '${name}' must implement a static getSupportedVersions() method. ` +
        `Add 'static getSupportedVersions()' to the ${ctor.name ?? name} class.`
    );
  }

  const versions = ctor.getSupportedVersions();
  if (!versions || typeof versions !== 'object') {
    throw new Error(
      `Formatter '${name}': getSupportedVersions() must return a non-null version map. ` +
        `Got ${String(versions)}.`
    );
  }

  // Validate that at least one version entry exists
  const entries = Object.entries(versions);
  if (entries.length === 0) {
    throw new Error(
      `Formatter '${name}': getSupportedVersions() returned an empty version map. ` +
        `At least one version must be defined.`
    );
  }

  // Validate each version entry has required fields
  for (const [versionName, info] of entries) {
    const versionInfo = info as unknown as Record<string, unknown>;
    if (typeof versionInfo['name'] !== 'string') {
      throw new Error(
        `Formatter '${name}': version '${versionName}' is missing required 'name' field.`
      );
    }
    if (typeof versionInfo['description'] !== 'string') {
      throw new Error(
        `Formatter '${name}': version '${versionName}' is missing required 'description' field.`
      );
    }
    if (typeof versionInfo['outputPath'] !== 'string') {
      throw new Error(
        `Formatter '${name}': version '${versionName}' is missing required 'outputPath' field.`
      );
    }
  }
}
