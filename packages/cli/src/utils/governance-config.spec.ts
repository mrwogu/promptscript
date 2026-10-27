import { describe, expect, it } from 'vitest';
import { checkGovernanceConfig, MAX_GOVERNANCE_ROLES } from './governance-config.js';

describe('checkGovernanceConfig', () => {
  it('accepts a full section and no section at all', () => {
    // Arrange
    const governance = {
      admins: ['@acme/prompt-platform', 'platform@acme.example'],
      roles: { legal: ['@acme/legal', '@jane.doe'], 'app-sec': ['@jane', '@acme/emea/appsec'] },
      dataClasses: ['pii', 'phi'],
      codeowners: { output: '.gitlab/CODEOWNERS', protect: ['.github/workflows'], prompts: false },
    };

    // Act / Assert
    expect(checkGovernanceConfig(governance)).toEqual([]);
    expect(checkGovernanceConfig(undefined)).toEqual([]);
  });

  it('refuses a section that is not a mapping', () => {
    // Act / Assert
    expect(checkGovernanceConfig(['@acme/legal'])).toEqual([
      'governance must be a mapping with admins, roles, dataClasses or codeowners.',
    ]);
  });

  it('names unknown keys with the closest one, __proto__ included', () => {
    // Arrange
    const governance = JSON.parse('{"admin": ["@a"], "__proto__": {"admins": ["@x"]}}') as unknown;

    // Act
    const problems = checkGovernanceConfig(governance);

    // Assert
    expect(problems).toEqual([
      'governance has an unknown key "admin". Did you mean "admins"?',
      'governance has an unknown key "__proto__". Use: admins, roles, dataClasses, codeowners.',
    ]);
  });

  it('checks every owner value', () => {
    // Act
    const problems = checkGovernanceConfig({
      admins: ['Platform Team', '@ok', '@ok', 7],
      roles: { legal: [] },
    });

    // Assert
    expect(problems).toEqual([
      'governance.admins has "Platform Team", which is not a Git host identity. Use a user (@jane), a team (@acme/legal) or an email address.',
      'governance.admins lists "@ok" twice. Remove one.',
      'governance.admins has 7, which is not a Git host identity. Use a user (@jane), a team (@acme/legal) or an email address.',
      'governance.roles.legal must be a non-empty list of owners. Use a user (@jane), a team (@acme/legal) or an email address.',
    ]);
  });

  it('refuses role names that do not make a safe lowercase directory', () => {
    // Act
    const problems = checkGovernanceConfig({
      roles: { Legal: ['@a'], con: ['@a'], '1st': ['@a'], ok: ['@a'] },
    });

    // Assert
    expect(problems).toHaveLength(3);
    expect(problems[0]).toContain('the role "Legal"');
    expect(problems[1]).toContain('the role "con"');
    expect(problems[2]).toContain('the role "1st"');
  });

  it(`allows at most ${MAX_GOVERNANCE_ROLES} roles`, () => {
    // Arrange
    const roles = Object.fromEntries(
      Array.from({ length: MAX_GOVERNANCE_ROLES + 1 }, (_, index) => [`role-${index}`, ['@a']])
    );

    // Act / Assert
    expect(checkGovernanceConfig({ roles })).toEqual([
      'governance.roles has 33 roles, at most 32 are allowed. Merge roles that the same teams review.',
    ]);
  });

  it('checks the shapes of roles, dataClasses and codeowners', () => {
    // Act
    const problems = checkGovernanceConfig({
      roles: ['legal'],
      dataClasses: 'pii',
      codeowners: { output: 'OWNERS', protect: [''], prompts: 'no', path: 'x' },
    });

    // Assert
    expect(problems).toEqual([
      'governance.roles must map role names to owner lists, like legal: ["@acme/legal"].',
      'governance.dataClasses must be a list of names, like [pii, financial].',
      'governance.codeowners has an unknown key "path". Use: output, protect, prompts.',
      'governance.codeowners.output is "OWNERS". Use one of: .github/CODEOWNERS, CODEOWNERS, docs/CODEOWNERS, .gitlab/CODEOWNERS.',
      'governance.codeowners.protect must be a list of paths, like [.github/workflows].',
      'governance.codeowners.prompts must be true or false.',
    ]);
  });

  it('refuses codeowners that is not a mapping', () => {
    // Act / Assert
    expect(checkGovernanceConfig({ codeowners: '.github/CODEOWNERS' })).toEqual([
      'governance.codeowners must be a mapping with output, protect or prompts.',
    ]);
  });
});
