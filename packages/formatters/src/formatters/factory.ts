import type { Program, Value } from '@promptscript/core';
import {
  MarkdownInstructionFormatter,
  type MarkdownAgentConfig,
  type MarkdownCommandConfig,
  type MarkdownSkillConfig,
} from '../markdown-instruction-formatter.js';
import type { FormatterOutput } from '../types.js';

/**
 * Supported Factory AI format versions.
 */
export type FactoryVersion = 'simple' | 'multifile' | 'full';

/**
 * Factory AI formatter version information.
 */
export const FACTORY_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single AGENTS.md file',
    outputPath: 'AGENTS.md',
  },
  multifile: {
    name: 'multifile',
    description: 'AGENTS.md + .factory/skills/<name>/SKILL.md',
    outputPath: 'AGENTS.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + droids + additional supporting files',
    outputPath: 'AGENTS.md',
  },
} as const;

/**
 * Handoff definition for Factory AI multi-agent workflows.
 */
interface FactoryHandoff {
  /** Display label */
  label: string;
  /** Target agent identifier */
  agent: string;
  /** Prompt to send to target agent */
  prompt: string;
  /** Whether to send immediately */
  send?: boolean;
}

/**
 * Extended command config with Factory-specific fields.
 */
interface FactoryCommandConfig extends MarkdownCommandConfig {
  /** Agent to execute the command */
  agent?: string;
  /** Handoff definitions for multi-agent workflows */
  handoffs?: FactoryHandoff[];
  /** Allowed tools for this command */
  tools?: string[];
}

/**
 * Extended skill config with Factory-specific fields.
 */
interface FactorySkillConfig extends MarkdownSkillConfig {
  /** Whether user can invoke via slash command */
  userInvocable: boolean;
  /** Whether to disable automatic AI invocation */
  disableModelInvocation: boolean;
  /** Allowed tools */
  allowedTools?: string[];
}

/**
 * Valid reasoning effort levels for Factory AI droids.
 */
type FactoryReasoningEffort = 'low' | 'medium' | 'high';

/**
 * Configuration for a Factory AI droid (subagent).
 */
interface FactoryDroidConfig extends MarkdownAgentConfig {
  /** Model to use (e.g., 'inherit', 'claude-sonnet-4-5-20250929') */
  model?: string;
  /** Reasoning effort level */
  reasoningEffort?: FactoryReasoningEffort;
  /** Model for Specification Mode planning (mixed models) */
  specModel?: string;
  /** Reasoning effort for Specification Mode model */
  specReasoningEffort?: FactoryReasoningEffort;
  /** Tool access: category name or array of tool IDs */
  tools?: string | string[];
}

/**
 * Formatter for Factory AI instructions.
 *
 * Factory AI uses AGENTS.md as its main configuration file and
 * .factory/skills/<name>/SKILL.md for reusable skills.
 *
 * Supports three versions:
 * - **simple**: Single `AGENTS.md` file
 * - **multifile**: AGENTS.md + `.factory/skills/<name>/SKILL.md` for each skill
 * - **full** (default): Multifile + additional supporting files for skills
 *
 * @example
 * ```yaml
 * targets:
 *   - factory  # uses full mode (default)
 *   - factory:
 *       version: multifile
 *   - factory:
 *       version: full
 * ```
 *
 * @see https://docs.factory.ai/cli/configuration
 */
