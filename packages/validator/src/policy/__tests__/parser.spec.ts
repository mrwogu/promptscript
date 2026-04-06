import { describe, it, expect } from 'vitest';
import type { PolicyDefinition } from '@promptscript/core';
import { parsePolicies } from '../parser.js';

describe('parsePolicies', () => {
  describe('empty / undefined input', () => {
    it('returns empty result for undefined input', () => {
      // Arrange / Act
      const result = parsePolicies(undefined);

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('returns empty result for empty array', () => {
      // Arrange / Act
      const result = parsePolicies([]);

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toEqual([]);
    });
  });

  describe('valid policies', () => {
    it('parses a valid layer-boundary policy', () => {
      // Arrange
      const input: PolicyDefinition[] = [
        {
          name: 'enforce-layers',
          kind: 'layer-boundary',
          severity: 'error',
          layers: ['base', 'domain', 'app'],
          maxDistance: 2,
        },
      ];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.errors).toEqual([]);
      expect(result.policies).toHaveLength(1);
      expect(result.policies[0]).toMatchObject({
        name: 'enforce-layers',
        kind: 'layer-boundary',
        severity: 'error',
        layers: ['base', 'domain', 'app'],
        maxDistance: 2,
      });
    });

    it('parses a valid property-protection policy', () => {
      // Arrange
      const input: PolicyDefinition[] = [
        {
          name: 'protect-model',
          kind: 'property-protection',
          severity: 'warning',
          properties: ['model', 'temperature'],
          targetPattern: '@core/*',
        },
      ];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.errors).toEqual([]);
      expect(result.policies).toHaveLength(1);
      expect(result.policies[0]).toMatchObject({
        name: 'protect-model',
        kind: 'property-protection',
        severity: 'warning',
        properties: ['model', 'temperature'],
        targetPattern: '@core/*',
      });
    });

    it('parses a valid registry-allowlist policy', () => {
      // Arrange
      const input: PolicyDefinition[] = [
        {
          name: 'allow-registries',
          kind: 'registry-allowlist',
          severity: 'error',
          allowed: ['@company', '@trusted'],
        },
      ];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.errors).toEqual([]);
      expect(result.policies).toHaveLength(1);
      expect(result.policies[0]).toMatchObject({
        name: 'allow-registries',
        kind: 'registry-allowlist',
        severity: 'error',
        allowed: ['@company', '@trusted'],
      });
    });

    it('preserves description on all policy kinds', () => {
      // Arrange
      const input: PolicyDefinition[] = [
        {
          name: 'lb',
          kind: 'layer-boundary',
          severity: 'error',
          description: 'Layer desc',
          layers: ['@a', '@b'],
        },
        {
          name: 'pp',
          kind: 'property-protection',
          severity: 'warning',
          description: 'Prop desc',
          properties: ['content'],
        },
        {
          name: 'ra',
          kind: 'registry-allowlist',
          severity: 'error',
          description: 'Reg desc',
          allowed: ['@a'],
        },
      ];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.errors).toEqual([]);
      expect(result.policies).toHaveLength(3);
      expect(result.policies[0]!.description).toBe('Layer desc');
      expect(result.policies[1]!.description).toBe('Prop desc');
      expect(result.policies[2]!.description).toBe('Reg desc');
    });

    it('defaults maxDistance to 1 when not specified for layer-boundary', () => {
      // Arrange
      const input: PolicyDefinition[] = [
        {
          name: 'strict-layers',
          kind: 'layer-boundary',
          severity: 'error',
          layers: ['base', 'app'],
        },
      ];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.errors).toEqual([]);
      expect(result.policies).toHaveLength(1);
      expect(result.policies[0]?.kind).toBe('layer-boundary');
      expect((result.policies[0] as { maxDistance?: number } | undefined)?.maxDistance).toBe(1);
    });
  });

  describe('validation errors', () => {
    it('returns an error for missing name', () => {
      // Arrange
      const input = [
        {
          kind: 'layer-boundary',
          severity: 'error',
          layers: ['base', 'app'],
        },
      ] as unknown as PolicyDefinition[];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('missing required "name" field');
    });

    it('returns an error for unknown kind', () => {
      // Arrange
      const input = [
        {
          name: 'bad-policy',
          kind: 'not-a-kind',
          severity: 'error',
        },
      ] as unknown as PolicyDefinition[];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('unknown kind');
      expect(result.errors[0]).toContain('bad-policy');
    });

    it('returns an error for duplicate policy names', () => {
      // Arrange
      const input: PolicyDefinition[] = [
        {
          name: 'my-policy',
          kind: 'registry-allowlist',
          severity: 'error',
          allowed: ['@company'],
        },
        {
          name: 'my-policy',
          kind: 'registry-allowlist',
          severity: 'warning',
          allowed: ['@other'],
        },
      ];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.policies).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('duplicate policy name');
      expect(result.errors[0]).toContain('my-policy');
    });

    it('returns an error for layer-boundary with fewer than 2 layers', () => {
      // Arrange
      const input: PolicyDefinition[] = [
        {
          name: 'thin-layers',
          kind: 'layer-boundary',
          severity: 'error',
          layers: ['only-one'],
        },
      ];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('thin-layers');
      expect(result.errors[0]).toContain('at least 2 entries');
    });

    it('returns an error for property-protection with empty properties array', () => {
      // Arrange
      const input = [
        {
          name: 'empty-props',
          kind: 'property-protection',
          severity: 'error',
          properties: [],
        },
      ] as unknown as PolicyDefinition[];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('empty-props');
      expect(result.errors[0]).toContain('"properties"');
    });

    it('returns an error for registry-allowlist with empty allowed array', () => {
      // Arrange
      const input = [
        {
          name: 'empty-allowlist',
          kind: 'registry-allowlist',
          severity: 'error',
          allowed: [],
        },
      ] as unknown as PolicyDefinition[];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('empty-allowlist');
      expect(result.errors[0]).toContain('"allowed"');
    });

    it('returns an error for non-object input', () => {
      // Arrange
      const input = ['not-an-object'] as unknown as PolicyDefinition[];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('must be an object');
    });

    it('returns an error for invalid severity', () => {
      // Arrange
      const input = [
        {
          name: 'bad-severity',
          kind: 'registry-allowlist',
          severity: 'fatal',
          allowed: ['@a'],
        },
      ] as unknown as PolicyDefinition[];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('invalid severity');
    });

    it('returns an error for invalid maxDistance', () => {
      // Arrange
      const input = [
        {
          name: 'bad-dist',
          kind: 'layer-boundary',
          severity: 'error',
          layers: ['@a', '@b'],
          maxDistance: -1,
        },
      ] as unknown as PolicyDefinition[];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.policies).toEqual([]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('maxDistance');
    });

    it('continues validating remaining policies when one fails', () => {
      // Arrange
      const input = [
        {
          name: 'bad-policy',
          kind: 'unknown-kind',
          severity: 'error',
        },
        {
          name: 'good-policy',
          kind: 'registry-allowlist',
          severity: 'error',
          allowed: ['@company'],
        },
      ] as unknown as PolicyDefinition[];

      // Act
      const result = parsePolicies(input);

      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.policies).toHaveLength(1);
      expect(result.policies[0]).toMatchObject({ name: 'good-policy' });
    });
  });
});
