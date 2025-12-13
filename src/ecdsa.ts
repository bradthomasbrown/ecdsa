import { FinitePoint } from "@bradthomasbrown/finite-curve";
import { FiniteDomain } from "@bradthomasbrown/finite-domain";

/**
 * Compare two Uint8Arrays as if they were encodings of little-endian positive integers.
 * @param {Uint8Array} a - The first Uint8Array in the comparison operation.
 * @param {Uint8Array} b - The second Uint8Array in the comparison operation.
 * @returns {number} { -1:a<b, 0:a=b, 1:a>b }
 */
function compare(a:Uint8Array, b:Uint8Array):number {
    for (let i = a.byteLength - 1; i >= 0; i--) {
        if (a[i]! > b[i]!) return 1;
        if (a[i]! < b[i]!) return -1;
    }
    return 0;
}

/**
 * Encode `B` of the least-significant bytes of a positive BigInt to a little-endian encoded Uint8Array.
 * @param {bigint} b - The postitive BigInt to encode.
 * @param {number} B - The number of bytes to encode.
 * @returns {Uint8Array} The little-endian encoded Uint8Array of the `B` least-significant bytes of `b`.
 */
function bigintToUint8Array_LE(b:bigint, B:number):Uint8Array {
    const a = new Uint8Array(B);
    let _1a_ = 0;
    while (b > 0n) {
        a[_1a_] = Number(b & 0xffn);
        b >>= 8n;
        _1a_++;
    }
    return a;
}

/**
 * Decode `B` of the least-significant bytes of a little-endian encoded Uint8Array to a positive BigInt.
 * @param {bigint} a - The Uint8Array to decode.
 * @param {number|undefined} B - The number of bytes to decode, or undefined if decoding all bytes.
 * @returns {bigint} The decoded BigInt.
 */
function uint8ArrayToBigint_LE(a:Uint8Array, B?:number):bigint {
    let b = 0n;
    for (let i = 0; i < Math.min(a.byteLength, B ?? a.byteLength); i++)
        b += BigInt(a[i]!) << (BigInt(i) << 3n);
    return b;
}

/**
 * The Signature class, representing an ECDSA signature.
 */
class Signature {

    /**
     * Parameter `r` of the signature.
     * @type {bigint}
     */
    r:bigint

    /**
     * Parameter `s` of the signature.
     * @type {bigint}
     */
    s:bigint


    constructor(r:bigint, s:bigint) {
        this.r = r;
        this.s = s;
    }

}

/**
 * The Ecdsa class. Static methods the general ECDSA signature scheme to be used.
 * Instances combine elliptic curve domain parameters, a hashing function,
 * and a hash length to simplify ECDSA algorithm operations.
 */
class Ecdsa {

    /**
     * A group of elliptic curve domain parameters as a FiniteDomain class instance.
     * @type {FiniteDomain}
     */
    T:FiniteDomain

    /**
     * A hashing function.
     * @type {(M:Uint8Array)=>Uint8Array}
     */
    Hash:(M:Uint8Array)=>Uint8Array

    /**
     * The length of bytes to use from a hash. (little-endian?)
     * @type {number}
     */
    hashlen:number

    constructor(T:FiniteDomain, Hash:(M:Uint8Array)=>Uint8Array, hashlen:number) {
        this.T = T;
        this.Hash = Hash;
        this.hashlen = hashlen;
    }

    /**
     * Sign a hash with a secret.
     * @param {Uint8Array} H - A hash.
     * @param {bigint} d - A secret.
     * @returns An ECDSA signature.
     */
    sign(H:Uint8Array, d:bigint):Signature {
        return Ecdsa.sign(this.T, H, d, this.hashlen);
    }

    /**
     * Verify a signature was produced by an entity aware of a secret which generated point `Q`.
     * @param {FinitePoint} Q - A public point.
     * @param {Signature} S - An ECDSA signature.
     * @param {Uint8Array} H - A hashed message.
     * @returns Whether or not the signature was produced by an entity aware of a secret which generated point `Q`.
     */
    verify(Q:FinitePoint, S:Signature, H:Uint8Array):boolean {
        return Ecdsa.verify(Q, this.T, S, H, this.hashlen);
    }

    /**
     * Yield the potential public points which may have produced an ECDSA signature.
     * - Note: Assumes the elliptic curve of the domain parameters is over a finite field whose order is
     * equivalent to 3 mod 4.
     * @param {Signature} S - An ECDSA signature.
     * @param {Uint8Array} H - A hashed message.
     * @yields {FinitePoint} The potential public points which may have produced the ECDSA signature.
     */
    recover_p3mod4(S:Signature, H:Uint8Array):Generator<FinitePoint> {
        return Ecdsa.recover_p3mod4(this.T, S, H, this.hashlen);
    }

