pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/bitify.circom";

// sha256 for digest
// 2048 for key size
template Pkcs1Pad(keySize) {
    assert(keySize == 2048);

    signal input digest[256];
    signal output padded[keySize]; // the pkcs1 padded digest is the key size

    // ASN.1 value
    // 0x3031300d060960864801650304020105000420 + digest
    signal ans1prefixBits[152];
    component Num2BitsComp1 = Num2Bits(152);
    Num2BitsComp1.in <== 0x3031300d060960864801650304020105000420;
    ans1prefixBits <== Num2BitsComp1.out;

    var _padded[keySize];

    // 00(8) || 01(8) || PS(1616) || 00(8) || prefix(152) || digest(256) : 2048 bits
    for (var i = 0; i < 256; i++) {
        _padded[i] = digest[i];
    }

    for (var i = 256; i < 256+152; i++) {
        _padded[i] = ans1prefixBits[i-256];
    }

    for (var i = 256+152; i < 256+152+8; i++) {
        _padded[i] = 0;
    }

    for (var i = 256+152+8; i < 256+152+8+1616; i++) {
        _padded[i] = 1;
    }

    for (var i = 256+152+8+1616; i < 256+152+8+1616+1; i++) {
        _padded[i] = 1;
    }

    for (var i = 256+152+8+1616+1; i < 256+152+8+1616+1+7; i++) {
        _padded[i] = 0;
    }

    for (var i = 256+152+8+1616+7+1; i < 256+152+8+1616+7+1+8; i++) {
        _padded[i] = 0;
    }

    padded <== _padded;
}
