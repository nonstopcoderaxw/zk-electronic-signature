const { BigNumber } = require("ethers");
const util = require('util')
const path = require("path");
const Scalar = require("ffjavascript").Scalar;
const F1Field = require("ffjavascript").F1Field;
const q = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const F = new F1Field(q);

function getDir(circuit_name) {
    const dir = path.join(__dirname.replace(/(\s+)/g, '\\$1').replace("test/lib", ""), "test/testCircuits", circuit_name);
    return dir;
}

// this takes reversed bits
function bitArray2buffer(a) {
    const len = Math.floor((a.length -1 )/8)+1;
    const b = new Buffer.alloc(len);

    for (let i=0; i<a.length; i++) {
        const p = Math.floor(i/8);
        b[p] = b[p] | (Number(a[i]) << ( 7 - (i%8)  ));
    }
    return b;
}

// this will give reversed bits
function buffer2bitArray(b) {
    const res = [];
    for (let i=0; i<b.length; i++) {
        for (let j=0; j<8; j++) {
            res.push((b[i] >> (7-j) &1));
        }
    }
    return res;
}

function buffer2bitArray(b, nBits) {
    const res = [];
    for (let i=0; i<b.length; i++) {
        for (let j=0; j<8; j++) {
            res.push((b[i] >> (7-j) &1));
        }
    }
    const resLen0 = res.length;
    // fill 0 to make nBits array
    for (let i = 0; i < nBits - resLen0; i++) {
        res.push(0);
    }
    return res;
}

function buffer2bits(buff) {
    const res = [];
    for (let i=0; i<buff.length; i++) {
        for (let j=0; j<8; j++) {
            if ((buff[i]>>BigInt(j))&BigInt(1)) {
                res.push(1n);
            } else {
                res.push(0n);
            }
        }
    }
    return res;
}

function bigIntArrayToHex(row_size, arr) {
    return BigNumber.from(fromCircomBigIntBytes(row_size, arr)).toHexString();
}

function getBits(v, n) {
    const res = [];
    for (let i=0; i<n; i++) {
        if (Scalar.isOdd(Scalar.shr(v,i))) {
            res.push(F.one);
        } else {
            res.push(F.zero);
        }
    }
    return res;
}
// https://stackoverflow.com/questions/40031688/javascript-arraybuffer-to-hex
function buf2hex(buffer) {
    return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

function buf2ByteArray(buffer) {
    return [].slice.call(Uint8Array.from(buffer));
}

function stringToBytes(str) {
    return Uint8Array.from(str, (x) => x.charCodeAt(0));
}

function bytesToAscii(bytes) {
    return String.fromCharCode(...bytes);
}

// require 0x prefix
function hexToBigInt(hex) {
    return BigNumber.from(hex).toBigInt();
}

function printDebugArray(witness, sizeList, maxArrayLength) {
    var signals = [];
    for(var i = 0; i < sizeList.length; i++) {

        // start: size0 + size1 + .. + sizei
        // end: size0 + size1 + .. + sizei + sizei

        var offset = (function(_i){
            var _offset = 0;
            for(var i = 0; i < _i; i++) {
                _offset += sizeList[i];
            }
            return _offset;
        }(i));

        var start = offset + 1;
        var end = offset + sizeList[i] + 1;
        signal = witness.slice(start, end);
        console.log(`debug var ${i} - array: `, util.inspect(signal, { maxArrayLength: maxArrayLength }));
        signals[i] = signal;
    }
    return signals;
}

function toCircomBigIntBytes(row_len, col_len, num) {
    const res = [];
    const msk = (1n << BigNumber.from(row_len).toBigInt()) - 1n;
    for (let i = 0; i < col_len; ++i) {
      res.push(((num >> BigNumber.from(i * row_len).toBigInt()) & msk).toString());
    }
    return res;
}

function fromCircomBigIntBytes(row_len, bytes) {
  let res = 0n;
  for (let i = 0; i < bytes.length; ++i) {
    res = res + (BigInt(bytes[i]) << BigNumber.from(i * row_len).toBigInt());
  }
  return res;
}

module.exports = {
  getDir,
  bitArray2buffer,
  buffer2bitArray,
  buffer2bits,
  getBits,
  buf2hex,
  Scalar,
  F1Field,
  stringToBytes,
  bytesToAscii,
  hexToBigInt,
  buf2ByteArray,
  q,
  F,
  printDebugArray,
  toCircomBigIntBytes,
  fromCircomBigIntBytes,
  bigIntArrayToHex
}
