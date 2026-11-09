// Deterministic numbers from integers: a hash, not a stream, so any sample can
// be computed on its own (a restarted feed, another build, a test) and comes
// out the same.

/** A 32-bit hash of the arguments (integers), in [0, 1). */
export function hash01(...xs: number[]): number {
  let h = 0x9e3779b9;
  for (const x of xs) {
    // Split the value so integers above 2^32 (sample indexes) hash fully.
    const lo = x >>> 0;
    const hi = Math.floor(x / 4_294_967_296) >>> 0;
    for (const v of [lo, hi]) {
      h = Math.imul(h ^ v, 0x85ebca6b);
      h ^= h >>> 13;
      h = Math.imul(h, 0xc2b2ae35);
      h ^= h >>> 16;
    }
  }
  return (h >>> 0) / 4_294_967_296;
}

/** A standard normal value from the hash (Box-Muller). */
export function gauss(...xs: number[]): number {
  const u = Math.max(hash01(...xs, 1), 1e-12);
  const v = hash01(...xs, 2);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
