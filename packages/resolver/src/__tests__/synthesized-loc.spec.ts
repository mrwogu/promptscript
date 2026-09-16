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

/** Write a SKILL.md with frontmatter inside a skill directory. */
async function writeSkillMd(skillDir: string, name: string): Promise<string> {
  await mkdir(skillDir, { recursive: true });
  const skillMd = resolvePath(skillDir, 'SKILL.md');
  await writeFile(
    skillMd,
    ['---', `name: ${name}`, `description: ${name} skill`, '---', '', `${name} body.`].join('\n')
  );
  return skillMd;
}

/** Write an entry .prs importing the given ref. */
async function writeEntry(root: string, id: string, ref: string): Promise<string> {
  const entry = resolvePath(root, 'main.prs');
  await writeFile(
    entry,
    ['@meta {', `  id: "${id}"`, '  syntax: "1.0.0"', '}', '', `@use ${ref}`].join('\n')
  );
  return entry;
}

/**
 * Synthesized skill nodes must carry the source file they were inlined from.
 * `<synthesized>` is a dead end for validation findings: rules that report on
 * imported content need a file path the user can open.
 */
describe('synthesized node provenance', () => {
  it('should stamp the SKILL.md path on nodes synthesized from a .md import', async () => {
    const root = await mkdtemp(resolvePath(tmpdir(), 'prs-loc-'));
    const skillFile = await writeSkillMd(resolvePath(root, 'my-skill'), 'my-skill');
    const entry = await writeEntry(root, 'loc-md', './my-skill/SKILL.md');

    const resolver = new Resolver({
      registryPath: resolvePath(__dirname, '__fixtures__', 'md-imports'),
      localPath: root,
      cache: false,
    });

    const result = await resolver.resolve(entry);
    expect(result.errors).toEqual([]);

    const skillsBlock = result.ast?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();
    expect(skillsBlock?.loc.file).toBe(skillFile);
    expect(skillsBlock?.loc.file).not.toBe(VIRTUAL_LOC.file);

    if (skillsBlock?.content.type === 'ObjectContent') {
      expect(skillsBlock.content.loc.file).toBe(skillFile);
    }
  });

  it('should stamp the directory path on nodes synthesized from a directory import', async () => {
    const root = await mkdtemp(resolvePath(tmpdir(), 'prs-loc-'));
    const skillsDir = resolvePath(root, 'skills');
    await writeSkillMd(resolvePath(skillsDir, 'alpha'), 'alpha');
    await writeSkillMd(resolvePath(skillsDir, 'beta'), 'beta');
    const entry = await writeEntry(root, 'loc-dir', './skills');

    const resolver = new Resolver({
      registryPath: resolvePath(__dirname, '__fixtures__', 'md-imports'),
      localPath: root,
      cache: false,
    });

    const result = await resolver.resolve(entry);
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
    const root = await mkdtemp(resolvePath(tmpdir(), 'prs-loc-'));
    const scanDir = resolvePath(root, 'agents-dir');
    await writeSkillMd(resolvePath(scanDir, 'skills', 'gamma'), 'gamma');

    const program = await discoverNativeContent(scanDir);
    expect(program).not.toBeNull();

    const skillsBlock = program?.blocks.find((b) => b.name === 'skills');
    expect(skillsBlock).toBeDefined();
    expect(skillsBlock?.loc.file).toBe(scanDir);

    if (skillsBlock?.content.type === 'ObjectContent') {
      expect(skillsBlock.content.loc.file).toBe(scanDir);
    }
  });
});
