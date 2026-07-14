/**
 * Tests BrowserResolver error handling when resolveSkillComposition
 * throws a non-ResolveError (covers the else branch in resolveComposition catch).
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('../skill-composition.js', () => ({
  resolveSkillComposition: vi.fn().mockRejectedValue(new TypeError('composition engine error')),
}));

import { BrowserResolver } from '../resolver.js';
import { VirtualFileSystem } from '../virtual-fs.js';

describe('BrowserResolver — non-ResolveError from skill composition', () => {
  it('wraps TypeError into ResolveError with "Skill composition failed" message', async () => {
    const fs = new VirtualFileSystem({
      'project.prs': `@meta { id: "test" syntax: "1.2.0" }
@skills {
  deploy: {
    content: """test"""
  }
}`,
    });
    const resolver = new BrowserResolver({ fs });
    const result = await resolver.resolve('project.prs');

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.message).toContain('Skill composition failed');
    expect(result.errors[0]!.message).toContain('composition engine error');
  });
});
