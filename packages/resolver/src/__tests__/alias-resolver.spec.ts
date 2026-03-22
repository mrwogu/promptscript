import { describe, it, expect } from 'vitest';
import { expandAlias, validateAlias, validateRegistriesConfig } from '../alias-resolver.js';
import { UnknownAliasError } from '@promptscript/core';

describe('alias-resolver', () => {
  describe('validateAlias', () => {
    it('should accept valid lowercase alias names', () => {
      expect(validateAlias('@acme')).toBe(true);
      expect(validateAlias('@my-org')).toBe(true);
      expect(validateAlias('@company123')).toBe(true);
      expect(validateAlias('@a')).toBe(true);
      expect(validateAlias('@abc-def-ghi')).toBe(true);
    });

    it('should reject aliases with uppercase letters', () => {
      expect(validateAlias('@Acme')).toBe(false);
      expect(validateAlias('@ACME')).toBe(false);
      expect(validateAlias('@myOrg')).toBe(false);
    });

    it('should reject aliases missing the @ prefix', () => {
      expect(validateAlias('acme')).toBe(false);
      expect(validateAlias('company')).toBe(false);
    });

    it('should reject bare @ with no name', () => {
      expect(validateAlias('@')).toBe(false);
    });

    it('should reject aliases with underscores or special characters', () => {
      expect(validateAlias('@my_org')).toBe(false);
      expect(validateAlias('@my.org')).toBe(false);
      expect(validateAlias('@my org')).toBe(false);
    });
  });

  describe('validateRegistriesConfig', () => {
    it('should accept a valid config with string URLs', () => {
      const result = validateRegistriesConfig({
        '@acme': 'https://github.com/acme/prs-standards.git',
        '@internal': 'git@gitlab.internal.com:company/prs-base.git',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept a valid config with extended entries', () => {
      const result = validateRegistriesConfig({
        '@acme': { url: 'https://github.com/acme/monorepo.git', root: 'packages/prs' },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept a valid config with extended entries without root', () => {
      const result = validateRegistriesConfig({
        '@acme': { url: 'https://github.com/acme/prs-standards.git' },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty config', () => {
      const result = validateRegistriesConfig({});
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/empty/i);
    });

    it('should reject invalid alias names', () => {
      const result = validateRegistriesConfig({
        '@Acme': 'https://github.com/acme/prs-standards.git',
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/@Acme/);
      expect(result.errors[0]).toMatch(/lowercase/i);
    });

    it('should reject entries with empty string URLs', () => {
      const result = validateRegistriesConfig({
        '@acme': '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/@acme/);
      expect(result.errors[0]).toMatch(/non-empty URL/i);
    });

    it('should reject extended entries with empty url field', () => {
      const result = validateRegistriesConfig({
        '@acme': { url: '' },
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/@acme/);
      expect(result.errors[0]).toMatch(/url/i);
    });

    it('should collect multiple errors', () => {
      const result = validateRegistriesConfig({
        '@Acme': '',
        '@Internal': { url: '' },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('expandAlias', () => {
    it('should expand a simple alias with subpath', () => {
      // Arrange
      const registries = {
        '@acme': 'https://github.com/acme/prs-standards.git',
      };

      // Act
      const result = expandAlias('@acme/standards/security', registries);

      // Assert
      expect(result).toEqual({
        repoUrl: 'https://github.com/acme/prs-standards.git',
        path: 'standards/security',
        version: undefined,
      });
    });

    it('should expand an alias with a version suffix', () => {
      // Arrange
      const registries = {
        '@acme': 'https://github.com/acme/prs-standards.git',
      };

      // Act
      const result = expandAlias('@acme/standards/security@1.2.0', registries);

      // Assert
      expect(result).toEqual({
        repoUrl: 'https://github.com/acme/prs-standards.git',
        path: 'standards/security',
        version: '1.2.0',
      });
    });

    it('should expand an alias with a v-prefixed version suffix', () => {
      // Arrange
      const registries = {
        '@acme': 'https://github.com/acme/prs-standards.git',
      };

      // Act
      const result = expandAlias('@acme/base@v2.0.0-beta.1', registries);

      // Assert
      expect(result).toEqual({
        repoUrl: 'https://github.com/acme/prs-standards.git',
        path: 'base',
        version: 'v2.0.0-beta.1',
      });
    });

    it('should prepend root to subpath for extended entries with root', () => {
      // Arrange
      const registries = {
        '@internal': {
          url: 'git@gitlab.internal.com:company/monorepo.git',
          root: 'packages/prs',
        },
      };

      // Act
      const result = expandAlias('@internal/auth', registries);

      // Assert
      expect(result).toEqual({
        repoUrl: 'git@gitlab.internal.com:company/monorepo.git',
        path: 'packages/prs/auth',
        version: undefined,
      });
    });

    it('should prepend root with version for extended entries', () => {
      // Arrange
      const registries = {
        '@internal': {
          url: 'git@gitlab.internal.com:company/monorepo.git',
          root: 'packages/prs',
        },
      };

      // Act
      const result = expandAlias('@internal/auth@1.0.0', registries);

      // Assert
      expect(result).toEqual({
        repoUrl: 'git@gitlab.internal.com:company/monorepo.git',
        path: 'packages/prs/auth',
        version: '1.0.0',
      });
    });

    it('should resolve root-only path when no subpath given', () => {
      // Arrange
      const registries = {
        '@internal': {
          url: 'git@gitlab.internal.com:company/monorepo.git',
          root: 'packages/prs',
        },
      };

      // Act
      const result = expandAlias('@internal', registries);

      // Assert
      expect(result).toEqual({
        repoUrl: 'git@gitlab.internal.com:company/monorepo.git',
        path: 'packages/prs',
        version: undefined,
      });
    });

    it('should resolve single-segment alias (no subpath) for string entry', () => {
      // Arrange
      const registries = {
        '@acme': 'https://github.com/acme/prs-standards.git',
      };

      // Act
      const result = expandAlias('@acme', registries);

      // Assert
      expect(result).toEqual({
        repoUrl: 'https://github.com/acme/prs-standards.git',
        path: '',
        version: undefined,
      });
    });

    it('should throw UnknownAliasError for unknown alias', () => {
      // Arrange
      const registries = {
        '@acme': 'https://github.com/acme/prs-standards.git',
      };

      // Act & Assert
      expect(() => expandAlias('@unknown/path', registries)).toThrow(UnknownAliasError);
    });

    it('should include the alias name in the UnknownAliasError', () => {
      // Arrange
      const registries = {
        '@acme': 'https://github.com/acme/prs-standards.git',
      };

      // Act & Assert
      expect(() => expandAlias('@missing/path', registries)).toThrow(
        expect.objectContaining({ alias: '@missing' })
      );
    });

    it('should throw UnknownAliasError for empty registries config', () => {
      // Act & Assert
      expect(() => expandAlias('@acme/base', {})).toThrow(UnknownAliasError);
    });

    it('should expand an extended entry without root', () => {
      // Arrange
      const registries = {
        '@acme': { url: 'https://github.com/acme/prs-standards.git' },
      };

      // Act
      const result = expandAlias('@acme/security', registries);

      // Assert
      expect(result).toEqual({
        repoUrl: 'https://github.com/acme/prs-standards.git',
        path: 'security',
        version: undefined,
      });
    });
  });
});
