import { secp256k1 } from "@bradthomasbrown/finite-domain/domains";
import { sha_3, keccak_c } from "@bradthomasbrown/keccak";
import { _66a7cf_, _f34c7e_, _2bfce0_, _30ecde_, _560c92_ } from "../ecdsa.js";

const keccak256 = sha_3(keccak_c, 512, 0b0, 0);

/**
 * Decode `B` of the most-significant bytes of a big-endian encoded Uint8Array to a positive BigInt.
 * @param {bigint} a - The Uint8Array to decode.
 * @param {number|undefined} B - The number of bytes to decode, or undefined if decoding all bytes.
 * @returns {bigint} The decoded BigInt.
 */
function uint8ArrayToBigint_BE(a:Uint8Array, B?:number):bigint {
    let b = 0n;
    for (let i = 0; i < Math.min(a.byteLength, B ?? a.byteLength); i++)
        b = (b << 8n) + BigInt(a[i]!);
    return b;
}

const _23dee7_ = (M:Uint8Array):bigint => uint8ArrayToBigint_BE(keccak256(M));

const EcdsaSec = _66a7cf_(_f34c7e_, _2bfce0_);
const EcdsaFastRecover = _66a7cf_(_30ecde_, _560c92_);

// ECDSA, secp256k1, keccak-256, SEC paper close equivalent, big-endian
const _1cfc0a_ = new EcdsaSec(secp256k1, _23dee7_);

// ECDSA, secp256k1, keccak-256, fast recovery, big-endian
const _6aab57_ = new EcdsaFastRecover(secp256k1, _23dee7_);

export { EcdsaSec, EcdsaFastRecover, _1cfc0a_, _6aab57_ };