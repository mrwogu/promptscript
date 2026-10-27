import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';
import type { GovernanceConfig, PolicyDefinition } from '@promptscript/core';
import { Compiler } from '@promptscript/compiler';
import { parsePolicies } from '@promptscript/validator';

const guide = readFileSync(
  new URL('../../../../docs/guides/policy-engine.md', import.meta.url),
  'utf8'
);

const fences = (language: string, text = guide): string[] =>
  [...text.matchAll(new RegExp('```' + language + '\\n([\\s\\S]*?)```', 'g'))].map(
    (match) => match[1] ?? ''
  );

interface GuideConfig {
  policies: PolicyDefinition[];
  governance?: GovernanceConfig;
  releases?: { environments: string[] };
}

const configs = fences('yaml')
  .map((text) => parseYaml(text) as unknown)
  .filter((value): value is GuideConfig => {
    return typeof value === 'object' && value !== null && 'policies' in value;
  });

const byName = new Map(
  configs.flatMap((config) => config.policies).map((policy) => [policy.name, policy])
);

const directories: string[] = [];

afterAll(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('the policy engine guide', () => {
  it.each(configs.map((config, index) => [index, config] as const))(
    'has policies that parse in YAML block %i',
    (_index, config) => {
      // Fences that show only policies get the roles and environments of the guide.
      const context = {
        governance: config.governance ?? { roles: { legal: ['@acme/legal'] } },
        releases: config.releases ?? { environments: ['staging', 'prod'] },
      };

      expect(parsePolicies(config.policies, context).errors).toEqual([]);
    }
  );

  it('shows the output its prompt example produces', async () => {
    // Arrange
    const example = guide.slice(
      guide.indexOf('### Example'),
      guide.indexOf('## Governance Values')
    );
    const [source] = fences('promptscript', example);
    const [output] = fences('text', example);
    const starter = configs.find((config) => config.governance?.dataClasses !== undefined);
    const policies = [
      'data-floor',
      'governance-fields',
      'high-risk-models',
      'payments-content',
    ].map((name) => byName.get(name));
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'prs-policy-guide-')));
    directories.push(root);
    mkdirSync(join(root, '.promptscript'));
    const entry = join(root, '.promptscript', 'project.prs');
    writeFileSync(entry, source ?? '');

    // Act
    const result = await new Compiler({
      resolver: { registryPath: root, projectRoot: root, localPath: join(root, '.promptscript') },
      validator: { policies: policies as PolicyDefinition[], governance: starter?.governance },
      formatters: [],
    }).compile(entry);

    // Assert
    const shown = (output ?? '')
      .split('\n')
      .map((line) => /^ {2}[✗⚠] (.*)$/u.exec(line)?.[1])
      .filter((line): line is string => line !== undefined);
    expect(shown).toEqual([
      ...result.errors.map((error) => error.message),
      ...result.warnings.map((warning) => `${warning.ruleId}: ${warning.message}`),
    ]);
  });
});
