# keccak
This is a simple, minimal implementation of the elliptic curve digital signature algorithms in TypeScript/JavaScript. 

## Why?
There is surprisingly little information on all aspects of the "cryptographic stack" in JavaScript and elsewhere that is simple and minimal. This repository is part of a series of repositories that builds up this stack from first principles, including:
- [Finite field arithmetic](https://github.com/bradthomasbrown/finite-field)
- [Elliptic curves over finite fields](https://github.com/bradthomasbrown/finite-curve)
- [Sponge constructions and Keccak](https://github.com/bradthomasbrown/keccak)
- [Elliptic curve domain parameters](https://github.com/bradthomasbrown/finite-domain)
- Elliptic curve digital signature algorithms (this repository)
- Interacting with EVM nodes
- And potentially more

## Installation
These should be installed when you install the `ecdsa` package, but this is listed here for completeness.
- [@bradthomasbrown/finite-field]
- [@bradthomasbrown/finite-curve]
```sh
npm i @bradthomasbrown/ecdsa
```

## Usage
```js
import { secp256k1 } from "@bradthomasbrown/finite-domain/domains";
import { keccak_c, sha_3 } from "@bradthomasbrown/keccak";

const keccak256 = sha_3(keccak_c, 512, 0b0, 0);
const encoder = new TextEncoder();
const ecdsa_keccak256 = new Ecdsa(secp256k1, keccak256, 32);
const generateSecret = (B:number) => uint8ArrayToBigint_LE(crypto.getRandomValues(new Uint8Array(B)));

// sign
let Qu = undefined;
let S = undefined;
{
    const d = generateSecret(32);
    Qu = secp256k1.public(d);
    const H = keccak256(encoder.encode("hello world"));
    S = ecdsa_keccak256.sign(H, d);
    console.log({ Qu, H, S });
}

// verify
{
    const H = keccak256(encoder.encode("hello world"));
    const verified = ecdsa_keccak256.verify(Qu, S, H);
    console.log({ verified });
    // { verified: true }
}

// recover
{
    const H = keccak256(encoder.encode("hello world"));
    for (const Qa of ecdsa_keccak256.recover_p3mod4(S, H)) {
        const equal = Qa.equals(Qu);
        console.log({ equal, Qa });
        // { equal: true: Qa: ... } for some Qa of recover_p3mod4 
    }
}
```