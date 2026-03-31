import { describe, it, expect, beforeEach } from 'vitest';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resolver } from '../resolver.js';
import type { ObjectContent, TextContent, ComposedPhase } from '@promptscript/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FIXTURES_DIR = resolve(__dirname, '__fixtures__/skill-composition');

describe('skill composition resolver', () => {
  let resolver: Resolver;

  beforeEach(() => {
    resolver = new Resolver({
      registryPath: resolve(FIXTURES_DIR, 'registry'),
      localPath: FIXTURES_DIR,
      cache: false,
    });
  });

  describe('basic composition', () => {
    it('resolves parent.prs and produces phase headers for all three inline @use declarations', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();

      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      expect(ops).toBeDefined();

      const flatContent = ops['content'] as TextContent;
      expect(flatContent.type).toBe('TextContent');

      const text = flatContent.value;
      expect(text).toContain('## Phase 1: health-scan');
      expect(text).toContain('## Phase 2: triage');
      expect(text).toContain('## Phase 3: autofix');
    });

    it('preserves the original content preamble from the parent skill', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const flatContent = ops['content'] as TextContent;

      expect(flatContent.value).toContain('You are a production triage orchestrator.');
    });
  });

  describe('allowedTools union', () => {
    it('merges allowedTools from all phases without duplicates', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const allowedTools = ops['allowedTools'] as string[];

      expect(allowedTools).toBeDefined();
      expect(allowedTools).toContain('mcp__check_cpu');
      expect(allowedTools).toContain('mcp__check_memory');
      expect(allowedTools).toContain('Bash');
      expect(allowedTools).toContain('Read');
      expect(allowedTools).toContain('Write');
    });

    it('does not contain duplicate tool entries', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const allowedTools = ops['allowedTools'] as string[];

      const unique = new Set(allowedTools);
      expect(allowedTools.length).toBe(unique.size);
    });
  });

  describe('context blocks extracted', () => {
    it('includes Knowledge section from health-scan in flattened content', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const flatContent = ops['content'] as TextContent;

      expect(flatContent.value).toContain('### Knowledge');
    });

    it('includes Restrictions section from health-scan in flattened content', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const flatContent = ops['content'] as TextContent;

      expect(flatContent.value).toContain('### Restrictions');
      expect(flatContent.value).toContain('Never restart services without confirmation');
    });

    it('includes Restrictions section from code-fix in flattened content', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const flatContent = ops['content'] as TextContent;

      expect(flatContent.value).toContain('Never push to main');
    });
  });

  describe('alias used for phase name', () => {
    it('uses alias "autofix" instead of "code-fix" in the phase header', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const flatContent = ops['content'] as TextContent;

      expect(flatContent.value).toContain('## Phase 3: autofix');
      expect(flatContent.value).not.toContain('## Phase 3: code-fix');
    });
  });

  describe('composedFrom metadata', () => {
    it('stores __composedFrom with three entries', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composedFrom = ops['__composedFrom'] as ComposedPhase[];

      expect(composedFrom).toBeDefined();
      expect(Array.isArray(composedFrom)).toBe(true);
      expect(composedFrom).toHaveLength(3);
    });

    it('first entry has name "health-scan" and correct source path', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composedFrom = ops['__composedFrom'] as ComposedPhase[];

      expect(composedFrom[0]!.name).toBe('health-scan');
      expect(composedFrom[0]!.source).toContain('health-scan.prs');
    });

    it('second entry has name "triage"', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composedFrom = ops['__composedFrom'] as ComposedPhase[];

      expect(composedFrom[1]!.name).toBe('triage');
      expect(composedFrom[1]!.source).toContain('triage.prs');
    });

    it('third entry has name "autofix" and alias "autofix" with source pointing to code-fix.prs', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;
      const ops = content.properties['ops'] as Record<string, unknown>;
      const composedFrom = ops['__composedFrom'] as ComposedPhase[];

      expect(composedFrom[2]!.name).toBe('autofix');
      expect(composedFrom[2]!.alias).toBe('autofix');
      expect(composedFrom[2]!.source).toContain('code-fix.prs');
    });
  });

  describe('inlineUses consumed', () => {
    it('sets inlineUses to undefined after resolution', async () => {
      const result = await resolver.resolve(resolve(FIXTURES_DIR, 'parent.prs'));

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const content = skillsBlock!.content as ObjectContent;

      expect(content.inlineUses).toBeUndefined();
    });
  });

  describe('regression — simple skill file without inline uses', () => {
    it('resolves health-scan.prs normally without errors', async () => {
      const result = await resolver.resolve(
        resolve(FIXTURES_DIR, 'phases/health-scan.prs')
      );

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();

      const content = skillsBlock!.content as ObjectContent;
      expect(content.inlineUses).toBeUndefined();
      expect(content.properties['health-scan']).toBeDefined();
    });

    it('resolves triage.prs normally without errors', async () => {
      const result = await resolver.resolve(
        resolve(FIXTURES_DIR, 'phases/triage.prs')
      );

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();
      const content = skillsBlock!.content as ObjectContent;
      expect(content.properties['triage']).toBeDefined();
    });

    it('resolves a file with no @skills block without errors', async () => {
      const result = await resolver.resolve(
        resolve(FIXTURES_DIR, 'no-skills.prs')
      );

      expect(result.ast).not.toBeNull();
      expect(result.errors).toHaveLength(0);

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeUndefined();
    });
  });
});
