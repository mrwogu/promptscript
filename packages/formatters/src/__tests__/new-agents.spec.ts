import { describe, expect, it, beforeEach } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
// Import from index.ts to trigger side-effect registrations
import { FormatterRegistry } from '../index.js';

// Tier 1
import { WindsurfFormatter, WINDSURF_VERSIONS } from '../formatters/windsurf.js';
import { ClineFormatter, CLINE_VERSIONS } from '../formatters/cline.js';
import { RooFormatter, ROO_VERSIONS } from '../formatters/roo.js';
import { CodexFormatter, CODEX_VERSIONS } from '../formatters/codex.js';
import { ContinueFormatter, CONTINUE_VERSIONS } from '../formatters/continue.js';

// Tier 2
import { AugmentFormatter, AUGMENT_VERSIONS } from '../formatters/augment.js';
import { GooseFormatter, GOOSE_VERSIONS } from '../formatters/goose.js';
import { KiloFormatter, KILO_VERSIONS } from '../formatters/kilo.js';
import { AmpFormatter, AMP_VERSIONS } from '../formatters/amp.js';
import { TraeFormatter, TRAE_VERSIONS } from '../formatters/trae.js';
import { JunieFormatter, JUNIE_VERSIONS } from '../formatters/junie.js';
import { KiroFormatter, KIRO_VERSIONS } from '../formatters/kiro.js';

// Tier 3
import { CortexFormatter, CORTEX_VERSIONS } from '../formatters/cortex.js';
import { CrushFormatter, CRUSH_VERSIONS } from '../formatters/crush.js';
import { CommandCodeFormatter, COMMAND_CODE_VERSIONS } from '../formatters/command-code.js';
import { KodeFormatter, KODE_VERSIONS } from '../formatters/kode.js';
import { McpjamFormatter, MCPJAM_VERSIONS } from '../formatters/mcpjam.js';
import { MistralVibeFormatter, MISTRAL_VIBE_VERSIONS } from '../formatters/mistral-vibe.js';
import { MuxFormatter, MUX_VERSIONS } from '../formatters/mux.js';
import { OpenHandsFormatter, OPENHANDS_VERSIONS } from '../formatters/openhands.js';
import { PiFormatter, PI_VERSIONS } from '../formatters/pi.js';
import { QoderFormatter, QODER_VERSIONS } from '../formatters/qoder.js';
import { QwenCodeFormatter, QWEN_CODE_VERSIONS } from '../formatters/qwen-code.js';
import { ZencoderFormatter, ZENCODER_VERSIONS } from '../formatters/zencoder.js';
import { NeovateFormatter, NEOVATE_VERSIONS } from '../formatters/neovate.js';
import { PochiFormatter, POCHI_VERSIONS } from '../formatters/pochi.js';
import { AdalFormatter, ADAL_VERSIONS } from '../formatters/adal.js';
import { IflowFormatter, IFLOW_VERSIONS } from '../formatters/iflow.js';
import { OpenClawFormatter, OPENCLAW_VERSIONS } from '../formatters/openclaw.js';
import { CodeBuddyFormatter, CODEBUDDY_VERSIONS } from '../formatters/codebuddy.js';

const createLoc = (): SourceLocation => ({
  file: 'test.prs',
  line: 1,
  column: 1,
});

const createMinimalProgram = (): Program => ({
  type: 'Program',
  uses: [],
  blocks: [],
  extends: [],
  loc: createLoc(),
});

const createProgramWithIdentity = (): Program => ({
  ...createMinimalProgram(),
  blocks: [
    {
      type: 'Block',
      name: 'identity',
      content: {
        type: 'TextContent',
        value: 'You are an expert developer.',
        loc: createLoc(),
      },
      loc: createLoc(),
    },
  ],
});

/**
 * All new formatters with their expected configuration.
 */
