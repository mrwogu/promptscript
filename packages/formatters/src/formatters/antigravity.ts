import type { Block, Program, Value } from '@promptscript/core';
import { BaseFormatter } from '../base-formatter.js';
import type { ConventionRenderer } from '../convention-renderer.js';
import type { FormatOptions, FormatterOutput } from '../types.js';

/**
 * Supported Antigravity format versions.
 */
export type AntigravityVersion = 'simple' | 'frontmatter';

/**
 * Activation types for Antigravity rules.
 */
export type ActivationType = 'manual' | 'always' | 'model' | 'glob';

/**
 * Antigravity formatter version information.
 */
export const ANTIGRAVITY_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Plain Markdown without frontmatter',
    outputPath: '.agent/rules/project.md',
  },
  frontmatter: {
    name: 'frontmatter',
    description: 'Markdown with YAML frontmatter for activation',
    outputPath: '.agent/rules/project.md',
  },
} as const;

/**
 * Maximum character limit for Antigravity rules.
 */
const MAX_CHARS = 12000;

/**
 * Formatter for Google Antigravity rules.
 * Outputs: `.agent/rules/project.md`
 *
 * Antigravity Rules are stored as Markdown files in .agent/rules/ folder.
 * Each rule can be manually activated, always on, model-decided, or glob-based.
 *
 * Supports two versions:
 * - **simple** (default): Plain Markdown without frontmatter
 * - **frontmatter**: Markdown with YAML frontmatter for activation type
 *
 * Supports output convention:
 * - 'markdown': Uses Markdown headers and formatting (default, only supported convention)
 *
 * @example
 * ```yaml
 * # Simple format (default)
 * targets:
 *   - antigravity
 *
 * # Frontmatter format with activation
 * targets:
 *   - antigravity:
 *       version: frontmatter
 * ```
 */
export class AntigravityFormatter extends BaseFormatter {
  readonly name = 'antigravity';
  readonly outputPath = '.agent/rules/project.md';
  readonly description = 'Google Antigravity rules (Markdown)';
  readonly defaultConvention = 'markdown';

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof ANTIGRAVITY_VERSIONS {
    return ANTIGRAVITY_VERSIONS;
  }

  format(ast: Program, options?: FormatOptions): FormatterOutput {
    const version = this.resolveVersion(options?.version);
    const renderer = this.createRenderer(options);
    const sections: string[] = [];

    // Add YAML frontmatter if using frontmatter version
    if (version === 'frontmatter') {
      const activationType = this.determineActivationType(ast);
      sections.push(this.generateFrontmatter(ast, activationType));
    }

    // Add header
    sections.push(this.header(ast));

    // Add identity/project info
    const identity = this.identity(ast, renderer);
    if (identity) sections.push(identity);

    // Add tech stack
    const techStack = this.techStack(ast, renderer);
    if (techStack) sections.push(techStack);

    // Add architecture guidelines
    const architecture = this.architecture(ast, renderer);
    if (architecture) sections.push(architecture);

    // Add code standards
    const codeStandards = this.codeStandards(ast, renderer);
    if (codeStandards) sections.push(codeStandards);

    // Add git commits
    const gitCommits = this.gitCommits(ast, renderer);
    if (gitCommits) sections.push(gitCommits);

    // Add config files
    const configFiles = this.configFiles(ast, renderer);
    if (configFiles) sections.push(configFiles);

    // Add commands/shortcuts
    const commands = this.commands(ast, renderer);
    if (commands) sections.push(commands);

    // Add development commands
    const devCommands = this.devCommands(ast, renderer);
    if (devCommands) sections.push(devCommands);

    // Add post-work verification
    const postWork = this.postWork(ast, renderer);
    if (postWork) sections.push(postWork);

    // Add documentation requirements
    const documentation = this.documentation(ast, renderer);
    if (documentation) sections.push(documentation);

    // Add diagrams guidelines
    const diagrams = this.diagrams(ast, renderer);
    if (diagrams) sections.push(diagrams);

    // Add restrictions/don'ts
    const restrictions = this.restrictions(ast, renderer);
    if (restrictions) sections.push(restrictions);

    const content = sections.join('\n\n') + '\n';

    // Validate character limit
    this.validateContentLength(content);

    // Generate main output
    const mainOutput: FormatterOutput = {
      path: this.getOutputPath(options),
      content,
    };

    // Generate workflow outputs if present
    const workflowOutputs = this.workflows(ast);

    // If there are workflows, return multi-file output
    if (workflowOutputs && workflowOutputs.length > 0) {
      return {
        path: mainOutput.path,
        content: mainOutput.content,
        additionalFiles: workflowOutputs,
      };
    }

    return mainOutput;
  }

