// verify math
// get signature, modulus and sign data from a signed PDF
const { BigNumber } = require("ethers");
const forge = require("node-forge");
const crypto = require("crypto");

const ethers = require("ethers");
const chai = require("chai");
const assert = chai.assert;
const {
  getDir,
  bitArray2buffer,
  buffer2bitArray,
  buffer2bits,
  bytesToAscii,
  hexToBigInt,
  getBits,
  buf2hex,
  Scalar,
  F1Field,
  buf2ByteArray,
  q,
  F,
  printDebugArray,
  toCircomBigIntBytes,
  fromCircomBigIntBytes,
  bigIntArrayToHex
} = require("./lib/circom_utils");
const {
  createFile
} = require("./lib/files");
const fs = require("fs");
const wasm_tester = require("circom_tester").wasm;
const buildPoseidon = require("circomlibjs").buildPoseidon;
const { pdfObj } = require("../scripts/lib/DocuSignPDF");


describe("eSigVerifyMain.circom testing", function(){

    it("# from signed pdf to witness - sampleDocuSign.pdf", async function(){
        // find the sig, n, pre sign text
        const files = [
            "./test/data/sampleDocuSign.pdf"
        ]

        for(var i = 0; i < files.length; i++) {
            await testSingle(files[i], i);
        }

        async function testSingle(filePath, fileIndex) {
            const pdfBytes = await fs.promises.readFile(filePath);
            const {
                rawSigHex,
                nHex,
                preSignPDFHex,
                signedDataHex
            } = pdfObj(pdfBytes);
            // run rsa math
            const left = powerMod(BigNumber.from("0x" + rawSigHex, "hex").toBigInt(),
                     65537n,
                     BigNumber.from("0x" + nHex, "hex").toBigInt()
            );

            // check if hash(preSignPDFHex) included in signedDataHex
            var hashFunc = crypto.createHash("sha256");
            hashFunc.update(Buffer.from(preSignPDFHex, "hex"));
            const pdfDigest = hashFunc.digest().toString("hex");
            assert(signedDataHex.slice(154, 154+64) == pdfDigest, "pdfDigest wrong!");

            hashFunc = crypto.createHash("sha256");
            hashFunc.update(Buffer.from(signedDataHex, "hex"));
            const digest = hashFunc.digest().toString("hex");
            //console.log("digest: ", digest);

            const digestPadded = `0x0001ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff003031300d060960864801650304020105000420${digest}`;
            //console.log("digestPadded: ", digestPadded);
            const right = BigNumber.from(digestPadded, "hex").toBigInt();
            //console.log("left: ", left);
            //console.log("right: ", right);

            assert(left == right, "wrong sig!");
            // generate witness
            let n = 121, k = 18, signedDataSize = 3088, keySize = 2048;
            //console.log("signedDataHex: ", signedDataHex);
            const inputs = {
                //signedDataReversed: toCircomBigIntBytes(1, signedDataSize, hexToBigInt("0x"+signedDataHex)).reverse(),// buffer2bitArray(Buffer.from(signedDataHex, "hex")),
                signedDataHash: toCircomBigIntBytes(1, 256, hexToBigInt("0x"+digest)),
                sig: toCircomBigIntBytes(n, k, hexToBigInt("0x"+rawSigHex)),
                modulus: toCircomBigIntBytes(n, k, hexToBigInt("0x"+nHex))
            }
            
            //console.log("inputs: ", inputs);
            let cir = await wasm_tester("./circuits/eSigVerifyMain.circom", { output:"./circuits_build/eSigVerify" }); ///

            const w = await cir.calculateWitness(inputs, true);
            await cir.checkConstraints(w);
            //console.log("sig validated!");

            const nullifier = BigNumber.from(
                w[1]
            ).toHexString();
            //console.log("nullifier: ", nullifier);

            // verifiy results - nullifier
            {
                const poseidon = await buildPoseidon();
                const F = poseidon.F;

                const values0 = [];
                for(var i = 0; i < 16; i++) {
                    values0.push(inputs.sig[i]);
                }
                const _pHash0BigInt = (function(){
                    const hash = poseidon(values0);
                    return F.toObject(hash);
                })();

                const nullifierExpected = BigNumber.from(
                    F.toObject(poseidon(
                        [
                          _pHash0BigInt,
                          inputs.sig[16],
                          inputs.sig[17]
                        ]
                    ))
                ).toHexString();
                assert(nullifier == nullifierExpected, "nullifier wrong!");
            }

            // save inputs and generate soliditycalldata 
            await createFile(`./zk-generate-proof-files/inputs_${fileIndex}.json`, JSON.stringify(inputs));
        }

    })
})


function powerMod(base, exponent, modulus) {
    if (modulus === 1n) return 0;
    var result = 1n;
    base = base % modulus;
    while (exponent > 0n) {
        if (exponent % 2n === 1n)  //odd number
            result = (result * base) % modulus;
        exponent = exponent >> 1n; //divide by 2
        base = (base * base) % modulus;
    }
    return result;
}