const NEW_FORMATTERS = [
  // Tier 1
  {
    name: 'windsurf',
    Formatter: WindsurfFormatter,
    VERSIONS: WINDSURF_VERSIONS,
    outputPath: '.windsurf/rules/project.md',
    description: 'Windsurf rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.windsurf',
  },
  {
    name: 'cline',
    Formatter: ClineFormatter,
    VERSIONS: CLINE_VERSIONS,
    outputPath: '.clinerules',
    description: 'Cline rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.agents',
  },
  {
    name: 'roo',
    Formatter: RooFormatter,
    VERSIONS: ROO_VERSIONS,
    outputPath: '.roorules',
    description: 'Roo Code rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.roo',
    hasSkills: false as const,
  },
  {
    name: 'codex',
    Formatter: CodexFormatter,
    VERSIONS: CODEX_VERSIONS,
    outputPath: 'AGENTS.md',
    description: 'Codex instructions (Markdown)',
    mainHeader: '',
    dotDir: '.agents',
  },
  {
    name: 'continue',
    Formatter: ContinueFormatter,
    VERSIONS: CONTINUE_VERSIONS,
    outputPath: '.continue/rules/project.md',
    description: 'Continue rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.continue',
  },
  // Tier 2
  {
    name: 'augment',
    Formatter: AugmentFormatter,
    VERSIONS: AUGMENT_VERSIONS,
    outputPath: '.augment/rules/project.md',
    description: 'Augment rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.augment',
  },
  {
    name: 'goose',
    Formatter: GooseFormatter,
    VERSIONS: GOOSE_VERSIONS,
    outputPath: '.goose/rules/project.md',
    description: 'Goose rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.goose',
  },
  {
    name: 'kilo',
    Formatter: KiloFormatter,
    VERSIONS: KILO_VERSIONS,
    outputPath: '.kilocode/rules/project.md',
    description: 'Kilo Code rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.kilocode',
  },
  {
    name: 'amp',
    Formatter: AmpFormatter,
    VERSIONS: AMP_VERSIONS,
    outputPath: 'AGENTS.md',
    description: 'Amp instructions (Markdown)',
    mainHeader: '# AGENTS.md',
    dotDir: '.agents',
  },
  {
    name: 'trae',
    Formatter: TraeFormatter,
    VERSIONS: TRAE_VERSIONS,
    outputPath: '.trae/rules/project.md',
    description: 'Trae rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.trae',
  },
  {
    name: 'junie',
    Formatter: JunieFormatter,
    VERSIONS: JUNIE_VERSIONS,
    outputPath: '.junie/rules/project.md',
    description: 'Junie rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.junie',
  },
  {
    name: 'kiro',
    Formatter: KiroFormatter,
    VERSIONS: KIRO_VERSIONS,
    outputPath: '.kiro/rules/project.md',
    description: 'Kiro CLI rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.kiro',
  },
  // Tier 3
  {
    name: 'cortex',
    Formatter: CortexFormatter,
    VERSIONS: CORTEX_VERSIONS,
    outputPath: '.cortex/rules/project.md',
    description: 'Cortex Code rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.cortex',
  },
  {
    name: 'crush',
    Formatter: CrushFormatter,
    VERSIONS: CRUSH_VERSIONS,
    outputPath: '.crush/rules/project.md',
    description: 'Crush rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.crush',
  },
  {
    name: 'command-code',
    Formatter: CommandCodeFormatter,
    VERSIONS: COMMAND_CODE_VERSIONS,
    outputPath: '.commandcode/rules/project.md',
    description: 'Command Code rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.commandcode',
  },
  {
    name: 'kode',
    Formatter: KodeFormatter,
    VERSIONS: KODE_VERSIONS,
    outputPath: '.kode/rules/project.md',
    description: 'Kode rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.kode',
  },
  {
    name: 'mcpjam',
    Formatter: McpjamFormatter,
    VERSIONS: MCPJAM_VERSIONS,
    outputPath: '.mcpjam/rules/project.md',
    description: 'MCPJam rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.mcpjam',
  },
  {
    name: 'mistral-vibe',
    Formatter: MistralVibeFormatter,
    VERSIONS: MISTRAL_VIBE_VERSIONS,
    outputPath: '.vibe/rules/project.md',
    description: 'Mistral Vibe rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.vibe',
  },
  {
    name: 'mux',
    Formatter: MuxFormatter,
    VERSIONS: MUX_VERSIONS,
    outputPath: '.mux/rules/project.md',
    description: 'Mux rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.mux',
  },
  {
    name: 'openhands',
    Formatter: OpenHandsFormatter,
    VERSIONS: OPENHANDS_VERSIONS,
    outputPath: '.openhands/rules/project.md',
    description: 'OpenHands rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.openhands',
  },
  {
    name: 'pi',
    Formatter: PiFormatter,
    VERSIONS: PI_VERSIONS,
    outputPath: '.pi/rules/project.md',
    description: 'Pi rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.pi',
  },
  {
    name: 'qoder',
    Formatter: QoderFormatter,
    VERSIONS: QODER_VERSIONS,
    outputPath: '.qoder/rules/project.md',
    description: 'Qoder rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.qoder',
  },
  {
    name: 'qwen-code',
    Formatter: QwenCodeFormatter,
    VERSIONS: QWEN_CODE_VERSIONS,
    outputPath: '.qwen/rules/project.md',
    description: 'Qwen Code rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.qwen',
  },
  {
    name: 'zencoder',
    Formatter: ZencoderFormatter,
    VERSIONS: ZENCODER_VERSIONS,
    outputPath: '.zencoder/rules/project.md',
    description: 'Zencoder rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.zencoder',
  },
  {
    name: 'neovate',
    Formatter: NeovateFormatter,
    VERSIONS: NEOVATE_VERSIONS,
    outputPath: '.neovate/rules/project.md',
    description: 'Neovate rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.neovate',
  },
  {
    name: 'pochi',
    Formatter: PochiFormatter,
    VERSIONS: POCHI_VERSIONS,
    outputPath: '.pochi/rules/project.md',
    description: 'Pochi rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.pochi',
  },
  {
    name: 'adal',
    Formatter: AdalFormatter,
    VERSIONS: ADAL_VERSIONS,
    outputPath: '.adal/rules/project.md',
    description: 'AdaL rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.adal',
  },
  {
    name: 'iflow',
    Formatter: IflowFormatter,
    VERSIONS: IFLOW_VERSIONS,
    outputPath: '.iflow/rules/project.md',
    description: 'iFlow CLI rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.iflow',
  },
  {
    name: 'openclaw',
    Formatter: OpenClawFormatter,
    VERSIONS: OPENCLAW_VERSIONS,
    outputPath: 'INSTRUCTIONS.md',
    description: 'OpenClaw instructions (Markdown)',
    mainHeader: '# INSTRUCTIONS.md',
    dotDir: 'skills',
  },
  {
    name: 'codebuddy',
    Formatter: CodeBuddyFormatter,
    VERSIONS: CODEBUDDY_VERSIONS,
    outputPath: '.codebuddy/rules/project.md',
    description: 'CodeBuddy rules (Markdown)',
    mainHeader: '# Project Rules',
    dotDir: '.codebuddy',
  },
] as const;

