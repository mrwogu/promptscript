import type { BlockContent, Program, Value } from '@promptscript/core';
import type {
  ConfigStandards,
  DiagramStandards,
  DocumentationStandards,
  ExtractedStandards,
  GitStandards,
  StandardsEntry,
  StandardsExtractionOptions,
} from './types.js';
import { getSectionTitle, NON_CODE_KEYS, normalizeSectionName } from './types.js';

/**
 * Extracts standards from @standards blocks in a consistent way.
 * This extractor ensures all formatters have parity when handling
 * arbitrary @standards keys like security, performance, etc.
 */
export class StandardsExtractor {
  private readonly options: Required<StandardsExtractionOptions>;

  constructor(options: StandardsExtractionOptions = {}) {
    this.options = {
      supportLegacyFormat: options.supportLegacyFormat ?? true,
      supportObjectFormat: options.supportObjectFormat ?? true,
    };
  }

  /**
   * Extract standards from a @standards block.
   * Dynamically iterates over ALL keys, not just hardcoded ones.
   */
  extract(content: BlockContent): ExtractedStandards {
    const props = this.getProps(content);
    const codeStandards = new Map<string, StandardsEntry>();

    // Extract non-code standards first
    const git = this.extractGit(props);
    const config = this.extractConfig(props);
    const documentation = this.extractDocumentation(props);
    const diagrams = this.extractDiagrams(props);

    // Handle legacy format: code: { style: [...], patterns: [...] }
    // Only use legacy handling if it's an object with style/patterns keys
    let legacyCodeHandled = false;
    if (this.options.supportLegacyFormat) {
      const code = props['code'];
      if (code && typeof code === 'object' && !Array.isArray(code)) {
        const codeObj = code as Record<string, Value>;
        // Only treat as legacy if it has style or patterns keys
        if ('style' in codeObj || 'patterns' in codeObj) {
          const items: string[] = [];
          this.addArrayItems(items, codeObj['style']);
          this.addArrayItems(items, codeObj['patterns']);
          if (items.length > 0) {
            codeStandards.set('code', {
              key: 'code',
              sectionName: 'code',
              title: 'Code Style',
              items,
              rawValue: code,
            });
            legacyCodeHandled = true;
          }
        }
      }
    }

    // Dynamically iterate over ALL keys (like GitHub does)
    for (const [key, value] of Object.entries(props)) {
      // Skip non-code keys
      if (this.isNonCodeKey(key)) {
        continue;
      }
      // Skip 'code' key only if it was handled by legacy logic
      if (key === 'code' && legacyCodeHandled) {
        continue;
      }

      const entry = this.extractEntry(key, value);
      if (entry && entry.items.length > 0) {
        codeStandards.set(key, entry);
      }
    }

    return {
      codeStandards,
      git,
      config,
      documentation,
      diagrams,
    };
  }

  /**
   * Extract standards from an AST Program with @standards block.
   * Convenience method that finds the block first.
   */
  extractFromProgram(ast: Program): ExtractedStandards | null {
    const standards = ast.blocks.find((b) => b.name === 'standards' && !b.name.startsWith('__'));
    if (!standards) return null;
    return this.extract(standards.content);
  }

  /**
   * Extract a single standards entry from a key-value pair.
   */
  private extractEntry(key: string, value: Value): StandardsEntry | null {
    const items: string[] = [];

    // Array format: typescript: ["Strict mode", ...]
    if (Array.isArray(value)) {
      for (const item of value) {
        const str = this.valueToString(item);
        if (str) items.push(str);
      }
    }
    // Object format: typescript: { strictMode: true, exports: "named" }
    else if (this.options.supportObjectFormat && value && typeof value === 'object') {
      this.extractFromObject(value as Record<string, Value>, items);
    }
    // String format: typescript: "Strict mode enabled"
    else if (typeof value === 'string' && value.trim()) {
      items.push(value.trim());
    }

    if (items.length === 0) return null;

    return {
      key,
      sectionName: normalizeSectionName(key),
      title: getSectionTitle(key),
      items,
      rawValue: value,
    };
  }

  /**
   * Extract items from an object format like { strictMode: true }.
   * Extracts ALL key-value pairs as items for complete representation.
   */
  private extractFromObject(obj: Record<string, Value>, items: string[]): void {
    for (const [objKey, objValue] of Object.entries(obj)) {
      // Skip null/undefined
      if (objValue === null || objValue === undefined) continue;
      // Skip boolean false values
      if (objValue === false) continue;

      // Boolean true values - just output the key (e.g., "strictMode")
      if (objValue === true) {
        items.push(objKey);
        continue;
      }

      const str = this.valueToString(objValue);
      if (str) {
        items.push(`${objKey}: ${str}`);
      }
    }
  }

