import { describe, it, expect } from 'vitest';
import { TARGET_DEFINITIONS } from '@promptscript/core';
import { TARGET_LABELS } from '../target-labels';

describe('TARGET_LABELS', () => {
  it('names every target of the catalog and nothing else', () => {
    expect(Object.keys(TARGET_LABELS).sort()).toEqual(Object.keys(TARGET_DEFINITIONS).sort());
  });

  it('reads a label that holds spaces', () => {
    expect(TARGET_LABELS['deep-agents']).toBe('Deep Agents');
  });
});
