const ethers = require("ethers");

const fundRecipientAddr = "0xee9977C22214835C71e2a68c7770E1c1696F0E39";
const ethAmt = ethers.utils.parseUnits("0.1", "18");

main();

function main() {

	const abi = [
		"function transferFund(address to, uint ethAmt)"
	];
	const iface = new ethers.utils.Interface(abi);
	const _calldata = iface.encodeFunctionData(
		"transferFund", 
		[
			fundRecipientAddr,
			ethAmt
		]
	);
	console.log(_calldata);
	return _calldata;
}
