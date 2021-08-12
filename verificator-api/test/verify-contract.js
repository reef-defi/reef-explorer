const axios = require('axios');

const ApiEndPoint = 'https://reefscan.com/api/verificator/deployed-bytecode-request';

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
// target: default | homestead | tangerineWhistle | spuriousDragon | byzantium | constantinople | petersburg | istanbul
// license: "unlicense" | "MIT" | "GNU GPLv2" | "GNU GPLv3" | "GNU LGPLv2.1" | "GNU LGPLv3" | "BSD-2-Clause" | "BSD-3-Clause" | "MPL-2.0" | "OSL-3.0" | "Apache-2.0" | "GNU AGPLv3"
//

axios
  .post(ApiEndPoint, {
    address: "0xEBB1dd05dEf03EdF5dD47738153436969853a695", // https://reefscan.com/contract/0xEBB1dd05dEf03EdF5dD47738153436969853a695
    name: "Storage",
    source: "// SPDX-License-Identifier: GPL-3.0\r\npragma solidity >=0.7.0 <0.9.0;\r\n/**\r\n * @title Storage\r\n * @dev Store & retrieve value in a variable\r\n */\r\ncontract Storage {\r\n    uint256 number;\r\n    /**\r\n     * @dev Store value in variable\r\n     * @param num value to store\r\n     */\r\n    function store(uint256 num) public {\r\n        number = num;\r\n    }\r\n    /**\r\n     * @dev Return value \r\n     * @return value of 'number'\r\n     */\r\n    function retrieve() public view returns (uint256){\r\n        return number;\r\n    }\r\n}",
    bytecode: "0x6080604052348015600f57600080fd5b5060ac8061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632e64cec11460375780636057361d14604c575b600080fd5b60005460405190815260200160405180910390f35b605c6057366004605e565b600055565b005b600060208284031215606f57600080fd5b503591905056fea26469706673582212204748f5bdc9e72c9c212709f26cd60fb1e6593fecaba24eeefe8cc71842a7851d64736f6c63430008060033",
    arguments: "[]",
    abi: '[{"inputs":[],"name":"retrieve","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"num","type":"uint256"}],"name":"store","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
    compilerVersion: "v0.8.6+commit.11564f7e",
    optimization: "true",
    runs: "200",
    target: "petersburg",
    license: "GPL-3.0"
  })
  .then(res => {
    console.log('status:', res.status)
    console.log('response:', res)
  })
  .catch(error => {
    console.error('error:', error)
  })