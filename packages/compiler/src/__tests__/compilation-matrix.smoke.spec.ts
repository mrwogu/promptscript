import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BUILTIN_FORMATTERS, FEATURE_MATRIX, type ToolName } from '@promptscript/formatters';
import { Compiler } from '../compiler.js';

/**
 * One source exercising every block type, where each field carries a unique
 * sentinel. Compiling it to every target and version turns "does this block
 * survive?" into a mechanical check, so silent content loss cannot ship.
 */
const KITCHEN_SINK_SOURCE = `@meta {
  id: "compilation-matrix"
  syntax: "1.5.0"
  org: "MatrixOrg"
}

@identity {
  """
  ZZIDENTITY marker. You are a matrix probe assistant.
  """
}

@context {
  project: "ZZCTXPROJECT matrix probe"
  techStack: ["ZZCTXSTACK typescript"]
  architecture: "ZZCTXARCH layered pipeline."
  libraries: "ZZCTXLIB chevrotain"
}

@standards {
  typescript: ["ZZSTDTS strict mode enabled"]
  naming: ["ZZSTDNAMING files kebab-case"]
  testing: ["ZZSTDTESTING framework vitest"]

  git: {
    format: "ZZSTDGIT conventional commits"
    types: [feat, fix]
  }

  config: {
    eslint: "ZZSTDCONFIG inherit base"
  }

  documentation: {
    verifyAfter: "ZZSTDDOCS update docs"
  }

  diagrams: {
    format: "ZZSTDDIAGRAMS mermaid"
    types: [flowchart]
  }
}

@restrictions {
  - "ZZRESTRICT never use any type"
}

@knowledge {
  """
  ## Matrix Notes

  ZZKNOWLEDGE reference material.
  """
}

@shortcuts {
  "/probe": "ZZSHORTCUTDOC inspect the probe"

  "/deep": {
    prompt: true
    description: "ZZSHORTCUTDESC deep probe"
    content: """
      ZZSHORTCUTCONTENT run the deep probe.
    """
  }
}

@guards {
  globs: ["**/*.ts", "**/*.spec.ts"]

  security: {
    paths: ["**/*.ts"]
    description: "ZZGUARDDESC security review rules"
    content: """
      ZZGUARDCONTENT validate all inputs.
    """
  }
}

@examples {
  probe-example: {
    description: "ZZEXAMPLEDESC commit style"
    input: "ZZEXAMPLEINPUT added a probe"
    output: "ZZEXAMPLEOUTPUT fix(core): add a probe"
  }
}

@skills {
  probe-skill: {
    description: "ZZSKILLDESC probe the matrix"
    content: """
      ZZSKILLCONTENT walk every target.
    """
  }
}

@agents {
  probe-agent: {
    description: "ZZAGENTDESC matrix probe agent"
    content: """
      ZZAGENTCONTENT inspect compilation output.
    """
  }
}

@workflows {
  probe-flow: {
    description: "ZZWORKFLOWDESC probe workflow"
    content: """
      ZZWORKFLOWCONTENT run the matrix probe.
    """
  }
}

@mcpServers {
  probe-server: {
    transport: "stdio"
    command: ["node", "ZZMCPARG.mjs"]
    env: {
      PROBE_MODE: "ZZMCPENV"
    }
  }
}

@hooks {
  probe-hook: {
    event: "post-tool-use"
    matcher: "Edit"
    command: ["echo", "ZZHOOKCOMMAND"]
    statusMessage: "ZZHOOKSTATUS"
  }
}

@plugins {
  probe-plugin: {
    description: "ZZPLUGINDESC bundles the probe server"
    mcpServers: ["probe-server"]
  }
}
`;

/**
 * Sentinels that every target must preserve. These map to blocks that all
 * markdown-producing formatters render, so absence is always a defect.
 */
const UNIVERSAL_SENTINELS = [
  'ZZIDENTITY',
  'ZZCTXPROJECT',
  'ZZCTXSTACK',
  'ZZCTXARCH',
  'ZZCTXLIB',
  'ZZSTDTS',
  'ZZSTDNAMING',
  'ZZSTDTESTING',
  'ZZSTDGIT',
  'ZZSTDCONFIG',
  'ZZSTDDOCS',
  'ZZSTDDIAGRAMS',
  'ZZRESTRICT',
  'ZZKNOWLEDGE',
  'ZZSHORTCUTDOC',
] as const;

/**
 * Sentinels gated by a feature-matrix entry. Presence is asserted exactly when
 * the matrix declares the feature `supported`, which keeps the published
 * support table honest in both directions.
 */
const FEATURE_SENTINELS: readonly { feature: string; sentinels: readonly string[] }[] = [
  { feature: 'examples', sentinels: ['ZZEXAMPLEDESC', 'ZZEXAMPLEINPUT', 'ZZEXAMPLEOUTPUT'] },
  { feature: 'skills', sentinels: ['ZZSKILLDESC', 'ZZSKILLCONTENT'] },
  { feature: 'agent-instructions', sentinels: ['ZZAGENTDESC', 'ZZAGENTCONTENT'] },
  { feature: 'workflows', sentinels: ['ZZWORKFLOWDESC', 'ZZWORKFLOWCONTENT'] },
  { feature: 'path-specific-rules', sentinels: ['ZZGUARDDESC', 'ZZGUARDCONTENT'] },
  { feature: 'slash-commands', sentinels: ['ZZSHORTCUTCONTENT'] },
];

