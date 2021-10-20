const { ethers } = require('ethers');

// Flipper: 0xA4eBf4d4C054cFFc777AFb2bCfba17F1322308F9 (ipfs)
const deploymentBytecode = "0x608060405234801561001057600080fd5b5060405161013e38038061013e8339818101604052602081101561003357600080fd5b8101908080519060200190929190505050806000806101000a81548160ff0219169083151502179055505060d28061006c6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80636d4ce63c146037578063cde4efa9146055575b600080fd5b603d605d565b60405180821515815260200191505060405180910390f35b605b6073565b005b60008060009054906101000a900460ff16905090565b60008054906101000a900460ff16156000806101000a81548160ff02191690831515021790555056fea2646970667358221220bfdc7f2b594d609dbc5f542eb9d935334a4f8e2754674669fbe476cde45a5e2064736f6c634300070300330000000000000000000000000000000000000000000000000000000000000001";
const runtimeBytecode = "0x6080604052348015600f57600080fd5b506004361060325760003560e01c80636d4ce63c146037578063cde4efa9146055575b600080fd5b603d605d565b60405180821515815260200191505060405180910390f35b605b6073565b005b60008060009054906101000a900460ff16905090565b60008054906101000a900460ff16156000806101000a81548160ff02191690831515021790555056fea2646970667358221220bfdc7f2b594d609dbc5f542eb9d935334a4f8e2754674669fbe476cde45a5e2064736f6c63430007030033";
const abi = JSON.parse(`[
    {
      "inputs": [
        {
          "internalType": "bool",
          "name": "initvalue",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "flip",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "get",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]`);

// remove 0x
const processedRuntimeBytecode = runtimeBytecode.slice(2);

// get constructor arguments
const argumentsStart = deploymentBytecode.indexOf(processedRuntimeBytecode) + processedRuntimeBytecode.length;
const contractArguments = deploymentBytecode.slice(argumentsStart);

// get constructor arguments types array
const constructorTypes = abi
  .find(({ type }) => type === 'constructor')
  .inputs.map(input => input.type);

// Decode constructor arguments
const abiCoder = new ethers.utils.AbiCoder;
const decodedArguments = abiCoder.decode(constructorTypes, '0x' + contractArguments);

//
// get metadata
//
// metadata is part of runtime bytecode
//
let contractMetadata = '';

// metadata separator for 0.5.16
const bzzr1MetadataStartBytes = 'a265627a7a72315820';
// metadata separator (solc >= v0.6.0)
const ipfsMetadataStartBytes =  'a264697066735822';

if (runtimeBytecode.indexOf(ipfsMetadataStartBytes) > 0) {
    const ipfsMetadataStart = runtimeBytecode.indexOf(ipfsMetadataStartBytes);
    contractMetadata = runtimeBytecode.slice(ipfsMetadataStart);
} else if (runtimeBytecode.indexOf(bzzr1MetadataStartBytes) > 0) {
    const bzzr1MetadataStart = runtimeBytecode.indexOf(bzzr1MetadataStartBytes);
    contractMetadata = runtimeBytecode.slice(bzzr1MetadataStart);
}

// console.log(`deployment bytecode:\n\n${deploymentBytecode}\n`);
// console.log(`runtime bytecode:\n\n${runtimeBytecode}\n`);
// console.log(`processed runtime bytecode:\n\n${processedRuntimeBytecode}\n`);
console.log(`metadata:\n\n${contractMetadata}\n`);
console.log(`arguments:\n\n${contractArguments}\n`);
console.log(`constructor arguments types:\n\n${constructorTypes}\n`);
console.log(`decoded arguments:\n\n${decodedArguments}\n`);