  /**
   * Extract git standards from @standards.git
   */
  private extractGit(props: Record<string, Value>): GitStandards | undefined {
    const git = props['git'];
    if (!git || typeof git !== 'object' || Array.isArray(git)) return undefined;

    const g = git as Record<string, Value>;
    const result: { format?: string; types?: string[]; example?: string } = {};

    if (g['format']) result.format = this.valueToString(g['format']);
    if (Array.isArray(g['types'])) {
      result.types = g['types'].map((t) => this.valueToString(t)).filter(Boolean);
    }
    if (g['example']) result.example = this.valueToString(g['example']);

    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Extract config standards from @standards.config
   */
  private extractConfig(props: Record<string, Value>): ConfigStandards | undefined {
    const config = props['config'];
    if (!config || typeof config !== 'object' || Array.isArray(config)) return undefined;

    const c = config as Record<string, Value>;
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(c)) {
      const str = this.valueToString(value);
      if (str) result[key] = str;
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Extract documentation standards from @standards.documentation
   * Handles both array format and object format.
   */
  private extractDocumentation(props: Record<string, Value>): DocumentationStandards | undefined {
    const doc = props['documentation'];
    if (!doc) return undefined;

    const items: string[] = [];

    // Array format: documentation: ["Rule 1", "Rule 2"]
    if (Array.isArray(doc)) {
      for (const item of doc) {
        const str = this.valueToString(item);
        if (str) items.push(str);
      }
    }
    // Object format: documentation: { verifyBefore: true, verifyAfter: "update docs" }
    else if (typeof doc === 'object') {
      this.extractFromObject(doc as Record<string, Value>, items);
    }
    // String format: documentation: "Keep docs updated"
    else if (typeof doc === 'string' && doc.trim()) {
      items.push(doc.trim());
    }

    return items.length > 0 ? { items, rawValue: doc } : undefined;
  }

  /**
   * Extract diagram standards from @standards.diagrams
   * Supports both 'format' and 'tool' keys, with 'format' taking precedence.
   */
  private extractDiagrams(props: Record<string, Value>): DiagramStandards | undefined {
    const diagrams = props['diagrams'];
    if (!diagrams || typeof diagrams !== 'object' || Array.isArray(diagrams)) return undefined;

    const d = diagrams as Record<string, Value>;
    let format: string | undefined;
    let types: string[] | undefined;

    // Support both 'format' (canonical) and 'tool' (alias) keys
    if (d['format']) {
      format = this.valueToString(d['format']);
    } else if (d['tool']) {
      format = this.valueToString(d['tool']);
    }
    if (Array.isArray(d['types'])) {
      types = d['types'].map((t) => this.valueToString(t)).filter(Boolean);
    }

    // Return only if we extracted something meaningful
    if (format || (types && types.length > 0)) {
      return { format, types, rawValue: diagrams };
    }

    return undefined;
  }

  /**
   * Check if a key is a non-code key (git, config, documentation, diagrams).
   */
  private isNonCodeKey(key: string): boolean {
    return (NON_CODE_KEYS as readonly string[]).includes(key);
  }

  /**
   * Add array items to the items list.
   */
  private addArrayItems(items: string[], value: Value | undefined): void {
    if (!Array.isArray(value)) return;
    for (const item of value) {
      const str = this.valueToString(item);
      if (str) items.push(str);
    }
  }

  /**
   * Get properties from block content.
   */
  private getProps(content: BlockContent): Record<string, Value> {
    switch (content.type) {
      case 'ObjectContent':
        return content.properties;
      case 'MixedContent':
        return content.properties;
      default:
        return {};
    }
  }

  /**
   * Convert a value to string representation.
   * Handles all Value union types including TextContent, TypeExpression, and plain objects.
   */
  private valueToString(value: Value): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.valueToString(v)).join(', ');
    }
    if (typeof value === 'object' && 'type' in value) {
      // TextContent: { type: 'TextContent', value: string }
      if (value.type === 'TextContent' && typeof value.value === 'string') {
        return value.value.trim();
      }
      // TypeExpression: { type: 'TypeExpression', kind: 'range'|'enum'|etc, params?: Value[] }
      if (value.type === 'TypeExpression' && 'kind' in value) {
        const kind = value.kind as string;
        const params = 'params' in value && Array.isArray(value.params) ? value.params : [];
        if (params.length > 0) {
          return `${kind}(${params.map((p) => this.valueToString(p as Value)).join(', ')})`;
        }
        return kind;
      }
    }
    // Plain object (Record<string, Value>) - convert to key-value string
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, Value>);
      if (entries.length > 0) {
        return entries.map(([k, v]) => `${k}: ${this.valueToString(v)}`).join(', ');
      }
    }
    return '';
  }
}
