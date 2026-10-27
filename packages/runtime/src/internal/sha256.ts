// Copy of packages/core/src/utils/sha256.ts. copies.spec.ts fails when the two drift.
const PRIMES: number[] = [];
let candidate = 2;
while (PRIMES.length < 64) {
  const n = candidate++;
  if (PRIMES.every((p) => n % p !== 0)) PRIMES.push(n);
}

/** First 32 bits of the fractional part of a root, as FIPS 180-4 defines the constants. */
function fractionBits(root: number): number {
  return Math.floor((root - Math.floor(root)) * 2 ** 32);
}

const INITIAL_HASH = Uint32Array.from(PRIMES.slice(0, 8), (p) => fractionBits(Math.sqrt(p)));
const ROUND_CONSTANTS = Uint32Array.from(PRIMES, (p) => fractionBits(Math.cbrt(p)));

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

/**
 * SHA-256 of a string, as 64 lowercase hex characters.
 *
 * The text is encoded as UTF-8 with `TextEncoder`, so a lone surrogate becomes U+FFFD.
 * Canonical JSON never holds one, because `canonicalizeJson` rejects lone surrogates. Pure TypeScript with no `node:crypto`, so it runs in the browser and
 * stays synchronous.
 *
 * @param text - Text to hash
 * @returns The digest in lowercase hex
 *
 * @example
 * sha256Hex('abc'); // 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
 */
export function sha256Hex(text: string): string {
  const data = new TextEncoder().encode(text);
  const padded = new Uint8Array(Math.ceil((data.length + 9) / 64) * 64);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor((data.length * 8) / 2 ** 32));
  view.setUint32(padded.length - 4, (data.length * 8) >>> 0);

  const state = Uint32Array.from(INITIAL_HASH);
  const w = new Uint32Array(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const w15 = w[i - 15]!;
      const w2 = w[i - 2]!;
      const s0 = rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3);
      const s1 = rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10);
      w[i] = w[i - 16]! + s0 + w[i - 7]! + s1;
    }
    let [a, b, c, d, e, f, g, h] = state as unknown as number[];
    for (let i = 0; i < 64; i++) {
      const t1 =
        h! +
        (rotr(e!, 6) ^ rotr(e!, 11) ^ rotr(e!, 25)) +
        ((e! & f!) ^ (~e! & g!)) +
        ROUND_CONSTANTS[i]! +
        w[i]!;
      const t2 = (rotr(a!, 2) ^ rotr(a!, 13) ^ rotr(a!, 22)) + ((a! & b!) ^ (a! & c!) ^ (b! & c!));
      h = g;
      g = f;
      f = e;
      e = (d! + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    [a, b, c, d, e, f, g, h].forEach((v, i) => {
      state[i] = state[i]! + v!;
    });
  }
  return Array.from(state, (v) => v.toString(16).padStart(8, '0')).join('');
}
