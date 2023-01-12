pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

include "./RsaMath.circom";


template eSigVerify(keySize, n, k) {
    signal input signedDataHash[256];
    signal input sig[k];
    signal input modulus[k];

    signal output nullifier; // poseido hash of sig

    //          left           ==             right
    // sig^65537 mod (modulus) == pkcs1 padded hashed message of signed data
    component leftComp = SigVerLeft(keySize, n, k);
    leftComp.sig <== sig;
    leftComp.modulus <== modulus;

    component rightComp = SigVerRight(keySize, n, k);
    rightComp.hash <== signedDataHash;

    leftComp.out === rightComp.out;

    // nullifier = sigHash
    component sigHashComp = sigHash(k);
    sigHashComp.in <== sig;
    nullifier <== sigHashComp.out;
}

template sigHash(k) {
    assert(k == 18);
    signal input in[k];
    signal output out;

    component phashComp1 = Poseidon(16);
    for(var i = 0; i < 16; i++) {
        phashComp1.inputs[i] <== in[i];
    }

    component phashComp2 = Poseidon(3);

    phashComp2.inputs[0] <== phashComp1.out;
    phashComp2.inputs[1] <== in[16];
    phashComp2.inputs[2] <== in[17];

    out <== phashComp2.out;
}
