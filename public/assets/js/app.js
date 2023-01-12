const wasm = "https://zk-proof.sgp1.digitaloceanspaces.com/eSigVerifyMain.wasm";
const zkey = "https://zk-proof.sgp1.digitaloceanspaces.com/eSignVerify_groth16_final.zkey";
// const wasm = "./eSigVerifyMain.wasm";
// const zkey = "./eSignVerify_groth16_final.zkey";


// const deployed_verifier_addr = "0x3be5C27bfD76b4F1123D890de3032adaC19A7bdF";
// const deployed_myElectronicContracts_addr = "0xd0BBcA55dd9d744d69e474d1D036CCACb5145c0E";
// const deployed_myVault_addr = "0xaBFb1a8D70B771Fb6AbF363dd15cf873e5187A10";
const myElectronicContractsAddr = "0xd0BBcA55dd9d744d69e474d1D036CCACb5145c0E";
const myElectronicContractsAbi = [
	"function exec (uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint[1] memory input) external" 
]

var provider;
var signer;
var currStep;
var soliditycalldata;

lanuch();

async function lanuch() {
	currStep = "1";

	const connection = await checkConnection();

	if (connection.status) {
		currStep = "2";
		document.getElementById("cStep1Section").style.opacity = "0.5";
		document.getElementById("cStep1Btn").innerText = "Connected";
		document.getElementById("cStep1Btn").title = connection.account;
		document.getElementById("cStep1Btn").style.background = "linear-gradient(45deg, #1de099, #1dc8cd)";
		document.getElementById("cStep1Btn").disabled = true;
		document.getElementById("cStep1Btn").style.cursor = "not-allowed";	
	}

	hightlightActive();
	dragAndDropFileSetting();
}

async function connect() {
	event.preventDefault();
	provider = new ethers.providers.Web3Provider(window.ethereum, "goerli");

	await provider.send("eth_requestAccounts", []);
	signer = provider.getSigner();

	if(!signer) alert("Wallet not connected!");
	const signerAddr = await signer.getAddress();
	
	document.getElementById("cStep1Section").style.opacity = "0.5";
	document.getElementById("cStep1Btn").innerText = "Connected";
	document.getElementById("cStep1Btn").title = signerAddr;
	document.getElementById("cStep1Btn").style.background = "linear-gradient(45deg, #1de099, #1dc8cd)";
	document.getElementById("cStep1Btn").disabled = true;
	document.getElementById("cStep1Btn").style.cursor = "not-allowed";


	currStep = "2";
	hightlightActive();
}

async function zkVerify() {
	event.preventDefault();
	// check file
	var x = document.getElementById("fileInput").files[0];
	if (!x) alert("Please choose a file!"); 

	let reader = new FileReader();
	reader.readAsArrayBuffer(x);

	reader.onload = async function() {
		document.getElementById("zkResult").innerText = "Please wait....";
		const buffer = reader.result;
		document.getElementById("cStep2Btn").disabled = true;
		document.getElementById("cStep2Btn").style.cursor = "not-allowed";
		try {
			soliditycalldata = await generateSolidityProof(wasm, zkey, arrayBufferToBuffer(reader.result));
			document.getElementById("zkResult").innerText = "";
			console.log("soliditycalldata: ", JSON.stringify(soliditycalldata));
			// UI 
			currStep = "3";
			document.getElementById("cStep2Section").style.opacity = "0.5";
			document.getElementById("cStep2Btn").style.background = "linear-gradient(45deg, #1de099, #1dc8cd)";
			document.getElementById("cStep2Btn").disabled = true;
			document.getElementById("cStep2Btn").style.cursor = "not-allowed";
			hightlightActive();
		} catch (e) {
			console.log("error: ", e);
			document.getElementById("zkResult").innerText = "";
			alert("Zk Proof Generation Failed!");
		}
		

		
	};
}

