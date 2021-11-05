import { ABI } from "../../src/types";
import { ContractStorage } from "../utils";

export default {
  name: "Storage",
  filename: "Storage.sol",
  arguments: JSON.stringify(["9879461"]),
  bytecode: "0x608060405234801561001057600080fd5b5060405161010838038061010883398101604081905261002f91610037565b60005561004f565b600060208284031215610048578081fd5b5051919050565b60ab8061005d6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632e64cec11460375780636057361d14604c575b600080fd5b60005460405190815260200160405180910390f35b605c6057366004605e565b600055565b005b600060208284031215606e578081fd5b503591905056fea2646970667358221220eefd54f067e6c9a97316f0b8ed80de98cec9b725b67b17c2d717155e275df51164736f6c63430008040033000000000000000000000000000000000000000000000000000000000096bfa5",
  abi: [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "retrieve",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "num",
          "type": "uint256"
        }
      ],
      "name": "store",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as ABI,
  sources: JSON.stringify({
    'Storage.sol': `
  // SPDX-License-Identifier: GPL-3.0
  
  pragma solidity >=0.7.0 <0.9.0;
  
  /**
   * @title Storage
   * @dev Store & retrieve value in a variable
   */
  contract Storage {
  
      uint256 number;
      
      constructor(uint256 value) {
          number = value;
      }
      /**
       * @dev Store value in variable
       * @param num value to store
       */
      function store(uint256 num) public {
          number = num;
      }
  
      /**
       * @dev Return value 
       * @return value of 'number'
       */
      function retrieve() public view returns (uint256){
          return number;
      }
  }
  `
  })
} as ContractStorage;