    /**
     * Sign a hashed message given elliptical domain parameters, a secret, and the number of bytes to use from the hash.
     * @param {FiniteDomain} T - A group of elliptic curve domain parameters as a FiniteDomain class instance.
     * @param {Uint8Array} H - A hashed message as a Uint8Array.
     * @param {bigint} d - A secret.
     * @param {number} hashlen - The number of bytes to use from the hashed message.
     * @returns {Signature} An ECDSA signature.
     */
    static sign(T:FiniteDomain, H:Uint8Array, d:bigint, hashlen:number):Signature {
        const zero = new Uint8Array(hashlen);
        const K = new Uint8Array(hashlen);
        const N = bigintToUint8Array_LE(T.n, hashlen);
        const e = uint8ArrayToBigint_LE(H, hashlen);
        const R = new FinitePoint();
        while (true) {
            do crypto.getRandomValues(K)
            while (compare(K, N) == 1 || compare(K, zero) == 0);
            const k = uint8ArrayToBigint_LE(K, hashlen);
            T.E.multiply(R, k, T.G);
            if (R.x === undefined) continue;
            const r = R.x % T.n;
            if (r == 0n) continue;
            const _77_ = T.F.multiply(r, d);
            const _68_ = T.F.add(e, _77_);
            const s = T.F.divide(_68_, k);
            if (s == 0n) continue;
            return new Signature(r, s);
        }
    }

    /**
     * Verify a signature was produced by an entity aware of a secret which generated point `Q`.
     * @param {FinitePoint} Q - A public point.
     * @param {FiniteDomain} T - A group of elliptic curve domain parameters as a FiniteDomain class instance.
     * @param {Signature} S - An ECDSA signature.
     * @param {Uint8Array} H - A hashed message.
     * @param {number} hashlen - The number of bytes to use from the hashed message.
     * @returns Whether or not the signature was produced by an entity aware of a secret which generated point `Q`.
     */
    static verify(Q:FinitePoint, T:FiniteDomain, S:Signature, H:Uint8Array, hashlen:number):boolean {
        if (S.r == 0n || S.r >= T.n) return false;
        if (S.s == 0n || S.s >= T.n) return false;
        const e = uint8ArrayToBigint_LE(H, hashlen);
        const eG = T.E.multiply(new FinitePoint(), e, T.G);
        const rQ = T.E.multiply(new FinitePoint(), S.r, Q);
        const R = T.E.add(new FinitePoint(), eG, rQ);
        T.divide(R, S.s, R);
        if (R.isIdentity) return false;
        return R.x! % T.n == S.r
    }

    /**
     * Yield the potential public points which may have produced an ECDSA signature.
     * - Note: Assumes the elliptic curve of the domain parameters is over a finite field whose order is
     * equivalent to 3 mod 4.
     * @param {FiniteDomain} T - A group of elliptic curve domain parameters as a FiniteDomain class instance.
     * @param {Signature} S - An ECDSA signature.
     * @param {Uint8Array} H - A hashed message.
     * @param {number} hashlen - The number of bytes to use from the hashed message.
     * @yields {FinitePoint} The potential public points which may have produced the ECDSA signature.
     */
    static* recover_p3mod4(T:FiniteDomain, S:Signature, H:Uint8Array, hashlen:number):Generator<FinitePoint> {
        const R = new FinitePoint();
        const nR = new FinitePoint();
        const eG = new FinitePoint();
        R.isIdentity = false;
        for (let j = 0n; j <= T.h; j++) {
            const jn = j * T.n;
            R.x = T.E.F.add(S.r, jn);
            T.E.solve_p3mod4(R);
            T.E.multiply(nR, T.n, R);
            if (!nR.isIdentity) continue;
            const e = uint8ArrayToBigint_LE(H, hashlen);
            const reciprocalR = T.F.reciprocal(S.r);
            const inverseE = T.F.inverse(e);
            T.E.multiply(eG, inverseE, T.G);
            for (let k = 0; k < 2; k++) {
                const Qa = new FinitePoint();
                T.E.multiply(Qa, S.s, R);
                T.E.add(Qa, Qa, eG);
                T.E.multiply(Qa, reciprocalR, Qa);
                yield Qa;
                T.E.negate(R);
            }
        }
    }

}