  /**
   * Resolve version string to AntigravityVersion.
   */
  private resolveVersion(version?: string): AntigravityVersion {
    if (version === 'frontmatter') {
      return 'frontmatter';
    }
    return 'simple';
  }

  /**
   * Determine the activation type based on AST content.
   * Defaults to 'always' for most rules.
   */
  private determineActivationType(ast: Program): ActivationType {
    // Check if guards block has glob patterns
    const guards = this.findBlock(ast, 'guards');
    if (guards) {
      const props = this.getProps(guards.content);
      if (props['globs'] || props['glob'] || props['files']) {
        return 'glob';
      }
    }

    // Default to 'always' for project-wide rules
    return 'always';
  }

  /**
   * Generate YAML frontmatter for Antigravity rules.
   */
  private generateFrontmatter(ast: Program, activation: ActivationType): string {
    const title = this.getMetaField(ast, 'name') ?? 'Project Rules';
    const description = this.extractProjectDescription(ast);

    const lines = [
      '---',
      `title: "${title}"`,
      `activation: "${activation}"`,
      `description: "${description}"`,
      '---',
    ];

    return lines.join('\n');
  }

  /**
   * Extract project description from AST.
   */
  private extractProjectDescription(ast: Program): string {
    // Try meta description first
    const metaDesc = this.getMetaField(ast, 'description');
    if (metaDesc) return metaDesc;

    // Try identity block
    const identity = this.findBlock(ast, 'identity');
    if (identity) {
      const text = this.extractText(identity.content);
      if (text) {
        // Take first sentence or first 100 chars
        const firstSentence = text.split('.')[0];
        if (firstSentence && firstSentence.length <= 100) {
          return firstSentence;
        }
        return text.slice(0, 100) + '...';
      }
    }

    return 'Auto-generated project rules';
  }

  /**
   * Validate content length against Antigravity's character limit.
   */
  private validateContentLength(content: string): void {
    if (content.length > MAX_CHARS) {
      console.warn(
        `Warning: Content exceeds Antigravity's ${MAX_CHARS.toLocaleString()} character limit ` +
          `(${content.length.toLocaleString()} chars). Consider splitting into multiple rules.`
      );
    }
  }

  /**
   * Extract workflows from shortcuts block.
   * Shortcuts with structured steps become separate workflow files.
   */
  private workflows(ast: Program): FormatterOutput[] | null {
    const shortcuts = this.findBlock(ast, 'shortcuts');
    if (!shortcuts) return null;

    const props = this.getProps(shortcuts.content);
    const workflowsList: FormatterOutput[] = [];

    for (const [name, value] of Object.entries(props)) {
      // Check if this shortcut has steps (making it a workflow)
      if (this.isWorkflow(value)) {
        const workflow = this.generateWorkflow(name, value);
        if (workflow) {
          workflowsList.push(workflow);
        }
      }
    }

    return workflowsList.length > 0 ? workflowsList : null;
  }

