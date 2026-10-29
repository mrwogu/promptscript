import { describe, expect, it } from 'vitest';
import type { GovernanceConfig } from '@promptscript/core';
import { governanceValues } from '../../rules/governance-values.js';
import { PROMPT_LOC, programWith, promptProgram, runRule } from '../prompt-helper.js';

const GOVERNANCE: GovernanceConfig = {
  roles: { legal: ['@acme/legal'] },
  dataClasses: ['pii', 'phi', 'Financial'],
};

describe('PS047: governance-values', () => {
  it('has the rule metadata', () => {
    expect(governanceValues.id).toBe('PS047');
    expect(governanceValues.name).toBe('governance-values');
    expect(governanceValues.defaultSeverity).toBe('warning');
  });

  it('stays silent without a governance section', () => {
    // Arrange
    const ast = promptProgram({ owner: 'Jane Doe', dataClasses: ['nonsense'] });

    // Act / Assert
    expect(runRule(governanceValues, ast)).toEqual([]);
    expect(runRule(governanceValues, ast, { governance: [] as never })).toEqual([]);
  });

  it('stays silent in a program without prompts', () => {
    // Arrange
    const ast = programWith([], { owner: 'Platform team' });

    // Act / Assert
    expect(runRule(governanceValues, ast, { governance: GOVERNANCE })).toEqual([]);
  });

  it.each([
    '@jane',
    '@jane.doe',
    '@name_shortcode',
    '@a-b-c',
    '@acme/legal',
    '@acme/emea/legal',
    'jane.doe+prompts@acme.example.com',
  ])('accepts the identity %s', (owner) => {
    // Arrange
    const ast = promptProgram({ owner, reviewers: [owner] });

    // Act / Assert
    expect(runRule(governanceValues, ast, { governance: {} })).toEqual([]);
  });

  it.each([
    'Jane Doe',
    'jane',
    '@-jane',
    '@.x',
    '@_x',
    '@jane.',
    '@jane-',
    '@a..b',
    '@a--b',
    '@a._b',
    '@jane doe',
    '@jane/',
    `@${'a'.repeat(254)}`,
    'jane@acme',
    'jane@acme.c',
    'a@b@acme.com',
    '@acme/',
    `${'a'.repeat(250)}@acme.com`,
  ])('warns on the owner %s', (owner) => {
    // Arrange
    const ast = promptProgram({ owner });

    // Act
    const messages = runRule(governanceValues, ast, { governance: {} });

    // Assert
    expect(messages).toEqual([
      expect.objectContaining({
        ruleId: 'PS047',
        severity: 'warning',
        message: `Prompt "review": owner "${owner}" is not a Git host identity`,
        location: PROMPT_LOC,
        suggestion: 'Use a user (@jane), a team (@acme/legal) or an email address.',
      }),
    ]);
  });

  it('checks reviewers and the @meta defaults at their own location', () => {
    // Arrange
    const metaLoc = { file: 'meta.prs', line: 1, column: 1 };
    const ast = promptProgram(
      { reviewers: ['@acme/legal', 'legal team'] },
      { meta: { owner: 'ops' } }
    );
    ast.meta!.loc = metaLoc;

    // Act
    const messages = runRule(governanceValues, ast, { governance: {} });

    // Assert
    expect(messages.map((message) => [message.message, message.location])).toEqual([
      ['@meta: owner "ops" is not a Git host identity', metaLoc],
      ['Prompt "review": reviewer "legal team" is not a Git host identity', PROMPT_LOC],
    ]);
  });

  it('warns on data classes outside governance.dataClasses, compared lowercased', () => {
    // Arrange
    const ast = promptProgram({ dataClasses: ['PII', 'financial', 'pji', 'secret'] });

    // Act
    const messages = runRule(governanceValues, ast, { governance: GOVERNANCE });

    // Assert
    expect(messages.map((message) => [message.message, message.suggestion])).toEqual([
      [
        'Prompt "review": data class "pji" is not in governance.dataClasses',
        'Did you mean "pii"? Otherwise add it to governance.dataClasses.',
      ],
      [
        'Prompt "review": data class "secret" is not in governance.dataClasses',
        'Use a data class from governance.dataClasses or add it there.',
      ],
    ]);
  });

  it('checks no data class when the vocabulary is unset or not a list of strings', () => {
    // Arrange
    const ast = promptProgram({ dataClasses: ['anything'] });
    const inherited = Object.create({ dataClasses: ['pii'] }) as GovernanceConfig;

    // Act / Assert
    expect(runRule(governanceValues, ast, { governance: { roles: {} } })).toEqual([]);
    expect(runRule(governanceValues, ast, { governance: inherited })).toEqual([]);
    expect(runRule(governanceValues, ast, { governance: { dataClasses: 'pii' as never } })).toEqual(
      []
    );
  });
});
