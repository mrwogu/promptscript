/**
 * Run `step` on each item, one after the other, and collect the results in order. The audit
 * steps carry state from commit to commit and each may start a Git process, so they never
 * run in parallel.
 */
export function inSequence<T, R>(items: readonly T[], step: (item: T) => Promise<R>): Promise<R[]> {
  return items.reduce<Promise<R[]>>(async (done, item) => {
    const results = await done;
    results.push(await step(item));
    return results;
  }, Promise.resolve([]));
}
