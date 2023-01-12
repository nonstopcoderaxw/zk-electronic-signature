
function pdfObj(pdfBytes) {
    const BigNumber = ethers.BigNumber;

    const {
      signature: sigSection,
      signedData: preSignPDFHex
    } = getSignature(pdfBytes);

    const p7Asn1 = forge.pkcs7.messageFromAsn1(forge.asn1.fromDer(sigSection));

    // raw sig, algo
    const rawSigHex = Buffer.from(p7Asn1.rawCapture.signature, "binary").toString("hex");
    const hashAlgo = forge.pki.oids[forge.asn1.derToOid(p7Asn1.rawCapture.digestAlgorithm)];
    
    // public key n
    const nHex = BigNumber.from(p7Asn1.certificates[p7Asn1.certificates.length-1].publicKey.n.toString()).toHexString().replace("0x", "");

    const signedDataHex = Buffer.from(forge.asn1.toDer(
        forge.asn1.create(
          forge.asn1.Class.UNIVERSAL,
          forge.asn1.Type.SET,
          true,
          p7Asn1.rawCapture.authenticatedAttributes
        )
    ).data, "binary").toString("hex");

    // pdf digest
    //var hashFunc = crypto.createHash("sha256");
    //hashFunc.update(Buffer.from(preSignPDFHex, "hex"));
    const pdfDigestHex = sha256(Buffer.from(preSignPDFHex, "hex"))//hashFunc.digest().toString("hex");

    if(signedDataHex.slice(154, 154+64) != pdfDigestHex) console.log("Warning: this DocuSign document has been forged!");

    //var hashFunc = crypto.createHash("sha256");
    //hashFunc.update(Buffer.from(signedDataHex, "hex"));
    const signedDataDigestHex = sha256(Buffer.from(preSignPDFHex, "hex"));//hashFunc.digest().toString("hex");

    return {
        rawSigHex,
        nHex,
        preSignPDFHex,
        signedDataHex,
        signedDataDigestHex
    }
}

function getSignature(pdf) {
    let byteRangePos = pdf.lastIndexOf("/ByteRange[");
    if (byteRangePos === -1) byteRangePos = pdf.lastIndexOf("/ByteRange [");

    const byteRangeEnd = pdf.indexOf("]", byteRangePos);
    const byteRange = pdf.slice(byteRangePos, byteRangeEnd + 1).toString();
    const byteRangeNumbers = /(\d+) +(\d+) +(\d+) +(\d+)/.exec(byteRange);
    const byteRangeArr = byteRangeNumbers[0].split(" ");

    const signedData = Buffer.concat([
      pdf.slice(parseInt(byteRangeArr[0]), parseInt(byteRangeArr[1])),
      pdf.slice(
        parseInt(byteRangeArr[2]),
        parseInt(byteRangeArr[2]) + parseInt(byteRangeArr[3])
      ),
    ]);
    let signatureHex = pdf
      .slice(
        parseInt(byteRangeArr[0]) + (parseInt(byteRangeArr[1]) + 1),
        parseInt(byteRangeArr[2]) - 1
      )
      .toString("binary");

    const signature = Buffer.from(signatureHex, "hex").toString("binary");
    return { signature, signedData };
}


async function sha256(buf) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((bytes) => bytes.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
}