/**
 * Integration configs have no feature-matrix entry, so they are checked by
 * output path instead: whenever a target writes one of these files, the
 * authored values have to be in it.
 */
const CONFIG_FILE_SENTINELS: readonly { match: RegExp; sentinels: readonly string[] }[] = [
  { match: /mcp[^/]*\.json$|mcp_config\.json$/, sentinels: ['ZZMCPARG', 'ZZMCPENV'] },
  { match: /hooks[^/]*\.(json|toml)$|hooks\/[^/]+\.json$/, sentinels: ['ZZHOOKCOMMAND'] },
  { match: /plugins[^/]*\.json$/, sentinels: ['ZZPLUGINDESC'] },
];

interface TargetVersion {
  readonly target: string;
  readonly version: string;
}

function declaredStatus(target: string, featureId: string): string | undefined {
  const feature = FEATURE_MATRIX.find((entry) => entry.id === featureId);
  return feature?.tools[target as ToolName];
}

function listTargetVersions(): TargetVersion[] {
  const combinations: TargetVersion[] = [];
  for (const [target, FormatterCtor] of Object.entries(BUILTIN_FORMATTERS)) {
    for (const version of Object.keys(FormatterCtor.getSupportedVersions())) {
      combinations.push({ target, version });
    }
  }
  return combinations;
}

let directory: string;
let entryPath: string;

beforeAll(() => {
  directory = mkdtempSync(join(tmpdir(), 'promptscript-compilation-matrix-'));
  mkdirSync(join(directory, '.promptscript'), { recursive: true });
  entryPath = join(directory, 'project.prs');
  writeFileSync(entryPath, KITCHEN_SINK_SOURCE);
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

async function compileTo(target: string, version: string) {
  const compiler = new Compiler({
    resolver: { registryPath: directory, projectRoot: directory },
    formatters: [{ name: target, config: { version } }],
  });
  return compiler.compile(entryPath);
}

describe('Compilation matrix smoke tests', () => {
  const combinations = listTargetVersions();

  it('covers every registered target', () => {
    expect(combinations.length).toBeGreaterThan(0);
    expect(new Set(combinations.map((entry) => entry.target)).size).toBe(
      Object.keys(BUILTIN_FORMATTERS).length
    );
  });

  describe.each(combinations)('$target ($version)', ({ target, version }) => {
    it('compiles without errors and emits usable output', async () => {
      const result = await compileTo(target, version);

      expect(result.errors).toEqual([]);
      expect(result.success).toBe(true);
      expect(result.outputs.size).toBeGreaterThan(0);

      for (const [path, output] of result.outputs) {
        expect(output.content.trim(), `Empty output: ${path}`).not.toBe('');
        if (path.endsWith('.json')) {
          expect(() => JSON.parse(output.content), `Malformed JSON: ${path}`).not.toThrow();
        }
      }
    });

    it('preserves block content that every target renders', async () => {
      const result = await compileTo(target, version);
      const blob = [...result.outputs.values()].map((output) => output.content).join('\n');

      for (const sentinel of UNIVERSAL_SENTINELS) {
        expect(blob, `${target} (${version}) dropped ${sentinel}`).toContain(sentinel);
      }
    });

    it('fills every integration config it writes', async () => {
      const result = await compileTo(target, version);

      for (const [path, output] of result.outputs) {
        for (const { match, sentinels } of CONFIG_FILE_SENTINELS) {
          if (!match.test(path)) continue;
          for (const sentinel of sentinels) {
            expect(output.content, `${path} dropped ${sentinel}`).toContain(sentinel);
          }
        }
      }
    });
  });

  // Reduced versions deliberately drop extra files, so a declared feature only
  // has to survive in one of the target's versions.
  describe.each([...new Set(combinations.map((entry) => entry.target))])(
    '%s feature support',
    (target) => {
      it('emits the content of every feature it declares as supported', async () => {
        const versions = Object.keys(
          BUILTIN_FORMATTERS[target as keyof typeof BUILTIN_FORMATTERS].getSupportedVersions()
        );
        const blobs = await Promise.all(
          versions.map(async (version) => {
            const result = await compileTo(target, version);
            return [...result.outputs.values()].map((output) => output.content).join('\n');
          })
        );

        for (const { feature, sentinels } of FEATURE_SENTINELS) {
          if (declaredStatus(target, feature) !== 'supported') continue;
          for (const sentinel of sentinels) {
            expect(
              blobs.some((blob) => blob.includes(sentinel)),
              `${target} declares ${feature} as supported but no version emits ${sentinel}`
            ).toBe(true);
          }
        }
      });
    }
  );
});
