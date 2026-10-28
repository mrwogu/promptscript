import { describe, expect, it } from 'vitest';
import { inSequence } from './sequence.js';

describe('inSequence', () => {
  it('runs one step at a time and keeps the order of the results', async () => {
    // Arrange
    const started: number[] = [];
    let running = 0;
    let most = 0;
    const step = async (item: number): Promise<number> => {
      started.push(item);
      running++;
      most = Math.max(most, running);
      await new Promise((resolve) => setTimeout(resolve, 3 - item));
      running--;
      return item * 10;
    };

    // Act
    const results = await inSequence([1, 2, 3], step);

    // Assert
    expect(results).toEqual([10, 20, 30]);
    expect(started).toEqual([1, 2, 3]);
    expect(most).toBe(1);
  });

  it('gives an empty list for no items', async () => {
    // Arrange, Act
    const results = await inSequence([], () => Promise.resolve(1));

    // Assert
    expect(results).toEqual([]);
  });
});
