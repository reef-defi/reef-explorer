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
    address: "0x0bE5d13614bcA7053d1C120EEF56c7695D46Fb49", // https://reefscan.com/contract/0x0bE5d13614bcA7053d1C120EEF56c7695D46Fb49
    name: "Storage",
    source: "// SPDX-License-Identifier: GPL-3.0\r\npragma solidity >=0.7.0 <0.9.0;\r\n/**\r\n * @title Storage\r\n * @dev Store & retrieve value in a variable\r\n */\r\ncontract Storage {\r\n    uint256 number;\r\n    /**\r\n     * @dev Store value in variable\r\n     * @param num value to store\r\n     */\r\n    function store(uint256 num) public {\r\n        number = num;\r\n    }\r\n    /**\r\n     * @dev Return value \r\n     * @return value of 'number'\r\n     */\r\n    function retrieve() public view returns (uint256){\r\n        return number;\r\n    }\r\n}",
    bytecode: "0x608060405234801561001057600080fd5b5060c78061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632e64cec11460375780636057361d146053575b600080fd5b603d607e565b6040518082815260200191505060405180910390f35b607c60048036036020811015606757600080fd5b81019080803590602001909291905050506087565b005b60008054905090565b806000819055505056fea2646970667358221220d2bd9d97dd978b0be5f547bde41e8c7af069487ea075e8b7fa069f05322a6ea064736f6c63430007060033",
    arguments: "[]",
    abi: '[{"inputs":[],"name":"retrieve","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"num","type":"uint256"}],"name":"store","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
    compilerVersion: "v0.7.6+commit.7338295f",
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