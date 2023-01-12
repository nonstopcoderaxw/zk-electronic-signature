// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "./Openzeppelin/IERC20.sol";
import "./Openzeppelin/ReentrancyGuard.sol";

contract MyVault is ReentrancyGuard {

	address public approvedUser;

	error NoAccess(address from);
	error NoEnoughFunds(uint requestedAmt);
	error FailToSendEther(address to, uint amt);

	constructor(address _approvedUser) {
		approvedUser = _approvedUser;
	}

	modifier onlyApprovedUser() {
		if (msg.sender != approvedUser) revert NoAccess(msg.sender);

		_;
	}

	function transferFund(address to, uint ethAmt) onlyApprovedUser nonReentrant external returns (bool) {
		//send eth
		if (ethAmt > address(this).balance) revert NoEnoughFunds(ethAmt);
		if (!payable(address(to)).send(ethAmt)) revert FailToSendEther(to, ethAmt);
		
		return true;
	}

	receive() external payable {}
}