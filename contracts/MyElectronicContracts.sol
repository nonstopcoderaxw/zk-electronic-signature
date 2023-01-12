// entry point of user
// zk-verifiy
// check pub signals
// manange mapping between signals and contract function
// exec by pub signals mapping
// nullifier

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./eSignVerifyGroth16Verifier.sol";
import "./Openzeppelin/Ownable.sol";
import "./hardhat/console.sol";


contract MyElectronicContracts is Ownable {

	struct ContractCall {
		address contractAddr;
		bytes _calldata;
		bool executed;
	}

	address public zkVerifier; // generated zk verifier address
	mapping(bytes32 => ContractCall) public binding; // key: eContract nullifier

	error NotVerified(string);
	error SmartContractCallFailed(address, bytes);
	error BindingExists(bytes32 nullifier);
	error BindingExecuted(bytes32 nullifier);

	event eContractExecuted(bytes32 nullifier);
	event NewBindingAdded(bytes32 nullifier);

	constructor (address _zkVerifier) {
		zkVerifier = _zkVerifier;
	}

	function exec (
		uint[2] memory a,
	    uint[2][2] memory b,
	    uint[2] memory c,
	    uint[1] memory input
	) external {
		// run verifier
		if (!eSignVerifyGroth16Verifier(zkVerifier).verifyProof(a, b, c, input)) revert NotVerified("Wrong Proof");
		// check - nullifier
		bytes32 nullifier = bytes32(input[0]);

		// exec the binding smart contract call
		address contractAddr = binding[nullifier].contractAddr;
		bytes memory _calldata = binding[nullifier]._calldata;

		if (binding[nullifier].executed) revert BindingExecuted(nullifier);
		
		(bool success, ) = contractAddr.call(_calldata);
		if (!success) revert SmartContractCallFailed(contractAddr, _calldata);
		
		// record nullifier - for demo purpose, nullifier is not processed
		// binding[nullifier].executed = true;

		emit eContractExecuted(nullifier);
	}

	function addBinding(bytes32 nullifier, address sc, bytes memory _calldata) onlyOwner external {
		if (binding[nullifier].contractAddr != address(0)) revert BindingExists(nullifier);
		
		binding[nullifier] = ContractCall({contractAddr: sc, _calldata: _calldata, executed: false});
		emit NewBindingAdded(nullifier);
	}


}
