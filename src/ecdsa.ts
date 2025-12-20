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
    let i = 0;
    while (b > 0n) {
        a[i] = Number(b & 0xffn);
        b >>= 8n;
        i++;
    }
    return a;
}

/**
 * Encode `B` of the most-significant bytes of a positive BigInt to a big-endian encoded Uint8Array.
 * @param {bigint} b - The postitive BigInt to encode.
 * @param {number} B - The number of bytes to encode.
 * @returns {Uint8Array} The big-endian encoded Uint8Array of the `B` most-significant bytes of `b`.
 */
function bigintToUint8Array_BE(b:bigint, B:number):Uint8Array {
    let i = 0;
    for (let c = b; c > 0n; i++, c >>= 8n);
    b = b >> ((i > B - 1 ? BigInt(i - B) : 0n) << 3n);
    i = Math.min(B - 1, i - 1);
    const a = new Uint8Array(B);
    while (b > 0n) {
        a[i] = Number(b & 0xffn);
        b >>= 8n;
        i--;
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

function _f6555a_(r:bigint, s:bigint) {
    return { r, s };
}

function _f34c7e_(_T:FiniteDomain, _d:bigint, _M:Uint8Array, _e:bigint, r:bigint, s:bigint, _R:FinitePoint) {
    return _f6555a_(r, s);
}

function _033399_(r:bigint, s:bigint, R:FinitePoint, n:bigint) {
    let v = 0n;
    v |= R.y! & 1n;
    v |= R.x! / n << 1n;
    if (s > n >> 1n) {
        s = n - s;
        v ^= 1n;
    }
    return { r, s, v };
}

function _30ecde_(T:FiniteDomain, _d:bigint, _M:Uint8Array, _e:bigint, r:bigint, s:bigint, R:FinitePoint) {
    return _033399_(r, s, R, T.n);
}

function _6dcb8a_<S>(T:FiniteDomain, _ef_:(M:Uint8Array)=>bigint, _7f_:(..._11_:any[])=>S) {
    return function(d:bigint, M:Uint8Array) {
        const nByteLength = (n => { let i = 0; while (n > 0n) { n >>= 8n; i++; } return i })(T.n);
        const zero = new Uint8Array(nByteLength);
        const K = new Uint8Array(nByteLength);
        const N = bigintToUint8Array_LE(T.n, nByteLength);
        const e = _ef_(M);
        const R = new FinitePoint();
        while (true) {
            do crypto.getRandomValues(K)
            while (compare(K, N) >= 0 || compare(K, zero) == 0);
            const k = uint8ArrayToBigint_LE(K, nByteLength);
            T.E.multiply(R, k, T.G);
            if (R.x === undefined) continue;
            const r = R.x % T.n;
            if (r == 0n) continue;
            const _77_ = T.F.multiply(r, d);
            const _68_ = T.F.add(e, _77_);
            const s = T.F.divide(_68_, k);
            if (s == 0n) continue;
            return _7f_(T, d, M, e, r, s, R);
        }
    }
}

function _2bfce0_<S extends { r:bigint, s:bigint }>(T:FiniteDomain, _32_:(M:Uint8Array)=>bigint) {
    return function*(S:S, M:Uint8Array) {
        const R = new FinitePoint();
        const nR = new FinitePoint();
        const eG = new FinitePoint();
        R.isIdentity = false;
        const e = _32_(M) % T.n;
        const inverseE = T.F.inverse(e);
        T.E.multiply(eG, inverseE, T.G);
        const reciprocalR = T.F.reciprocal(S.r);
        for (let j = 0n, jn = 0n; j <= T.h; j++, jn += T.n) {
            R.x = T.E.F.add(S.r, jn);
            T.E.solve(R);
            T.E.multiply(nR, T.n, R);
            if (!nR.isIdentity) continue;
            for (let k = 0; k < 2; k++) {
                const Qa = new FinitePoint();
                T.E.multiply(Qa, S.s, R);
                T.E.add(Qa, Qa, eG);
                T.E.multiply(Qa, reciprocalR, Qa);
                yield Qa;
                T.E.negate(R);
            }
        }
    };
}

function _560c92_<S extends { r:bigint, s:bigint, v:bigint }>(T:FiniteDomain, _d8_:(M:Uint8Array)=>bigint) {
    return function (S:S, M:Uint8Array) {
        const R = new FinitePoint();
        R.x = S.r + (S.v >> 1n) * T.n;
        T.E.solve(R);
        if (((S.v & 1n) ^ (R.y! & 1n)) != 0n) T.E.negate(R);
        const ir = T.F.reciprocal(R.x);
        const h = _d8_(M) % T.n;
        const u1 = T.F.multiply(T.F.inverse(h), ir);
        const u2 = T.F.multiply(S.s, ir);
        const u1G = T.E.multiply(new FinitePoint(), u1, T.G);
        const u2R = T.E.multiply(new FinitePoint(), u2, R)
        const Q = T.E.add(new FinitePoint(), u1G, u2R);
        return Q;
    }
}

function _66a7cf_<S extends { r: bigint; s: bigint; }, Q>(
    _42_:(..._cc_:any[])=>S,
    _dd_:(
        T:FiniteDomain,
        _ef_:(M:Uint8Array)=>bigint
    )=>(S:S, M:Uint8Array)=>Q
) {

    /**
    * The Ecdsa class. Static methods the general ECDSA signature scheme to be used.
    * Instances combine elliptic curve domain parameters, a hashing function,
    * and a hash length to simplify ECDSA algorithm operations.
    */
    return class Ecdsa {

        /**
         * A group of elliptic curve domain parameters as a FiniteDomain class instance.
         * @type {FiniteDomain}
         */
        T:FiniteDomain;

        /**
         * A function which converts a message into an integer.
         * @type {(M:Uint8Array)=>bigint}
         */
        _a7_:(M:Uint8Array)=>bigint;

        /**
         * Sign a message with a secret.
         * @param {bigint} d - A secret.
         * @param {Uint8Array} M - A message.
         * @returns An ECDSA signature.
         */
        sign:(d:bigint, M:Uint8Array)=>S;

        /**
         * Return the public point(s) given an ECDSA signature of a message.
         * @param {Signature} S - An ECDSA signature.
         * @param {Uint8Array} M - A message.
         */
        recover:(S:S, M:Uint8Array)=>Q;

        constructor(T:FiniteDomain, _a7_:(M:Uint8Array)=>bigint) {
            this.T = T;
            this._a7_ = _a7_;
            this.sign = _6dcb8a_(T, _a7_, _42_);
            this.recover = _dd_(T, _a7_);
        }

        /**
         * Verify a signed message was produced by an entity aware of a secret which generated point `Q`.
         * @param {FinitePoint} Q - A public point.
         * @param {S} S - An ECDSA signature.
         * @param {Uint8Array} M - A message.
         * @returns Whether or not the signature was produced by an entity aware of a secret which generated point `Q`.
         */
        verify(Q:FinitePoint, S:S, M:Uint8Array):boolean {
            if (S.r == 0n || S.r >= this.T.n) return false;
            if (S.s == 0n || S.s >= this.T.n) return false;
            const e = this._a7_(M);
            const eG = this.T.E.multiply(new FinitePoint(), e, this.T.G);
            const rQ = this.T.E.multiply(new FinitePoint(), S.r, Q);
            const R = this.T.E.add(new FinitePoint(), eG, rQ);
            this.T.divide(R, S.s, R);
            if (R.isIdentity) return false;
            return R.x! % this.T.n == S.r
        }

    }

}

export { _66a7cf_, _f34c7e_, _30ecde_, _2bfce0_, _560c92_ };