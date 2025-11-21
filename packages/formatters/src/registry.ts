import type { Formatter, FormatterFactory } from './types';

/**
 * Registry for formatter implementations.
 * Allows dynamic registration and discovery of formatters.
 */
export class FormatterRegistry {
  private static factories = new Map<string, FormatterFactory>();

  /**
   * Register a formatter factory.
   * @param name - Unique formatter identifier
   * @param factory - Factory function that creates formatter instances
   */
  static register(name: string, factory: FormatterFactory): void {
    if (this.factories.has(name)) {
      throw new Error(`Formatter '${name}' is already registered`);
    }
    this.factories.set(name, factory);
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
