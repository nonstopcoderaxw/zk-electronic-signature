const { pdfObj } = require("./lib/DocuSignPDF.js");

function arrayBufferToBuffer(ab) {
	const buf = Buffer.alloc(ab.byteLength);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
    }
    return buf;
}

window.pdfObj = pdfObj;
window.arrayBufferToBuffer = arrayBufferToBuffer;


