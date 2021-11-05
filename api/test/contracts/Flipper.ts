import { ABI } from "../../src/types";
import { ContractStorage } from "../utils";

export default {
  name: "Flipper",
  filename: "Flipper.sol",
  arguments: JSON.stringify(["true"]),
  bytecode: "0x608060405234801561001057600080fd5b5060405161011938038061011983398101604081905261002f91610045565b6000805460ff191691151591909117905561006c565b600060208284031215610056578081fd5b81518015158114610065578182fd5b9392505050565b609f8061007a6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80636d4ce63c146037578063cde4efa9146051575b600080fd5b60005460ff16604051901515815260200160405180910390f35b60676000805460ff19811660ff90911615179055565b00fea264697066735822122088b93d28ee538a7f1b387b6b0dd71e85bbd61d827f2e1f588dc6aa88b86177e464736f6c634300080400330000000000000000000000000000000000000000000000000000000000000001",
  abi: [
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
  ] as ABI,
  sources: JSON.stringify({
    "Flipper.sol": `
  pragma solidity >=0.7.0 <0.9.0;
  
  contract Flipper {
    bool private value;
    /// Constructor that initializes the bool value to the given init_value.
    constructor(bool initvalue) public {
        value = initvalue;
    }
    /// A message that can be called on instantiated contracts.
    /// This one flips the value of the stored bool from true
    /// to false and vice versa.
    function flip() public {
        value = !value;
    }
    /// Simply returns the current value of our bool.
    function get() public view returns (bool) {
        return value;
    }
  }  
  `.trim()
  })
} as ContractStorage;