  /**
   * Check if a shortcut value represents a workflow (has steps).
   */
  private isWorkflow(value: Value): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }
    const obj = value as Record<string, Value>;
    return 'steps' in obj || 'workflow' in obj;
  }

  /**
   * Generate a workflow file from a shortcut with steps.
   */
  private generateWorkflow(name: string, value: Value): FormatterOutput | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }

    const obj = value as Record<string, Value>;
    const steps = obj['steps'] ?? obj['workflow'];
    const description = obj['description'] ?? obj['desc'] ?? '';

    // Extract clean name (remove leading slash if present)
    const cleanName = name.replace(/^\//, '').replace(/\s+/g, '-').toLowerCase();

    const lines: string[] = [
      '---',
      `title: "${this.formatWorkflowTitle(name)}"`,
      `description: "${this.valueToString(description)}"`,
      '---',
      '',
      '## Steps',
      '',
    ];

    // Add steps
    if (Array.isArray(steps)) {
      steps.forEach((step, index) => {
        lines.push(`${index + 1}. ${this.valueToString(step)}`);
      });
    } else if (typeof steps === 'string') {
      // Parse steps from string format
      const stepLines = steps
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      stepLines.forEach((step, index) => {
        const cleanStep = step.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '');
        lines.push(`${index + 1}. ${cleanStep}`);
      });
    }

    return {
      path: `.agent/workflows/${cleanName}.md`,
      content: lines.join('\n'),
    };
  }

  /**
   * Format workflow title from shortcut name.
   */
  private formatWorkflowTitle(name: string): string {
    return name
      .replace(/^\//, '')
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private header(ast: Program): string {
    const id = this.getMetaField(ast, 'id') ?? 'unknown';
    const syntax = this.getMetaField(ast, 'syntax') ?? '0.0.0';

    return `# Project Rules

> Auto-generated by PromptScript
> Source: ${id} (syntax ${syntax})
> Generated: ${new Date().toISOString()}
>
> **Do not edit manually** - these rules are generated from PromptScript.
> To modify, update the source .prs file and recompile.`;
  }

  private identity(ast: Program, _renderer: ConventionRenderer): string | null {
    const identity = this.findBlock(ast, 'identity');
    if (!identity) return null;

    const content = this.extractText(identity.content);
    if (!content) return null;

    // Apply stripAllIndent to normalize merged identity content for Prettier compatibility
    return `## Project Identity

${this.stripAllIndent(content)}`;
  }

  /**
   * Extract tech stack from @context block (same as GitHub/Cursor).
   */
  private techStack(ast: Program, _renderer: ConventionRenderer): string | null {
    const context = this.findBlock(ast, 'context');
    if (!context) return null;

    const props = this.getProps(context.content);
    const items: string[] = [];

    // Extract languages
    const languages = props['languages'];
    if (languages) {
      const arr = Array.isArray(languages) ? languages : [languages];
      items.push(`**Languages:** ${arr.map((l) => this.valueToString(l)).join(', ')}`);
    }

    // Extract runtime
    const runtime = props['runtime'];
    if (runtime) {
      items.push(`**Runtime:** ${this.valueToString(runtime)}`);
    }

    // Extract monorepo info
    const monorepo = props['monorepo'];
    if (monorepo && typeof monorepo === 'object' && !Array.isArray(monorepo)) {
      const mr = monorepo as Record<string, Value>;
      const tool = mr['tool'];
      const pm = mr['packageManager'];
      if (tool && pm) {
        items.push(
          `**Monorepo:** ${this.valueToString(tool)} with ${this.valueToString(pm)} workspaces`
        );
      } else if (tool) {
        items.push(`**Monorepo:** ${this.valueToString(tool)}`);
      }
    }

    // Extract frameworks
    const frameworks = props['frameworks'];
    if (frameworks) {
      const arr = Array.isArray(frameworks) ? frameworks : [frameworks];
      items.push(`**Frameworks:** ${arr.map((f) => this.valueToString(f)).join(', ')}`);
    }

    if (items.length === 0) return null;

    return `## Tech Stack

${items.join('\n')}`;
  }

  /**
   * Extract architecture from @context block (same as GitHub/Cursor).
   */
  private architecture(ast: Program, _renderer: ConventionRenderer): string | null {
    // Try @context block first (like GitHub/Cursor)
    const context = this.findBlock(ast, 'context');
    if (context) {
      const text = this.extractText(context.content);
      // Look for architecture section in text content
      const archMatch = this.extractSectionWithCodeBlock(text, '## Architecture');
      if (archMatch) {
        const content = archMatch.replace('## Architecture', '').trim();
        // Apply stripAllIndent to normalize content for Prettier compatibility
        return `## Architecture

${this.stripAllIndent(content)}`;
      }

      // Also try explicit architecture property
      const props = this.getProps(context.content);
      const arch = props['architecture'];
      if (arch) {
        const archText = typeof arch === 'string' ? arch : this.valueToString(arch);
        if (archText.trim()) {
          return `## Architecture

${this.stripAllIndent(archText.trim())}`;
        }
      }
    }

    // Fallback to dedicated @architecture block
    const archBlock = this.findBlock(ast, 'architecture');
    if (archBlock) {
      const content = this.extractText(archBlock.content);
      if (content) {
        return `## Architecture

${this.stripAllIndent(content)}`;
      }
    }

    return null;
  }

  /**
   * Extract code standards from @standards block (same as GitHub/Cursor).
   */
  private codeStandards(ast: Program, _renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const props = this.getProps(standards.content);
    const subsections: string[] = [];

    // TypeScript standards
    const typescript = props['typescript'];
    if (typescript && typeof typescript === 'object' && !Array.isArray(typescript)) {
      const items = this.formatTypeScriptStandards(typescript as Record<string, Value>);
      if (items.length > 0) {
        subsections.push(`### TypeScript\n\n${items.map((i) => '- ' + i).join('\n')}`);
      }
    }

    // Naming conventions
    const naming = props['naming'];
    if (naming && typeof naming === 'object' && !Array.isArray(naming)) {
      const items = this.formatNamingStandards(naming as Record<string, Value>);
      if (items.length > 0) {
        subsections.push(`### Naming Conventions\n\n${items.map((i) => '- ' + i).join('\n')}`);
      }
    }

    // Error handling
    const errors = props['errors'];
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      const items = this.formatErrorStandards(errors as Record<string, Value>);
      if (items.length > 0) {
        subsections.push(`### Error Handling\n\n${items.map((i) => '- ' + i).join('\n')}`);
      }
    }

    // Testing standards
    const testing = props['testing'];
    if (testing && typeof testing === 'object' && !Array.isArray(testing)) {
      const items = this.formatTestingStandards(testing as Record<string, Value>);
      if (items.length > 0) {
        subsections.push(`### Testing\n\n${items.map((i) => '- ' + i).join('\n')}`);
      }
    }

    if (subsections.length === 0) return null;

    return `## Code Standards

${subsections.join('\n\n')}`;
  }

  /**
   * Extract git commit standards from @standards.git (same as GitHub/Cursor).
   */
  private gitCommits(ast: Program, _renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const props = this.getProps(standards.content);
    const git = props['git'];
    if (!git || typeof git !== 'object' || Array.isArray(git)) return null;

    const gitObj = git as Record<string, Value>;
    const items: string[] = [];

    const format = gitObj['format'];
    if (format) {
      items.push(
        `Use [${this.valueToString(format)}](https://www.conventionalcommits.org/) format`
      );
    }

    const maxLen = gitObj['maxSubjectLength'];
    if (maxLen) {
      items.push(`Keep commit message subject line max ${this.valueToString(maxLen)} characters`);
    }

    items.push('Format: `<type>(<scope>): <description>`');

    const types = gitObj['types'];
    if (types && Array.isArray(types)) {
      items.push(`Types: \`${types.map(String).join('`, `')}\``);
    }

    const example = gitObj['example'];
    if (example) {
      items.push(`Example: \`${this.valueToString(example)}\``);
    }

    if (items.length === 0) return null;

    return `## Git Commits

${items.map((i) => '- ' + i).join('\n')}`;
  }

  /**
   * Extract config file standards from @standards.config (same as GitHub/Cursor).
   */
  private configFiles(ast: Program, _renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const props = this.getProps(standards.content);
    const config = props['config'];
    if (!config || typeof config !== 'object' || Array.isArray(config)) return null;

    const configObj = config as Record<string, Value>;
    const subsections: string[] = [];

    const eslint = configObj['eslint'];
    if (eslint) {
      const value = this.valueToString(eslint);
      subsections.push(`### ESLint\n\n- ESLint: ${value}`);
    }

    const vite = configObj['viteRoot'];
    if (vite) {
      // Escape markdown special characters for Prettier compatibility
      const value = this.valueToString(vite).replace(/__/g, '\\_\\_').replace(/\/\*/g, '/\\*');
      subsections.push(`### Vite/Vitest\n\n- Vite root: ${value}`);
    }

    if (subsections.length === 0) return null;

    return `## Configuration Files

${subsections.join('\n\n')}`;
  }

  /**
   * Extract shortcuts/commands from @shortcuts block.
   */
  private commands(ast: Program, _renderer: ConventionRenderer): string | null {
    const shortcuts = this.findBlock(ast, 'shortcuts');
    if (!shortcuts) return null;

    const props = this.getProps(shortcuts.content);
    if (Object.keys(props).length === 0) return null;

    const lines: string[] = [];

    for (const [key, value] of Object.entries(props)) {
      // Skip workflow shortcuts (they get their own files)
      if (this.isWorkflow(value)) continue;

      const valueStr = this.valueToString(value);
      // Avoid trailing space when value is empty
      if (valueStr) {
        lines.push(`- **${key}**: ${valueStr}`);
      } else {
        lines.push(`- **${key}**:`);
      }
    }

    // Only return if there are non-workflow commands
    if (lines.length === 0) return null;

    return `## Commands

${lines.join('\n')}`;
  }

  /**
   * Extract development commands from @knowledge block (same as GitHub/Cursor).
   */
  private devCommands(ast: Program, _renderer: ConventionRenderer): string | null {
    const knowledge = this.findBlock(ast, 'knowledge');
    if (!knowledge) return null;

    const text = this.extractText(knowledge.content);
    const commandsMatch = this.extractSectionWithCodeBlock(text, '## Development Commands');
    if (!commandsMatch) return null;

    const content = commandsMatch.replace('## Development Commands', '').trim();
    // Apply stripAllIndent to normalize content for Prettier compatibility
    return `## Development Commands

${this.stripAllIndent(content)}`;
  }

  /**
   * Extract post-work verification from @knowledge block (same as GitHub/Cursor).
   */
  private postWork(ast: Program, _renderer: ConventionRenderer): string | null {
    const knowledge = this.findBlock(ast, 'knowledge');
    if (!knowledge) return null;

    const text = this.extractText(knowledge.content);
    const postMatch = this.extractSectionWithCodeBlock(text, '## Post-Work Verification');
    if (!postMatch) return null;

    const intro =
      'After completing any code changes, run the following commands to ensure code quality:';
    const content = postMatch.replace('## Post-Work Verification', '').trim();
    // Apply stripAllIndent to normalize content for Prettier compatibility
    return `## Post-Work Verification

${intro}
${this.stripAllIndent(content)}`;
  }

  /**
   * Extract documentation standards from @standards.documentation (same as GitHub/Cursor).
   */
  private documentation(ast: Program, _renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const props = this.getProps(standards.content);
    const docs = props['documentation'];
    if (!docs || typeof docs !== 'object' || Array.isArray(docs)) return null;

    const docsObj = docs as Record<string, Value>;
    const items: string[] = [];

    if (docsObj['verifyBefore']) {
      items.push(
        '**Before** making code changes, review `README.md` and relevant files in `docs/` to understand documented behavior'
      );
    }
    if (docsObj['verifyAfter']) {
      items.push(
        '**After** making code changes, verify consistency with `README.md` and `docs/` - update documentation if needed'
      );
    }
    if (docsObj['codeExamples']) {
      items.push('Ensure code examples in documentation remain accurate after modifications');
    }
    items.push('If adding new features, add corresponding documentation in `docs/`');
    items.push('If changing existing behavior, update affected documentation sections');

    if (items.length === 0) return null;

    return `## Documentation

${items.map((i) => '- ' + i).join('\n')}`;
  }

  /**
   * Extract diagram standards from @standards.diagrams (same as GitHub/Cursor).
   */
  private diagrams(ast: Program, _renderer: ConventionRenderer): string | null {
    const standards = this.findBlock(ast, 'standards');
    if (!standards) return null;

    const props = this.getProps(standards.content);
    const diag = props['diagrams'];
    if (!diag || typeof diag !== 'object' || Array.isArray(diag)) return null;

    const diagObj = diag as Record<string, Value>;
    const items: string[] = [];

    const format = diagObj['format'];
    if (format) {
      // Escape markdown special characters for Prettier compatibility
      const formatValue = this.valueToString(format)
        .replace(/__/g, '\\_\\_')
        .replace(/\/\*/g, '/\\*');
      items.push(`Always use **${formatValue}** syntax for diagrams in documentation`);
    }

    const types = diagObj['types'];
    if (types && Array.isArray(types)) {
      items.push(`Supported diagram types: ${types.map(String).join(', ')}, etc.`);
    }

    items.push('Wrap diagrams in markdown code blocks with `mermaid` language identifier');
    items.push(
      'Example:\n  ```mermaid\n  flowchart LR\n    A[Input] --> B[Process] --> C[Output]\n  ```'
    );

    if (items.length === 0) return null;

    return `## Diagrams

${items.map((i) => '- ' + i).join('\n')}`;
  }

  /**
   * Extract restrictions from @restrictions block (same as GitHub/Cursor).
   */
  private restrictions(ast: Program, _renderer: ConventionRenderer): string | null {
    const block = this.findBlock(ast, 'restrictions');
    if (!block) return null;

    const items = this.extractRestrictionsItems(block.content);
    if (items.length === 0) return null;

    return `## Don'ts

${items.map((i) => '- ' + i).join('\n')}`;
  }

  /**
   * Extract restriction items from block content.
   */
  private extractRestrictionsItems(content: Block['content']): string[] {
    if (content.type === 'ArrayContent') {
      return content.elements.map((item) => this.formatRestriction(this.valueToString(item)));
    }

    if (content.type === 'TextContent') {
      return content.value
        .trim()
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => this.formatRestriction(line.trim()));
    }

    return [];
  }

  /**
   * Format restriction text (convert "Never X" to "Don't X").
   */
  private formatRestriction(text: string): string {
    return text
      .replace(/^-\s*/, '')
      .replace(/^"/, '')
      .replace(/"$/, '')
      .replace(/^Never\s+/i, "Don't ");
  }

  // Helper methods for formatting standards

  private formatTypeScriptStandards(obj: Record<string, Value>): string[] {
    const items: string[] = [];

    if (obj['strictMode']) items.push('Strict mode enabled, no `any` types');
    if (obj['noAny']) items.push('Never use `any` type - use `unknown` with type guards');
    if (obj['useUnknown']) items.push(`Use \`unknown\` ${this.valueToString(obj['useUnknown'])}`);
    if (obj['interfaces'])
      items.push(`Prefer \`interface\` ${this.valueToString(obj['interfaces'])}`);
    if (obj['types']) items.push(`Use \`type\` ${this.valueToString(obj['types'])}`);
    if (obj['exports']) items.push(`${this.capitalize(this.valueToString(obj['exports']))}`);
    if (obj['returnTypes'])
      items.push(`Explicit return types ${this.valueToString(obj['returnTypes'])}`);

    return items;
  }

  private formatNamingStandards(obj: Record<string, Value>): string[] {
    const items: string[] = [];

    if (obj['files']) items.push(`Files: \`${this.valueToString(obj['files'])}\``);
    if (obj['classes']) items.push(`Classes/Interfaces: \`${this.valueToString(obj['classes'])}\``);
    if (obj['interfaces']) items.push(`Interfaces: \`${this.valueToString(obj['interfaces'])}\``);
    if (obj['functions'])
      items.push(`Functions/Variables: \`${this.valueToString(obj['functions'])}\``);
    if (obj['variables']) items.push(`Variables: \`${this.valueToString(obj['variables'])}\``);
    if (obj['constants']) items.push(`Constants: \`${this.valueToString(obj['constants'])}\``);

    return items;
  }

  private formatErrorStandards(obj: Record<string, Value>): string[] {
    const items: string[] = [];

    if (obj['customClasses'])
      items.push(
        `Use custom error classes extending \`${this.valueToString(obj['customClasses'])}\``
      );
    if (obj['locationInfo']) items.push('Always include location information');
    if (obj['messages'])
      items.push(`Provide ${this.valueToString(obj['messages'])} error messages`);

    return items;
  }

  private formatTestingStandards(obj: Record<string, Value>): string[] {
    const items: string[] = [];

    if (obj['filePattern']) items.push(`Test files: \`${this.valueToString(obj['filePattern'])}\``);
    if (obj['pattern']) items.push(`Follow ${this.valueToString(obj['pattern'])} pattern`);
    if (obj['framework']) items.push(`Framework: ${this.valueToString(obj['framework'])}`);
    if (obj['coverage'])
      items.push(`Target >${this.valueToString(obj['coverage'])}% coverage for libraries`);
    if (obj['fixtures']) items.push(`Use fixtures ${this.valueToString(obj['fixtures'])}`);

    return items;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