describe('New Agent Formatters', () => {
  describe.each(NEW_FORMATTERS)(
    '$name formatter',
    ({ name, Formatter, VERSIONS, outputPath, description, mainHeader, hasSkills = true }) => {
      let formatter: InstanceType<typeof Formatter>;

      beforeEach(() => {
        formatter = new Formatter();
      });

      it('should have correct name, outputPath and description', () => {
        expect(formatter.name).toBe(name);
        expect(formatter.outputPath).toBe(outputPath);
        expect(formatter.description).toBe(description);
      });

      it('should have markdown as default convention', () => {
        expect(formatter.defaultConvention).toBe('markdown');
      });

      it('should have supported versions', () => {
        expect(VERSIONS.simple).toBeDefined();
        expect(VERSIONS.multifile).toBeDefined();
        expect(VERSIONS.full).toBeDefined();
        expect(VERSIONS.simple.name).toBe('simple');
        expect(VERSIONS.multifile.name).toBe('multifile');
        expect(VERSIONS.full.name).toBe('full');
      });

      it('should return versions from static getSupportedVersions()', () => {
        const versions = Formatter.getSupportedVersions();
        expect(versions).toBe(VERSIONS);
      });

      it('should format minimal program with correct header', () => {
        const ast = createMinimalProgram();
        const result = formatter.format(ast);

        expect(result.path).toBe(outputPath);
        expect(result.content).toContain(mainHeader);
      });

      it('should include project section from identity block', () => {
        const ast = createProgramWithIdentity();
        const result = formatter.format(ast);

        expect(result.content).toContain('## Project');
        expect(result.content).toContain('You are an expert developer.');
      });

      it.skipIf(!hasSkills)('should generate skill files in full mode', () => {
        const ast: Program = {
          ...createMinimalProgram(),
          blocks: [
            {
              type: 'Block',
              name: 'skills',
              content: {
                type: 'ObjectContent',
                properties: {
                  'test-skill': {
                    description: 'A test skill',
                    content: 'Test skill content',
                  },
                },
                loc: createLoc(),
              },
              loc: createLoc(),
            },
          ],
        };

        const result = formatter.format(ast, { version: 'full' });

        expect(result.additionalFiles).toBeDefined();
        expect(result.additionalFiles!.length).toBeGreaterThan(0);

        const skillFile = result.additionalFiles!.find((f) => f.path.includes('test-skill'));
        expect(skillFile).toBeDefined();
        expect(skillFile!.content).toContain('test-skill');
        expect(skillFile!.content).toContain('A test skill');
      });
    }
  );

  describe('Codex-specific behavior', () => {
    it('should not start with # AGENTS.md heading', () => {
      const formatter = new CodexFormatter();
      const ast = createMinimalProgram();
      const result = formatter.format(ast);

      expect(result.content).not.toMatch(/^# AGENTS\.md/);
    });
  });

  describe('Registry integration', () => {
    it.each(NEW_FORMATTERS.map((f) => f.name))(
      '%s should be registered in FormatterRegistry',
      (name) => {
        expect(FormatterRegistry.has(name)).toBe(true);
        const formatter = FormatterRegistry.get(name);
        expect(formatter).toBeDefined();
        expect(formatter!.name).toBe(name);
      }
    );

    it('should have 37 total formatters registered (7 original + 30 new)', () => {
      const all = FormatterRegistry.list();
      expect(all.length).toBe(37);
    });
  });
});
