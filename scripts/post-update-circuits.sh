# run this after testing. Testing will generate r1cs files to circuits_build folder
# show the number of constraints
snarkjs r1cs info ./circuits_build/eSigVerify/eSigVerifyMain.r1cs
# re-generate zkey
snarkjs groth16 setup ./circuits_build/eSigVerify/eSigVerifyMain.r1cs ./pot18/pot18_final.ptau ./pot18/eSignVerify_groth16_final.zkey
# copy wasm file
cp circuits_build/eSigVerify/eSigVerifyMain_js/eSigVerifyMain.wasm ./zk-generate-proof-files
# copy zkey file
cp pot18/eSignVerify_groth16_final.zkey ./zk-generate-proof-files
# re-generate solidity verifier
snarkjs zkey export solidityverifier ./zk-generate-proof-files/eSignVerify_groth16_final.zkey ./zk-generate-proof-files/eSignVerifyGroth16Verifier.sol


# re-generate sample proof
snarkjs groth16 fullprove ./zk-generate-proof-files/inputs_0.json circuits_build/eSigVerify/eSigVerifyMain_js/eSigVerifyMain.wasm  ./zk-generate-proof-files/eSignVerify_groth16_final.zkey ./zk-generate-proof-files/proof_0.json ./zk-generate-proof-files/public_0.json
snarkjs groth16 fullprove ./zk-generate-proof-files/inputs_1.json circuits_build/eSigVerify/eSigVerifyMain_js/eSigVerifyMain.wasm  ./zk-generate-proof-files/eSignVerify_groth16_final.zkey ./zk-generate-proof-files/proof_1.json ./zk-generate-proof-files/public_1.json

# re-generate solidity sample calldata
snarkjs zkey export soliditycalldata ./zk-generate-proof-files/public_0.json ./zk-generate-proof-files/proof_0.json > ./zk-generate-proof-files/soliditycalldata_0.json
snarkjs zkey export soliditycalldata ./zk-generate-proof-files/public_1.json ./zk-generate-proof-files/proof_1.json > ./zk-generate-proof-files/soliditycalldata_1.json

echo "please manually update the verifier contract under the 'contracts' folder!"

