import { describe, expect, it } from 'vitest';
import type { LockfileDependency } from '@promptscript/core';
import {
  calculateManagedSkillIntegrity,
  PENDING_INTEGRITY,
  refreshManagedSkillOwnerIntegrity,
} from '../skill-lock-integrity.js';

const FIRST_INTEGRITY = `sha256-${'a'.repeat(64)}`;
const SECOND_INTEGRITY = `sha256-${'b'.repeat(64)}`;
const EXPECTED_AGGREGATE =
  'sha256-9761de7a372bdc7e0acbbba10dd4b2f095eb9a00edb353f3bf620e0139a75e74';

function dependency(integrity: string, source: 'md' | undefined = 'md'): LockfileDependency {
  return {
    version: 'v1.0.0',
    commit: 'a'.repeat(40),
    integrity,
    ...(source ? { source } : {}),
  };
}

describe('skill lock integrity', () => {
  it('produces the same aggregate for different child insertion orders', () => {
    const firstChild = 'github.com/org/repo/skills/first';
    const secondChild = 'github.com/org/repo/skills/second';
    const firstDependencies = {
      [firstChild]: dependency(FIRST_INTEGRITY),
      [secondChild]: dependency(SECOND_INTEGRITY),
    };
    const secondDependencies = {
      [secondChild]: dependency(SECOND_INTEGRITY),
      [firstChild]: dependency(FIRST_INTEGRITY),
    };

    const firstHash = calculateManagedSkillIntegrity(firstDependencies, [firstChild, secondChild]);
    const secondHash = calculateManagedSkillIntegrity(secondDependencies, [
      secondChild,
      firstChild,
    ]);

    expect(firstHash).toBe(EXPECTED_AGGREGATE);
    expect(secondHash).toBe(EXPECTED_AGGREGATE);
  });

  it('keeps the pending marker when a child is missing or incomplete', () => {
    const child = 'github.com/org/repo/skills/child';

    expect(calculateManagedSkillIntegrity({}, [child])).toBe(PENDING_INTEGRITY);
    expect(calculateManagedSkillIntegrity({ [child]: dependency('sha256-pending') }, [child])).toBe(
      PENDING_INTEGRITY
    );
  });

  it('refreshes only managed Markdown owners', () => {
    const child = 'github.com/org/repo/skills/child';
    const managedOwner = 'https://github.com/org/repo';
    const leaf = 'github.com/org/repo/skills/leaf';
    const registry = 'github.com/other/repo';
    const dependencies: Record<string, LockfileDependency> = {
      [child]: dependency(FIRST_INTEGRITY),
      [managedOwner]: {
        ...dependency(PENDING_INTEGRITY),
        skills: [child],
      },
      [leaf]: dependency(SECOND_INTEGRITY),
      [registry]: {
        ...dependency(PENDING_INTEGRITY),
        source: undefined,
      },
    };

    refreshManagedSkillOwnerIntegrity(dependencies);

    expect(dependencies[managedOwner]!.integrity).toMatch(/^sha256-[0-9a-f]{64}$/);
    expect(dependencies[leaf]!.integrity).toBe(SECOND_INTEGRITY);
    expect(dependencies[registry]!.integrity).toBe(PENDING_INTEGRITY);
  });
});
