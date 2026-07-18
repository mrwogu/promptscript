import type { Program, Value } from '@promptscript/core';
import {
  MarkdownInstructionFormatter,
  type MarkdownAgentConfig,
} from '../markdown-instruction-formatter.js';
import type { FormatOptions, FormatterOutput, FormatterVersionMap } from '../types.js';

/**
 * Supported Codex output format versions.
 */
export type CodexVersion = 'simple' | 'multifile' | 'full';

/**
 * Codex formatter version information.
 */
export const CODEX_VERSIONS: Readonly<
  Record<string, { name: string; description: string; outputPath: string }>
> = {
  simple: {
    name: 'simple',
    description: 'Single AGENTS.md file',
    outputPath: 'AGENTS.md',
  },
  multifile: {
    name: 'multifile',
    description: 'AGENTS.md + .codex/agents/<name>.toml + .agents/skills/<name>/SKILL.md',
    outputPath: 'AGENTS.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + skills (Codex full mode)',
    outputPath: 'AGENTS.md',
  },
} as const;

/**
 * Escape a string for TOML double-quoted context.
 */
function escapeTomlString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Serialize a value to TOML format.
 * Supports: strings, numbers, booleans, arrays, and multiline strings.
 */
function serializeTomlValue(value: unknown, indent = ''): string {
  if (value === null || value === undefined) {
    return '""';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    // Use multiline string for content with newlines
    if (value.includes('\n')) {
      const escaped = value.replace(/"""/g, '\\"\\"\\"');
      return `"""\n${escaped}"""`;
    }
    return `"${escapeTomlString(value)}"`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((v) => serializeTomlValue(v, indent));
    return `[${items.join(', ')}]`;
  }
  if (typeof value === 'object') {
    // Serialize as inline table
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const pairs = entries.map(([k, v]) => `${k} = ${serializeTomlValue(v, indent)}`);
    return `{ ${pairs.join(', ')} }`;
  }
  return '""';
}

/**
 * Serialize an agent configuration to Codex TOML format.
 *
 * Maps portable PRS fields to Codex agent TOML fields:
 * - content -> developer_instructions
 * - reasoningEffort -> model_reasoning_effort
 * - sandboxMode -> sandbox_mode
 * - nicknameCandidates -> nickname_candidates
 * - mcpServers -> mcp_servers
 * - skills -> skills.config
 */
function serializeAgentToml(agentName: string, agent: Record<string, Value>): string {
  const lines: string[] = [];

  // Required fields
  lines.push(`name = "${escapeTomlString(agentName)}"`);

  const description = agent['description'];
  if (typeof description === 'string') {
    lines.push(`description = "${escapeTomlString(description)}"`);
  }

  // developer_instructions from content (per architecture decision: content is sole source)
  const content = agent['content'];
  if (
    content !== null &&
    typeof content === 'object' &&
    (content as { type?: string }).type === 'TextContent'
  ) {
    const textContent = (content as { value?: string }).value ?? '';
    lines.push(`developer_instructions = ${serializeTomlValue(textContent)}`);
  } else if (typeof content === 'string') {
    lines.push(`developer_instructions = ${serializeTomlValue(content)}`);
  }

  // model from agent config (optional)
  const model = agent['model'];
  if (typeof model === 'string') {
    lines.push(`model = "${escapeTomlString(model)}"`);
  }

  // model_reasoning_effort from reasoningEffort
  const reasoningEffort = agent['reasoningEffort'];
  if (typeof reasoningEffort === 'string') {
    lines.push(`model_reasoning_effort = "${escapeTomlString(reasoningEffort)}"`);
  }

  // sandbox_mode from sandboxMode
  const sandboxMode = agent['sandboxMode'];
  if (typeof sandboxMode === 'string') {
    lines.push(`sandbox_mode = "${escapeTomlString(sandboxMode)}"`);
  }

  // nickname_candidates from nicknameCandidates
  const nicknameCandidates = agent['nicknameCandidates'];
  if (Array.isArray(nicknameCandidates)) {
    const escaped = nicknameCandidates
      .filter((c): c is string => typeof c === 'string')
      .map((c) => `"${escapeTomlString(c)}"`);
    lines.push(`nickname_candidates = [${escaped.join(', ')}]`);
  }

  // mcp_servers from mcpServers
  const mcpServers = agent['mcpServers'];
  if (mcpServers !== null && typeof mcpServers === 'object' && !Array.isArray(mcpServers)) {
    const servers = mcpServers as Record<string, unknown>;
    const serverEntries = Object.entries(servers);
    if (serverEntries.length > 0) {
      lines.push('');
      lines.push('[mcp_servers]');
      for (const [serverName, serverConfig] of serverEntries) {
        if (serverConfig !== null && typeof serverConfig === 'object') {
          lines.push(`[mcp_servers.${serverName}]`);
          const config = serverConfig as Record<string, unknown>;
          for (const [key, val] of Object.entries(config)) {
            lines.push(`${key} = ${serializeTomlValue(val)}`);
          }
        }
      }
    }
  }

  // skills.config from skills
  const skills = agent['skills'];
  if (Array.isArray(skills)) {
    const skillNames = skills
      .filter((s): s is string => typeof s === 'string')
      .map((s) => `"${escapeTomlString(s)}"`);
    lines.push('');
    lines.push('[skills]');
    lines.push(`config = [${skillNames.join(', ')}]`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Validate agent name is safe for file path usage.
 * Rejects path traversal, empty names, and shell-unsafe characters.
 */
function isValidAgentName(name: string): boolean {
  if (!name || name.length === 0) return false;
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return false;
  if (name.includes('\0') || name.includes('\n') || name.includes('\r')) return false;
  // Only allow alphanumeric, hyphens, underscores, dots
  return /^[a-zA-Z0-9._-]+$/.test(name);
}

/** Maximum AGENTS.md file size in bytes (32 KiB per Codex spec). */
const MAX_AGENTS_MD_SIZE = 32 * 1024;

/**
 * Native Codex formatter.
 *
 * Generates:
 * - Root `AGENTS.md` through MarkdownInstructionFormatter
 * - `.codex/agents/<name>.toml` for each agent in @agents
 * - `.agents/skills/<name>/SKILL.md` for skills (fixture-confirmed path)
 *
 * Agent field mapping:
 * - `content` -> `developer_instructions`
 * - `reasoningEffort` -> `model_reasoning_effort`
 * - `sandboxMode` -> `sandbox_mode`
 * - `nicknameCandidates` -> `nickname_candidates`
 * - `mcpServers` -> `mcp_servers`
 * - `skills` -> `skills.config`
 */
export class CodexFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'codex',
      outputPath: 'AGENTS.md',
      description: 'Codex instructions (AGENTS.md + agent TOML)',
      defaultConvention: 'markdown',
      mainFileHeader: '',
      dotDir: '.agents',
      skillFileName: 'SKILL.md',
      hasAgents: true,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): FormatterVersionMap {
    return CODEX_VERSIONS;
  }

  /**
   * Generate agent TOML files for Codex.
   * Overrides the base agent file generation to emit TOML instead of Markdown.
   * This is a fallback for when the full AST data is not available;
   * the format() override handles the complete field mapping.
   */
  protected override generateAgentFile(config: MarkdownAgentConfig): FormatterOutput {
    const agentData: Record<string, Value> = {
      description: config.description,
      content: {
        type: 'TextContent',
        value: config.content,
        loc: { file: '<codex>', line: 1, column: 1 },
      },
    };

    const toml = serializeAgentToml(config.name, agentData);

    return {
      path: `.codex/agents/${config.name}.toml`,
      content: toml,
    };
  }

  /**
   * Override format to inject additional agent fields from the AST.
   */
  override format(ast: Program, options?: FormatOptions): FormatterOutput {
    const version = this.resolveVersion(options?.version);

    // For simple mode, just emit AGENTS.md
    if (version === 'simple') {
      return this.formatSimple(ast, options);
    }

    // For multifile and full, emit AGENTS.md + agent TOMLs + skills
    const result = super.format(ast, options);

    // Validate AGENTS.md against 32 KiB limit
    if (result.content.length > MAX_AGENTS_MD_SIZE) {
      // Truncate to prevent oversized output; the validator should catch this earlier
      result.content = result.content.slice(0, MAX_AGENTS_MD_SIZE);
    }

    // Collect additional files (config + agents)
    const extraFiles: FormatterOutput[] = [];
    const managedDirs: string[] = [];

    // Emit .codex/config.toml when project config options are set
    const targetConfig = options?.targetConfig;
    if (
      targetConfig &&
      (targetConfig.maxThreads || targetConfig.maxDepth || targetConfig.agentsFile)
    ) {
      const configLines: string[] = [];
      if (typeof targetConfig.maxThreads === 'number' && targetConfig.maxThreads > 0) {
        configLines.push(`max_threads = ${Math.floor(targetConfig.maxThreads)}`);
      }
      if (typeof targetConfig.maxDepth === 'number' && targetConfig.maxDepth > 0) {
        configLines.push(`max_depth = ${Math.floor(targetConfig.maxDepth)}`);
      }
      if (typeof targetConfig.agentsFile === 'string' && targetConfig.agentsFile.length > 0) {
        configLines.push(`agents_file = "${escapeTomlString(targetConfig.agentsFile)}"`);
      }
      if (configLines.length > 0) {
        extraFiles.push({
          path: '.codex/config.toml',
          content: configLines.join('\n') + '\n',
        });
        managedDirs.push('.codex');
      }
    }

    // Override agent files with full TOML including all fields
    const agentsBlock = ast.blocks.find((b) => b.name === 'agents');
    if (agentsBlock && agentsBlock.content.type === 'ObjectContent') {
      for (const [agentName, agentValue] of Object.entries(agentsBlock.content.properties)) {
        if (typeof agentValue !== 'object' || agentValue === null || Array.isArray(agentValue))
          continue;
        if (!isValidAgentName(agentName)) continue;
        const agent = agentValue as Record<string, Value>;
        const toml = serializeAgentToml(agentName, agent);
        extraFiles.push({
          path: `.codex/agents/${agentName}.toml`,
          content: toml,
        });
      }
      if (extraFiles.some((f) => f.path.startsWith('.codex/agents/'))) {
        managedDirs.push('.codex/agents');
      }
    }

    if (extraFiles.length > 0) {
      // Replace any base-generated agent files with native TOML
      const additionalFiles = (result.additionalFiles ?? []).filter(
        (f) => !f.path.startsWith('.codex/agents/') && f.path !== '.codex/config.toml'
      );
      return {
        ...result,
        additionalFiles: [...additionalFiles, ...extraFiles],
        managedOutputDirectories: [...(result.managedOutputDirectories ?? []), ...managedDirs],
      };
    }

    return result;
  }
}
