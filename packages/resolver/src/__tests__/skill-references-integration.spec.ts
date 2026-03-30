import { describe, it, expect } from 'vitest';
import { Resolver } from '../resolver.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, unlinkSync } from 'node:fs';
import type { ObjectContent } from '@promptscript/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES = join(__dirname, '__fixtures__', 'skill-references');

describe('Skill references integration', () => {
  it('should resolve skill with references from SKILL.md frontmatter', async () => {
    // Create a minimal .prs that the resolver can parse.
    // The resolver auto-discovers skills from <localPath>/skills/
    // so pointing localPath at FIXTURES will find skills/expert/SKILL.md.
    const projectPrs = join(FIXTURES, 'project-integration.prs');
    writeFileSync(
      projectPrs,
      ['@meta {', '  id: "integration-test"', '  syntax: "1.1.0"', '}'].join('\n')
    );

    try {
      const resolver = new Resolver({
        registryPath: FIXTURES,
        localPath: FIXTURES,
      });

      const result = await resolver.resolve(projectPrs);

      // Resolution must succeed without errors
      expect(result.errors).toHaveLength(0);
      expect(result.ast).not.toBeNull();

      // The resolver auto-discovers the 'expert' skill from skills/expert/SKILL.md
      // and loads its references (references/spring.md) into resources
      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      expect(skillsBlock).toBeDefined();

      const skillsContent = skillsBlock!.content as ObjectContent;
      const expertSkill = skillsContent.properties['expert'] as Record<string, unknown>;
      expect(expertSkill).toBeDefined();

      // resources must include the reference file declared in SKILL.md frontmatter
      const resources = expertSkill['resources'] as Array<{
        relativePath: string;
        content: string;
      }>;
      expect(resources).toBeDefined();
      expect(Array.isArray(resources)).toBe(true);

      const springRef = resources.find((r) => r.relativePath === 'references/spring.md');
      expect(springRef).toBeDefined();
      expect(springRef!.content).toContain('Spring Patterns');
    } finally {
      try {
        unlinkSync(projectPrs);
      } catch {
        // ignore cleanup errors
      }
    }
  });

  it('should include reference content in resolved resources', async () => {
    // Directly test that resolveSkillReferences works end-to-end via the Resolver
    // by checking the content of the loaded reference file
    const projectPrs = join(FIXTURES, 'project-integration-content.prs');
    writeFileSync(
      projectPrs,
      ['@meta {', '  id: "integration-content-test"', '  syntax: "1.1.0"', '}'].join('\n')
    );

    try {
      const resolver = new Resolver({
        registryPath: FIXTURES,
        localPath: FIXTURES,
      });

      const result = await resolver.resolve(projectPrs);

      expect(result.errors).toHaveLength(0);
      expect(result.ast).not.toBeNull();

      const skillsBlock = result.ast!.blocks.find((b) => b.name === 'skills');
      const skillsContent = skillsBlock!.content as ObjectContent;
      const expertSkill = skillsContent.properties['expert'] as Record<string, unknown>;

      const resources = expertSkill['resources'] as Array<{
        relativePath: string;
        content: string;
      }>;

      // The spring.md reference should be fully loaded with its content
      const springRef = resources.find((r) => r.relativePath === 'references/spring.md');
      expect(springRef).toBeDefined();
      expect(springRef!.content).toContain('Base Spring Boot patterns');
    } finally {
      try {
        unlinkSync(projectPrs);
      } catch {
        // ignore cleanup errors
      }
    }
  });
});
