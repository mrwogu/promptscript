import { describe, expect, it } from 'vitest';
import { BLOCK_SHAPE_CONTRACTS } from '@promptscript/core';
import { parse } from '../index.js';

describe('block shape examples', () => {
  it.each(Object.entries(BLOCK_SHAPE_CONTRACTS))(
    'parses the canonical @%s diagnostic replacement',
    (_name, contract) => {
      const result = parse(contract.example);

      expect(result.errors).toEqual([]);
      expect(result.ast?.blocks).toHaveLength(1);
    }
  );
});
