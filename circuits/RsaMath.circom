pragma circom 2.0.0;
include "./lib/fp.circom";
include "./Pkcs1Pad.circom";

// calculate a*a mod m
template SquareMod(n, k) {
    signal input a[k];
    signal input m[k];

    signal output r[k];

    component mulMod = FpMul(n, k);
    mulMod.a <== a;
    mulMod.b <== a;
    mulMod.p <== m;
    mulMod.out ==> r;
}

// rsa signature equation left
// sig^65537 mod (modulus)
template SigVerLeft(keySize, n, k) {
    signal input sig[k];
    signal input modulus[k];

    signal output out[k];

    // square --> s^2
    // square(square()) --> s^4
    // square 16 times -->  s^16 = s^65536
    // s^65536 * s --> s^65537

    component squareModComp[16];
    signal result[17][k];
    result[0] <== sig;

    for(var i = 0; i < 16; i++) {
        squareModComp[i] = SquareMod(n, k);
        squareModComp[i].a <== result[i];
        squareModComp[i].m <== modulus;
        squareModComp[i].r ==> result[i+1];
    }

    component mulModComp = FpMul(n, k);
    mulModComp.a <== result[16];
    mulModComp.b <== sig;
    mulModComp.p <== modulus;
    mulModComp.out ==> out;
}

// rsa signature equation left
// pkcs1 padded hashed message
template SigVerRight(keySize, n, k) {

    signal input hash[256];
    signal output out[k];

    component pkcs1PadComp = Pkcs1Pad(keySize);
    pkcs1PadComp.digest <== hash;

    component bits2NumComp[k];
    for (var i = 0; i < k; i++) {
        bits2NumComp[i] = Bits2Num(n);
        for (var j = 0; j < n; j++) {
            var index = i*n+j;
            if (index < keySize) {
                bits2NumComp[i].in[j] <== pkcs1PadComp.padded[i*n+j];
            } else {
                bits2NumComp[i].in[j] <== 0;
            }
        }
        out[i] <== bits2NumComp[i].out;
    }
}
