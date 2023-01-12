// Required: a running zkSync local node
if(process.env.TEST_NETWORK != "zkSync") return;

const assert = require('assert') ;
const { expect } = require("chai");
const ethers = require("ethers");
const { Wallet, Provider, Contract } = require("zksync-web3");
const hre = require("hardhat");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const fs = require("fs");
const { pdfObj } = require("../scripts/lib/DocuSignPDF");
const {
  toCircomBigIntBytes,
  hexToBigInt
} = require("./lib/circom_utils");
const snarkjs = require("snarkjs");


const owner_pvk = "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110";
const nonOwner_pvk = "0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3";
const fundRecipient_pub = "0x0D43eB5B8a47bA8900d84AA36656c92024e9772e";

const provider = Provider.getDefaultProvider();

const wallet = {
	owner: null,
	nonOwner: null,
};

var erc20 = {
	link: null,
	usdc: null,
	dai: null
};

var deployed_MyVault;
var deployed_verifier;
var deployed_myElectronicContracts;

const amts = [
	ethers.utils.parseUnits("10", "18"),   // link
	ethers.utils.parseUnits("7", "6"),   // usdc
	ethers.utils.parseUnits("5", "18")  // dai
]

const digest = "0x0f9a56b54c5af7a5642868d4b80b5260aa13022fb3e8d859644c56c34cdec604";

describe("eSignVerifyGroth16Verifier tests - zkSync network", function () {

	beforeEach("deploy & setup contracts", async function(){
		// set up signers
		{
			wallet.owner = new Wallet(owner_pvk, provider);
			wallet.nonOwner = new Wallet(nonOwner_pvk, provider);
			deployer = new Deployer(hre, wallet.owner);
		}

		// deploy erc20 contracts
		{
			erc20.link = await deployer.deploy(await deployer.loadArtifact("LINK"));
			erc20.usdc = await deployer.deploy(await deployer.loadArtifact("USDC"));
			erc20.dai = await deployer.deploy(await deployer.loadArtifact("DAI"));
		}

		// deploy contracts
		{
			deployed_verifier = await deployer.deploy(await deployer.loadArtifact("eSignVerifyGroth16Verifier"));
	  		console.log("deployed_verifier: ", deployed_verifier.address);

	  		deployed_myElectronicContracts = await deployer.deploy(await deployer.loadArtifact("MyElectronicContracts"), [ deployed_verifier.address ]);
	  		console.log("deployed_myElectronicContracts: ", deployed_myElectronicContracts.address);

			deployed_MyVault = await deployer.deploy(await deployer.loadArtifact("MyVault"), [ deployed_myElectronicContracts.address, erc20.link.address, erc20.usdc.address, erc20.dai.address ]);
	  		console.log("deployed_MyVault: ", deployed_MyVault.address);
  		}

		// transfer funds to MyVaults
		{
			await erc20.link.approve(deployed_MyVault.address, ethers.utils.parseUnits("1000", "18"));
			await erc20.usdc.approve(deployed_MyVault.address, ethers.utils.parseUnits("1000", "6"));
			await erc20.dai.approve(deployed_MyVault.address, ethers.utils.parseUnits("1000", "18"));

			await erc20.link.transfer(deployed_MyVault.address, ethers.utils.parseUnits("1000", "18"));
			await erc20.usdc.transfer(deployed_MyVault.address, ethers.utils.parseUnits("1000", "6"));
			await erc20.dai.transfer(deployed_MyVault.address, ethers.utils.parseUnits("1000", "18"));
			//console.log("initial funds transfered!");
		}
		
		// add binding
		{
			const sc = deployed_MyVault.address;

			const abi = [
					"function transferFund(uint linkAmt, uint usdcAmt, uint daiAmt, address to)"
			];
			const iface = new ethers.utils.Interface(abi);
			const _calldata = iface.encodeFunctionData(
					"transferFund", 
					[
					  ...amts,
					  fundRecipient_pub
					]
			);
			//console.log("_calldata: ", _calldata);
			await deployed_myElectronicContracts.addBinding(digest, sc, _calldata);
		}
	})

	it("success: exec function with paymaster", async function () {
		// get docuSign document data
		const filePath = "./DocuSignFiles/Complete_with_DocuSign_Budget_Approval_Letter.pdf"; 
		
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
	    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
	        circuitInputs,
	        "./zk-generate-proof-files/eSigVerifyMain.wasm", 
	        "./zk-generate-proof-files/eSignVerify_groth16_final.zkey"
	    )

	    // generate solidity calldata
	    const sol_calldata = JSON.parse("[" + await snarkjs.groth16.exportSolidityCallData(proof, publicSignals) + "]")
	    // console.log("sol_calldata: ", sol_calldata)

		// generate solidity calldata
		// console.log("sol_calldata", sol_calldata);

	   
	  // NOTE: below will fail at zkSync 1.x for ec pre-compiles not implemented yet
		await deployed_myElectronicContracts.exec(...sol_calldata);

		// verify results - link, usdc, dai balances
		{
			const linkBalActual = await erc20.link.balanceOf(
					fundRecipient_pub
			);
			const linkBalExpected = amts[0];
			console.log("linkBalActual", linkBalActual.toString());
			assert(linkBalActual.toString() == linkBalExpected); 

			const usdcBalActual = await erc20.usdc.balanceOf(
					fundRecipient_pub
			);
			const usdcBalExpected = amts[1];
			console.log("usdcBalActual", usdcBalActual.toString());
			assert(usdcBalActual.toString() == usdcBalExpected); 

			const daiBalActual = await erc20.dai.balanceOf(
					fundRecipient_pub
			);
			const daiBalExpected = amts[2];
			console.log("daiBalActual", daiBalActual.toString());
			assert(daiBalActual.toString() == daiBalExpected); 
		}
	})
});