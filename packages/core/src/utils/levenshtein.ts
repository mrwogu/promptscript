/**
 * Calculate the Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost
      );
    }
  }

  return matrix[b.length]![a.length]!;
}

/**
 * Find the closest match from a list of candidates.
 *
 * @param input - The input string to match
 * @param candidates - List of candidate strings
 * @param maxDistance - Maximum Levenshtein distance (default: 2)
 * @returns The closest match and its distance, or undefined if none within threshold
 */
export function findClosestMatch(
  input: string,
  candidates: readonly string[],
  maxDistance = 2
): { match: string; distance: number } | undefined {
  let best: { match: string; distance: number } | undefined;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(input, candidate);
    if (distance <= maxDistance && (!best || distance < best.distance)) {
      best = { match: candidate, distance };
    }
  }

  return best;
}
