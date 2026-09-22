import { describe, it, expect } from 'vitest';
import { resolve as resolvePath, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { normalizeProgram } from '@promptscript/core';
import { Resolver } from '@promptscript/resolver';
import { Validator } from '@promptscript/validator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Regression test for issue #456.
 *
 * A project imports a skills directory that ships scientific skills whose
 * reference files carry long protein and nucleotide sequences. Validation
 * must not fail with untraceable `<synthesized>:1:1` findings: PS012 must not
 * read those sequences as Base64, and every finding must point at the file
 * the content came from.
 */
describe('issue #456: PS012 on imported skills with protein data', () => {
  it('reports no untraceable findings for imported skills with sequence data', async () => {
    const root = await mkdtemp(resolvePath(tmpdir(), 'prs-issue-456-'));

    const proteinSkill = resolvePath(root, 'skills', 'alphafold-database');
    const referenceFile = resolvePath(proteinSkill, 'references', 'api_reference.md');
    await mkdir(dirname(referenceFile), { recursive: true });
    await writeFile(
      resolvePath(proteinSkill, 'SKILL.md'),
      [
        '---',
        'name: alphafold-database',
        'description: Protein structure database skill',
        'references:',
        '  - references/api_reference.md',
        '---',
        '',
        '# AlphaFold Database',
        '',
        'Protein sequence (residues):',
        'MKTAYIAKQRQISFVKSHFSRQLEKALTIQNAKGGGIFVDSKDKDAGKTKKVGGYGMKTAYIAKQRQISFVKSHFSRQ',
        '',
        'Nucleotide batch ids:',
        'ACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGT',
      ].join('\n')
    );
    await writeFile(
      referenceFile,
      [
        '# API reference',
        '',
        'Example response parser:',
        '"""',
        'python docstring marker, not a PRS block',
        '"""',
        '',
        'Protein: MKTAYIAKQRQISFVKSHFSRQLEKALTIQNAKGGGIFVDSKDKDAGKTKKVGGYG',
      ].join('\n')
    );

    const cleanSkill = resolvePath(root, 'skills', 'ui-design-system');
    await mkdir(cleanSkill, { recursive: true });
    await writeFile(
      resolvePath(cleanSkill, 'SKILL.md'),
      [
        '---',
        'name: ui-design-system',
        'description: UI design system skill',
        '---',
        '',
        'Clean body.',
      ].join('\n')
    );

    await writeFile(
      resolvePath(root, 'main.prs'),
      ['@meta {', '  id: "issue-456"', '  syntax: "1.0.0"', '}', '', '@use ./skills'].join('\n')
    );

    const resolver = new Resolver({
      registryPath: resolvePath(__dirname, '..', '__fixtures__'),
      localPath: root,
      cache: false,
    });

    const result = await resolver.resolve(resolvePath(root, 'main.prs'));
    expect(result.errors).toEqual([]);

    const validator = new Validator();
    const validation = validator.validate(normalizeProgram(result.ast!));

    // Long amino acid and nucleotide runs are biological data, not payloads.
    expect(validation.warnings.filter((w) => w.ruleId === 'PS012')).toHaveLength(0);

    // PS026 still fires on the docstring marker, but it must name the file
    // the content came from instead of the <synthesized> dead end.
    const ps026 = validation.warnings.filter((w) => w.ruleId === 'PS026');
    expect(ps026).toHaveLength(1);
    expect(ps026[0]!.location?.file).toBe(referenceFile);

    // No finding may point at the virtual location dead end.
    for (const message of validation.all) {
      expect(message.location?.file).not.toBe('<synthesized>');
    }
  });
});
