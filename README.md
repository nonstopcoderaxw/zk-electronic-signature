## About this Project
ZK Electronic Signature is a framework that 
* proofs someone has electronally signed an agreement via a web2 products like DocuSign, Adobe Acrobat Sign, DropboxSign etc.
* does not reveal anything about the content and the signer of the signed agreement during the proof
* executes an Ethereum smart contract on a successful proof

This is a personal project for fun.

## Demo
The idea of this framework has been put into a demo below: 

<a href="https://nonstopcoderaxw.github.io/zk-electronic-signature" target="_blank">https://nonstopcoderaxw.github.io/zk-electronic-signature</a>

The demo has something to do with sending privacy transactions in a Ethereum testnet. This was done to explain the framework. No other intentions.


## How to set it up locally
You can also set it up in your local machine. Steps are below.

### Clone the repo
```sh
   git clone https://github.com/nonstopcoderaxw/zk-electronic-signature
```
### Install the packages
```sh
   cd zk-electronic-signature
   yarn
```
### Download and place circuits wasm and zkey files

<div> 
Download the two files via the links below<br/>
<a href="https://zk-proof.sgp1.digitaloceanspaces.com/eSigVerifyMain.wasm" target="_blank">https://zk-proof.sgp1.digitaloceanspaces.com/eSigVerifyMain.wasm</a><br/>
<a href="https://zk-proof.sgp1.digitaloceanspaces.com/eSignVerify_groth16_final.zkey" target="_blank">https://zk-proof.sgp1.digitaloceanspaces.com/eSignVerify_groth16_final.zkey</a>
<br/><br/>
And then place them into the "zk-generate-proof-files" folder of the project repo<br/>
<div><br/>

### Run tests in Hardhat
```sh
   yarn test0
```

### Run web UI locally
```sh
   yarn start-ui
```

