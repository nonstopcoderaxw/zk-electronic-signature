if(process.env.TEST_NETWORK != "hh") return;

const assert = require('assert') ;
const snarkjs = require("snarkjs");
const buildPoseidon = require("circomlibjs").buildPoseidon;
const fs = require("fs");
const { pdfObj } = require("../scripts/lib/DocuSignPDF");
const {
  toCircomBigIntBytes,
  hexToBigInt
} = require("./lib/circom_utils");

const signers = {
	owner: null,
	nonOwner: null,
	fundRecipient: null
};

var deployed_MyVault;
var deployed_verifier;
var deployed_myElectronicContracts;

const nullifier = "0x26a125d1dee1cab9685af66248263f75c6546ffca1e9bb25f38e31d0b05df4eb";

const amts = [
		ethers.utils.parseUnits("0.1", "18"),   // eth
]

const BigNumber = ethers.BigNumber;

describe("eSignVerifyGroth16Verifier tests - pure hardhat network", function () {
	before("deploy contracts", async function(){
		// set up signers
		{
			const _signers = await ethers.getSigners();
			signers.owner = _signers[0];
			signers.nonOwner = _signers[1];
			signers.fundRecipient = _signers[2];
		}

		// deploy contracts
		{
			deployed_verifier = await (await ethers.getContractFactory("eSignVerifyGroth16Verifier")).deploy();
			
			deployed_myElectronicContracts = await (await ethers.getContractFactory("MyElectronicContracts")).deploy(deployed_verifier.address);
			
			deployed_MyVault = await (await ethers.getContractFactory("MyVault")).deploy(deployed_myElectronicContracts.address);
		}

		// add binding
		{
			const sc = deployed_MyVault.address;

			const abi = [
					"function transferFund(address to, uint ethAmt)"
			];
			const iface = new ethers.utils.Interface(abi);
			const _calldata = iface.encodeFunctionData(
					"transferFund", 
					[
						signers.fundRecipient.address,
						...amts
					]
			);
			//console.log("_calldata: ", _calldata);
			await deployed_myElectronicContracts.addBinding(nullifier, sc, _calldata);
		}

		// transfer eth to MyVault
		{
			await signers.owner.sendTransaction({
				value: amts[0],
				to: deployed_MyVault.address
			})
		}
		
			// attach existing contract
			// deployed goerli contracts
			// const deployed_verifier_addr = "0x3be5C27bfD76b4F1123D890de3032adaC19A7bdF";
			// const deployed_myElectronicContracts_addr = "0xd0BBcA55dd9d744d69e474d1D036CCACb5145c0E";
			// const deployed_myVault_addr = "0xaBFb1a8D70B771Fb6AbF363dd15cf873e5187A10";

			// deployed_verifier = await (await ethers.getContractFactory("eSignVerifyGroth16Verifier")).attach(deployed_verifier_addr);
			// deployed_myElectronicContracts = await (await ethers.getContractFactory("MyElectronicContracts")).attach(deployed_myElectronicContracts_addr);
			// deployed_MyVault = await (await ethers.getContractFactory("MyVault")).attach(deployed_myVault_addr);

			// console.log("deployed_verifier: ", deployed_verifier.address);
			// console.log("deployed_myElectronicContracts: ", deployed_myElectronicContracts.address);
			// console.log("deployed_MyVault: ", deployed_MyVault.address);
		
	})

	it.only("deploy contracts only", async function(){
			console.log("deployed_verifier address: ", deployed_verifier.address);
			console.log("deployed_myElectronicContracts address: ", deployed_myElectronicContracts.address);
			console.log("deployed_MyVault: ", deployed_MyVault.address);
	})

	it("success: exec function", async function () {
		// get docuSign document data
		const filePath = "./DocuSignFiles/Complete_with_DocuSign_Budget_Approval_Letter.pdf"; 
		// "./DocuSignFiles/Complete_with_DocuSign_Budget_Approval_Letter.pdf"
		// "./DocuSignFiles/Complete_with_DocuSign_Budget_Approval_Lette_ForgedSignature.pdf"
		// "./DocuSignFiles/Complete_with_DocuSign_Budget_Approval_Lette_ExcludedDigest.pdf"
		const {
				rawSigHex,
        nHex,
        signedDataDigestHex
		} = pdfObj(fs.readFileSync(filePath));

		// build circuit inputs
		const n = 121, k = 18;
		const circuitInputs = {
	      signedDataHash: toCircomBigIntBytes(1, 256, hexToBigInt("0x"+signedDataDigestHex)),
	      sig: toCircomBigIntBytes(n, k, hexToBigInt("0x"+rawSigHex)),
	      modulus: toCircomBigIntBytes(n, k, hexToBigInt("0x"+nHex))
    }

    // generate proof
		const wasm = "./zk-generate-proof-files/eSigVerifyMain.wasm";
		const zkey = "./zk-generate-proof-files/eSignVerify_groth16_final.zkey";
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInputs,
        wasm, 
        zkey
    )

    // generate solidity calldata
    const sol_calldata = JSON.parse("[" + await snarkjs.groth16.exportSolidityCallData(proof, publicSignals) + "]")
    // console.log("sol_calldata: ", sol_calldata)

		// generate solidity calldata
		// console.log("sol_calldata", sol_calldata);
		const bal0 = await ethers.provider.getBalance(signers.fundRecipient.address);
		const tx = await deployed_myElectronicContracts.connect(signers.owner).exec(...sol_calldata);
		console.log("exec tx: ", tx.hash);

		// verify results - link, usdc, dai balances - goerlie may fail due to latency
		{		
				const bal1 = await ethers.provider.getBalance(signers.fundRecipient.address);
				const balExpected = amts[0].toString();
				const deltaBal = bal1.sub(bal0).toString();
				assert(deltaBal == balExpected, "wrong balance!");
		}
	});
	it("fail: addBinding by non-owner", async function () {
		// AddBinding
		{
				try {
					const sc = deployed_MyVault.address;

					const abi = [
							"function transferFund(address to, uint ethAmt)"
					];
					const iface = new ethers.utils.Interface(abi);
					const _calldata = iface.encodeFunctionData(
							"transferFund", 
							[
							  signers.fundRecipient.address,
								...amts
							]
					);
					//console.log("_calldata: ", _calldata);
					const tx = await deployed_myElectronicContracts.connect(signers.nonOwner).addBinding(nullifier, sc, _calldata);
					console.log("tx: ", tx.hash);
					throw("Test Failed!");
					return;
				} catch (e) {
					// console.log("e: ", e)
					assert(e.toString().includes("Ownable: caller is not the owner"), "Test Failed!");
				}
		}
	});
	it("fail: update existing binding", async function(){
			const sc = deployed_MyVault.address;

			const abi = [
					"function transferFund(address to, uint ethAmt)"
			];
			const iface = new ethers.utils.Interface(abi);
			
			// update the exsiting binding
			const _calldata = iface.encodeFunctionData(
					"transferFund", 
					[
						signers.fundRecipient.address,
						"111"
					]
			);
			try {
				const tx = await deployed_myElectronicContracts.addBinding(nullifier, sc, _calldata);
				console.log("tx: ", tx.hash);
				throw("Test Failed 0!");
				return;
			}catch (e) {
				// console.log("e: ", e);
				assert(e.toString().includes("BindingExists"), "Test Failed 1!");
			}
	})
	it("fail: send funds from non-approved user", async function(){
			try {
				const tx = await deployed_MyVault.transferFund(signers.owner.address, ...amts);
				console.log("tx: ", tx.hash);
				throw("Test Failed 0!");
				return;
			} catch (e) {
				// console.log("e:", e);
				assert(e.toString().includes("NoAccess"), "Test Fail 1!");
			}
	})
});

function bigIntToArray(word, size, num) {
    const res = [];
    const msk = (1n << BigNumber.from(word).toBigInt()) - 1n;
    for (let i = 0; i < size; i++) {
      res.push(((num >> BigNumber.from(i * word).toBigInt()) & msk).toString());
    }
    return res;
}




