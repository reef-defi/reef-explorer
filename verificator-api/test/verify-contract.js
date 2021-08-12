const axios = require('axios');

const ApiEndPoint = 'https://testnet.reefscan.com/api/verificator/deployed-bytecode-request';

//
// Endpoint: /api/verificator/deployed-bytecode-request
//
// Method: POST
//
// Params:
//
// address: contract address
// name: contract name (of the main contract)
// source: source code
// bytecode: deployed bytecode
// arguments: contract arguments (stringified json)
// abi: contract abi (stringified json)
// compilerVersion: i.e: v0.8.6+commit.11564f7e
// optimization: true | false
// runs: optimization runs
// target: homestead | tangerineWhistle | spuriousDragon | byzantium | constantinople | petersburg | istanbul
// license: "unlicense" | "MIT" | "GNU GPLv2" | "GNU GPLv3" | "GNU LGPLv2.1" | "GNU LGPLv3" | "BSD-2-Clause" | "BSD-3-Clause" | "MPL-2.0" | "OSL-3.0" | "Apache-2.0" | "GNU AGPLv3"
//

axios
  .post(ApiEndPoint, {
    address: "0xFf67F88D662067ee2860ACB20336eeB2F5813951", // https://testnet.reefscan.com/contract/0xFf67F88D662067ee2860ACB20336eeB2F5813951
    name: "Storage",
    source: "// SPDX-License-Identifier: GPL-3.0\r\npragma solidity >=0.7.0 <0.9.0;\r\n/**\r\n * @title Storage\r\n * @dev Store & retrieve value in a variable\r\n */\r\ncontract Storage {\r\n    uint256 number;\r\n    /**\r\n     * @dev Store value in variable\r\n     * @param num value to store\r\n     */\r\n    function store(uint256 num) public {\r\n        number = num;\r\n    }\r\n    /**\r\n     * @dev Return value \r\n     * @return value of 'number'\r\n     */\r\n    function retrieve() public view returns (uint256){\r\n        return number;\r\n    }\r\n}",
    bytecode: "0x608060405234801561001057600080fd5b5061012f806100206000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632e64cec11460375780636057361d146051575b600080fd5b603d6069565b6040516048919060c2565b60405180910390f35b6067600480360381019060639190608f565b6072565b005b60008054905090565b8060008190555050565b60008135905060898160e5565b92915050565b60006020828403121560a057600080fd5b600060ac84828501607c565b91505092915050565b60bc8160db565b82525050565b600060208201905060d5600083018460b5565b92915050565b6000819050919050565b60ec8160db565b811460f657600080fd5b5056fea26469706673582212203d3ff9769e6e7395858577aa2746c99779f6c699c6d12e5e8c50ec6de6b8772364736f6c63430008040033",
    arguments: "[]",
    abi: '[{"inputs":[],"name":"retrieve","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"num","type":"uint256"}],"name":"store","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
    compilerVersion: "v0.8.4+commit.c7e474f2",
    optimization: "false",
    runs: "200",
    target: "istanbul",
    license: "GPL-3.0"
  })
  .then(res => {
    console.log('status:', res.status)
    console.log('response:', res)
  })
  .catch(error => {
    console.error('error:', error)
  })