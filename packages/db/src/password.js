import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// scrypt parameters. N=2^15 is a sensible interactive-login cost.
// maxmem must be raised above Node's 32 MB default to fit N=32768 (~32 MB).
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;
const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: MAXMEM };

/**
 * Hash a plaintext password. Returns a self-describing string:
 *   scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>
 * so the verifier doesn't need to know the parameters out of band.
 *
 * @param {string} password
 * @returns {string}
 */
export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, SCRYPT_PARAMS);
  const { N, r, p } = SCRYPT_PARAMS;
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/**
 * Verify a plaintext password against a stored hash. Constant-time.
 *
 * @param {string} password
 * @param {string} stored value produced by {@link hashPassword}
 * @returns {boolean}
 */
export function verifyPassword(password, stored) {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const [, N, r, p, saltHex, hashHex] = parts;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, salt, expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
      maxmem: MAXMEM,
    });
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}