export class FactoryFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'factory',
      outputPath: 'AGENTS.md',
      description: 'Factory AI AGENTS.md (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# AGENTS.md',
      dotDir: '.factory',
      skillFileName: 'SKILL.md',
      hasAgents: true,
      hasCommands: true,
      hasSkills: true,
      skillsInMultifile: true,
      sectionNames: {
        codeStandards: 'Conventions & Patterns',
        gitCommits: 'Git Workflows',
        configFiles: 'Configuration',
        postWork: 'Build & Test',
        restrictions: "Don'ts",
      },
      restrictionsTransform: (s: string) => s.replace(/^Never\s+/i, "Don't "),
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof FACTORY_VERSIONS {
    return FACTORY_VERSIONS;
  }

  // ============================================================
  // Command File Generation (Factory-specific)
  // ============================================================

  protected override extractCommands(ast: Program): FactoryCommandConfig[] {
    const shortcuts = this.findBlock(ast, 'shortcuts');
    if (!shortcuts) return [];

    const commands: FactoryCommandConfig[] = [];
    const props = this.getProps(shortcuts.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // TextContent from auto-discovered command files or triple-quoted strings
        if ('type' in value && (value as Record<string, unknown>)['type'] === 'TextContent') {
          const content = this.valueToString(value);
          if (content.includes('\n')) {
            commands.push({
              name: name.replace(/^\/+/, ''),
              description: name.replace(/^\/+/, ''),
              content,
            });
          }
          continue;
        }

        const obj = value as Record<string, Value>;

        // Generate command file if it has prompt: true or multiline content
        if (obj['prompt'] === true || obj['content']) {
          const handoffs = this.extractHandoffs(obj['handoffs']);
          commands.push({
            name: name.replace(/^\/+/, ''),
            description: obj['description'] ? this.valueToString(obj['description']) : name,
            content: obj['content'] ? this.valueToString(obj['content']) : '',
            agent: obj['agent'] ? this.valueToString(obj['agent']) : undefined,
            handoffs: handoffs.length > 0 ? handoffs : undefined,
            tools:
              obj['tools'] && Array.isArray(obj['tools'])
                ? obj['tools'].map((t) => this.valueToString(t))
                : undefined,
          });
        }
      }
    }

    return commands;
  }

  protected override generateCommandFile(config: MarkdownCommandConfig): FormatterOutput {
    const factoryConfig = config as FactoryCommandConfig;
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`description: ${this.yamlString(factoryConfig.description)}`);
    if (factoryConfig.agent) {
      lines.push(`agent: ${factoryConfig.agent}`);
    }
    if (factoryConfig.tools && factoryConfig.tools.length > 0) {
      const toolsArray = factoryConfig.tools.map((t) => `'${t}'`).join(', ');
      lines.push(`tools: [${toolsArray}]`);
    }
    if (factoryConfig.handoffs && factoryConfig.handoffs.length > 0) {
      lines.push('handoffs: ');
      for (const handoff of factoryConfig.handoffs) {
        lines.push(`  - label: ${this.yamlString(handoff.label)}`);
        lines.push(`    agent: ${handoff.agent}`);
        if (handoff.prompt) {
          lines.push(`    prompt: ${this.yamlString(handoff.prompt)}`);
        }
        if (handoff.send) {
          lines.push('    send: true');
        }
      }
    }
    lines.push('---');
    lines.push('');

    if (factoryConfig.content) {
      const dedentedContent = this.dedent(factoryConfig.content);
      lines.push(dedentedContent);
    }

    return {
      path: `.factory/commands/${factoryConfig.name}.md`,
      content: lines.join('\n') + '\n',
    };
  }

  // ============================================================
  // Skill File Generation (Factory-specific)
  // ============================================================

  protected override extractSkills(ast: Program): FactorySkillConfig[] {
    const skillsBlock = this.findBlock(ast, 'skills');
    if (!skillsBlock) return [];

    const skills: FactorySkillConfig[] = [];
    const props = this.getProps(skillsBlock.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (!this.isSafeSkillName(name)) continue;
        const obj = value as Record<string, Value>;
        skills.push({
          name,
          description: obj['description'] ? this.valueToString(obj['description']) : name,
          userInvocable: obj['userInvocable'] !== false,
          disableModelInvocation: obj['disableModelInvocation'] === true,
          content: obj['content'] ? this.valueToString(obj['content']) : '',
          allowedTools:
            obj['allowedTools'] && Array.isArray(obj['allowedTools'])
              ? obj['allowedTools'].map((t) => this.valueToString(t))
              : undefined,
          resources:
            obj['resources'] && Array.isArray(obj['resources'])
              ? (obj['resources'] as Array<Record<string, Value>>).map((r) => ({
                  relativePath: r['relativePath'] as string,
                  content: r['content'] as string,
                }))
              : undefined,
        });
      }
    }

    return skills;
  }

  protected override generateSkillFile(config: MarkdownSkillConfig): FormatterOutput {
    const factoryConfig = config as FactorySkillConfig;
    const lines: string[] = [];

    // Factory uses hyphens in skill names (e.g. speckit-plan, not speckit.plan)
    const skillName = factoryConfig.name.replace(/\./g, '-');

    // YAML frontmatter
    lines.push('---');
    lines.push(`name: ${skillName}`);
    lines.push(`description: ${this.yamlString(factoryConfig.description)}`);

    // Only emit non-default values (user-invocable defaults to true)
    if (factoryConfig.userInvocable === false) {
      lines.push('user-invocable: false');
    }

    // Only emit non-default values (disable-model-invocation defaults to false)
    if (factoryConfig.disableModelInvocation === true) {
      lines.push('disable-model-invocation: true');
    }

    if (factoryConfig.allowedTools && factoryConfig.allowedTools.length > 0) {
      const toolsArray = factoryConfig.allowedTools.map((t) => `"${t}"`).join(', ');
      lines.push(`allowed-tools: [${toolsArray}]`);
    }

    lines.push('---');
    lines.push('');

    if (factoryConfig.content) {
      // Skill content is a standalone file - preserve verbatim without Prettier normalization
      const dedentedContent = this.dedent(factoryConfig.content);
      lines.push(dedentedContent);
    }

    const skillDirPath = `.factory/skills/${factoryConfig.name}`;
    const resourceFiles = this.sanitizeResourceFiles(factoryConfig.resources, skillDirPath);

    return {
      path: `${skillDirPath}/SKILL.md`,
      content: lines.join('\n') + '\n',
      additionalFiles: resourceFiles.length > 0 ? resourceFiles : undefined,
    };
  }

  // ============================================================
  // Droid File Generation (Factory-specific)
  // ============================================================

  protected override extractAgents(ast: Program): FactoryDroidConfig[] {
    const agentsBlock = this.findBlock(ast, 'agents');
    if (!agentsBlock) return [];

    const droids: FactoryDroidConfig[] = [];
    const props = this.getProps(agentsBlock.content);

    for (const [name, value] of Object.entries(props)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, Value>;
        const description = obj['description'] ? this.valueToString(obj['description']) : '';
        if (!description) continue; // description is required

        droids.push({
          name: name.replace(/\./g, '-'),
          description,
          content: obj['content'] ? this.valueToString(obj['content']) : '',
          model: obj['model'] ? this.valueToString(obj['model']) : undefined,
          reasoningEffort: this.parseReasoningEffort(obj['reasoningEffort']),
          specModel: obj['specModel'] ? this.valueToString(obj['specModel']) : undefined,
          specReasoningEffort: this.parseReasoningEffort(obj['specReasoningEffort']),
          tools: this.parseDroidTools(obj['tools']),
        });
      }
    }

    return droids;
  }

  protected override generateAgentFile(config: MarkdownAgentConfig): FormatterOutput {
    const droidConfig = config as FactoryDroidConfig;
    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`name: ${droidConfig.name}`);

    if (droidConfig.description) {
      lines.push(`description: ${this.yamlString(droidConfig.description)}`);
    }

    if (droidConfig.model) {
      lines.push(`model: ${droidConfig.model}`);
    }

    if (droidConfig.reasoningEffort) {
      lines.push(`reasoningEffort: ${droidConfig.reasoningEffort}`);
    }

    if (droidConfig.specModel) {
      lines.push(`specModel: ${droidConfig.specModel}`);
    }

    if (droidConfig.specReasoningEffort) {
      lines.push(`specReasoningEffort: ${droidConfig.specReasoningEffort}`);
    }

    if (droidConfig.tools) {
      if (typeof droidConfig.tools === 'string') {
        lines.push(`tools: ${droidConfig.tools}`);
      } else if (Array.isArray(droidConfig.tools) && droidConfig.tools.length > 0) {
        const toolsArray = droidConfig.tools.map((t) => `"${t}"`).join(', ');
        lines.push(`tools: [${toolsArray}]`);
      }
    }

    lines.push('---');
    lines.push('');

    if (droidConfig.content) {
      const dedentedContent = this.dedent(droidConfig.content);
      lines.push(dedentedContent);
    }

    return {
      path: `.factory/droids/${droidConfig.name}.md`,
      content: lines.join('\n') + '\n',
    };
  }

  private parseReasoningEffort(value: Value | undefined): FactoryReasoningEffort | undefined {
    if (!value) return undefined;
    const str = this.valueToString(value);
    const valid: FactoryReasoningEffort[] = ['low', 'medium', 'high'];
    return valid.includes(str as FactoryReasoningEffort)
      ? (str as FactoryReasoningEffort)
      : undefined;
  }

  private parseDroidTools(value: Value | undefined): string | string[] | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      const arr = value.map((v) => this.valueToString(v)).filter((s) => s.length > 0);
      return arr.length > 0 ? arr : undefined;
    }
    return this.valueToString(value);
  }

  // ============================================================
  // Handoff Extraction (Factory-specific)
  // ============================================================

  private extractHandoffs(value: Value | undefined): FactoryHandoff[] {
    if (!value || !Array.isArray(value)) return [];

    const handoffs: FactoryHandoff[] = [];
    for (const item of value) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const obj = item as Record<string, Value>;
        const label = obj['label'] ? this.valueToString(obj['label']) : '';
        const agent = obj['agent'] ? this.valueToString(obj['agent']) : '';
        const prompt = obj['prompt'] ? this.valueToString(obj['prompt']) : '';

        if (label && agent) {
          handoffs.push({
            label,
            agent,
            prompt,
            send: obj['send'] === true ? true : undefined,
          });
        }
      }
    }

    return handoffs;
  }
}
