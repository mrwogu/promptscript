import { describe, it, expect } from 'vitest';
import { resolve as resolvePath, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdtemp, mkdir, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { Resolver } from '../resolver.js';
import { discoverNativeContent } from '../auto-discovery.js';
import { VIRTUAL_LOC } from '../ast-factory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Synthesized skill nodes must carry the source file they were inlined from.
 * `<synthesized>` is a dead end for validation findings: rules that report on
 * imported content need a file path the user can open.
 */
describe('synthesized node provenance', () => {
  it('should stamp the SKILL.md path on nodes synthesized from a .md import', async () => {
    const root = await mkdtemp(resolvePath(tmpdir(), 'prs-loc-md-'));
    const skillMd = resolvePath(root, 'my-skill.md');
    await writeFile(
      skillMd,
      ['---', 'name: my-skill', 'description: My skill', '---', '', 'Body content.'].join('\n')
    );
    await writeFile(
      resolvePath(root, 'main.prs'),
      ['@meta {', '  id: "loc-md"', '  syntax: "1.0.0"', '}', '', '@use ./my-skill.md'].join('\n')
    );

    const resolver = new Resolver({
      registryPath: resolvePath(__dirname, '__fixtures__', 'md-imports'),
      localPath: root,
      cache: false,
    });

    const result = await resolver.resolve(resolvePath(root, 'main.prs'));
    expect(result.errors).toEqual([]);

    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();
    expect(skillsBlock?.loc.file).toBe(skillMd);
    expect(skillsBlock?.loc.file).not.toBe(VIRTUAL_LOC.file);

    if (skillsBlock?.content.type === 'ObjectContent') {
      expect(skillsBlock.content.loc.file).toBe(skillMd);
    }
  });

  it('should stamp the directory path on nodes synthesized from a directory import', async () => {
    const root = await mkdtemp(resolvePath(tmpdir(), 'prs-loc-dir-'));
    const skillsDir = resolvePath(root, 'skills');
    await mkdir(resolvePath(skillsDir, 'alpha'), { recursive: true });
    await writeFile(
      resolvePath(skillsDir, 'alpha', 'SKILL.md'),
      ['---', 'name: alpha', 'description: Alpha skill', '---', '', 'Alpha body.'].join('\n')
    );
    await mkdir(resolvePath(skillsDir, 'beta'), { recursive: true });
    await writeFile(
      resolvePath(skillsDir, 'beta', 'SKILL.md'),
      ['---', 'name: beta', 'description: Beta skill', '---', '', 'Beta body.'].join('\n')
    );
    await writeFile(
      resolvePath(root, 'main.prs'),
      ['@meta {', '  id: "loc-dir"', '  syntax: "1.0.0"', '}', '', '@use ./skills'].join('\n')
    );

    const resolver = new Resolver({
      registryPath: resolvePath(__dirname, '__fixtures__', 'md-imports'),
      localPath: root,
      cache: false,
    });

    const result = await resolver.resolve(resolvePath(root, 'main.prs'));
    expect(result.errors).toEqual([]);

    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();
    expect(skillsBlock?.loc.file).toBe(skillsDir);

    if (skillsBlock?.content.type === 'ObjectContent') {
      expect(skillsBlock.content.loc.file).toBe(skillsDir);
      expect(Object.keys(skillsBlock.content.properties).sort()).toEqual(['alpha', 'beta']);
    }
  });

  it('should stamp the scanned directory on nodes from auto-discovery', async () => {
    const root = await mkdtemp(resolvePath(tmpdir(), 'prs-loc-disc-'));
    const skillsDir = resolvePath(root, 'agents-dir', 'skills');
    await mkdir(resolvePath(skillsDir, 'gamma'), { recursive: true });
    await writeFile(
      resolvePath(skillsDir, 'gamma', 'SKILL.md'),
      ['---', 'name: gamma', 'description: Gamma skill', '---', '', 'Gamma body.'].join('\n')
    );

    const program = await discoverNativeContent(resolvePath(root, 'agents-dir'));
    expect(program).not.toBeNull();

    const skillsBlock = program?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();
    expect(skillsBlock?.loc.file).toBe(resolvePath(root, 'agents-dir'));

    if (skillsBlock?.content.type === 'ObjectContent') {
      expect(skillsBlock.content.loc.file).toBe(resolvePath(root, 'agents-dir'));
    }
  });
});