async function execSmartContract() {
	event.preventDefault();
	const contract = new ethers.Contract(myElectronicContractsAddr, myElectronicContractsAbi, signer, myElectronicContractsAbi);

	const tx = await contract.exec(...soliditycalldata);
	console.log("tx hash: ", tx.hash);
	if(tx.hash) {
		document.getElementById("cStep3Btn").style.background = "linear-gradient(45deg, #1de099, #1dc8cd)";
		document.getElementById("cStep3Btn").disabled = true;
		document.getElementById("cStep3Btn").style.cursor = "not-allowed";
		document.getElementById("tx").href = "https://goerli.etherscan.io/tx/" + tx.hash;
		document.getElementById("txResult").style.display = "block";
	} else {
		alert("Smart Contract Call Failed!");
	}
}

async function checkConnection() {
	provider = new ethers.providers.Web3Provider(window.ethereum, "goerli");
	if (!provider) return { status: false, reason: 1 };
	if (!provider.network.name == "goerli") return { status: false, reason: 2 };

	signer = await provider.getSigner();
	var signerAddr;
	try {
		signerAddr = await signer.getAddress();
	} catch (e) {
		return { status: false, reason: 0 } 
	}

	return { status: true, account: signerAddr };
}

function hightlightActive() {
	if (currStep == "1") {
		document.getElementById("cStep1Section").classList.add("featured");
		document.getElementById("cStep2Section").classList.remove("featured");
		document.getElementById("cStep3Section").classList.remove("featured");
	}
	if (currStep == "2") {
		document.getElementById("cStep1Section").classList.remove("featured");
		document.getElementById("cStep2Section").classList.add("featured");
		document.getElementById("cStep3Section").classList.remove("featured");
	}
	if (currStep == "3") {
		document.getElementById("cStep1Section").classList.remove("featured");
		document.getElementById("cStep2Section").classList.remove("featured");
		document.getElementById("cStep3Section").classList.add("featured");
	}
}

function dragAndDropFileSetting() {
	var dropzoneId = "fileInput";

	window.addEventListener("dragenter", function(e) {
	  if (e.target.id != dropzoneId) {
	    e.preventDefault();
	    e.dataTransfer.effectAllowed = "none";
	    e.dataTransfer.dropEffect = "none";
	  }
	}, false);

	window.addEventListener("dragover", function(e) {
	  if (e.target.id != dropzoneId) {
	    e.preventDefault();
	    e.dataTransfer.effectAllowed = "none";
	    e.dataTransfer.dropEffect = "none";
	  }
	});

	window.addEventListener("drop", function(e) {
	  if (e.target.id != dropzoneId) {
	    e.preventDefault();
	    e.dataTransfer.effectAllowed = "none";
	    e.dataTransfer.dropEffect = "none";
	  }
	});
}

async function generateSolidityProof(wasm, zkey, buf) {
	const {
        rawSigHex,
        nHex,
        preSignPDFHex,
        signedDataHex,
        signedDataDigestHex
    } = pdfObj(buf);

    const n = 121, k = 18;
    var circuitInputs = {
	    signedDataHash: toCircomBigIntBytes(1, 256, hexToBigInt("0x"+signedDataDigestHex)),
	    sig: toCircomBigIntBytes(n, k, hexToBigInt("0x"+rawSigHex)),
	    modulus: toCircomBigIntBytes(n, k, hexToBigInt("0x"+nHex))
    }

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInputs,
        wasm,
        zkey
    )

    const sol_calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);

    return JSON.parse("[" + sol_calldata + "]");
}

function toCircomBigIntBytes(row_len, col_len, num) {
    const res = [];
    const msk = (1n << ethers.BigNumber.from(row_len).toBigInt()) - 1n;
    for (let i = 0; i < col_len; ++i) {
      res.push(((num >> ethers.BigNumber.from(i * row_len).toBigInt()) & msk).toString());
    }
    return res;
}

function hexToBigInt(hex) {
    return ethers.BigNumber.from(hex).toBigInt();
}

