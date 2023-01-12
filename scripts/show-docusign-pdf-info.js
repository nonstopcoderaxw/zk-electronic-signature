const { BigNumber } = require("ethers");
const forge = require("node-forge");
const crypto = require("crypto");
const fs = require("fs");
const { pdfObj } = require("./lib/DocuSignPDF.js");
const buildPoseidon = require("circomlibjs").buildPoseidon;

const filePath = process.argv.slice(2)[0];
if(!filePath) {
    console.error("Error: No File Entered!"); 
    return;
}


main();

async function main() {
    const pdfBytes = fs.readFileSync(filePath);

    const {
        rawSigHex,
        nHex,
        preSignPDFHex,
        signedDataHex,
        signedDataDigestHex
    } = pdfObj(pdfBytes);

    console.log("Signature: ", "0x"+rawSigHex);
    console.log("Public Modulus: ", "0x"+nHex);
    console.log("PDF Digest: ", "0x"+signedDataDigestHex);

    let n = 121, k = 18;
    const sig = toCircomBigIntBytes(n, k, hexToBigInt("0x"+rawSigHex));
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const values0 = [];
    for(var i = 0; i < 16; i++) {
        values0.push(sig[i]);
    }
    const _pHash0BigInt = (function(){
        const hash = poseidon(values0);
        return F.toObject(hash);
    })();

    const nullifier = BigNumber.from(
        F.toObject(poseidon(
            [
              _pHash0BigInt,
              sig[16],
              sig[17]
            ]
        ))
    ).toHexString();
    console.log("nullifier: ", nullifier);
}


function toCircomBigIntBytes(row_len, col_len, num) {
    const res = [];
    const msk = (1n << BigNumber.from(row_len).toBigInt()) - 1n;
    for (let i = 0; i < col_len; ++i) {
      res.push(((num >> BigNumber.from(i * row_len).toBigInt()) & msk).toString());
    }
    return res;
}

function hexToBigInt(hex) {
    return BigNumber.from(hex).toBigInt();
}
