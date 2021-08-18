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
    // address: "0xd5Bd58976fEE1914dE352d335E8d82761F96577d", // https://reefscan.com/contract/0xEBB1dd05dEf03EdF5dD47738153436969853a695
    // name: "Storage",
    // source: "// SPDX-License-Identifier: GPL-3.0\r\npragma solidity >=0.7.0 <0.9.0;\r\n/**\r\n * @title Storage\r\n * @dev Store & retrieve value in a variable\r\n */\r\ncontract Storage {\r\n    uint256 number;\r\n    /**\r\n     * @dev Store value in variable\r\n     * @param num value to store\r\n     */\r\n    function store(uint256 num) public {\r\n        number = num;\r\n    }\r\n    /**\r\n     * @dev Return value \r\n     * @return value of 'number'\r\n     */\r\n    function retrieve() public view returns (uint256){\r\n        return number;\r\n    }\r\n}",
    // bytecode: "0x6080604052348015600f57600080fd5b5060ac8061001e6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632e64cec11460375780636057361d14604c575b600080fd5b60005460405190815260200160405180910390f35b605c6057366004605e565b600055565b005b600060208284031215606f57600080fd5b503591905056fea26469706673582212204748f5bdc9e72c9c212709f26cd60fb1e6593fecaba24eeefe8cc71842a7851d64736f6c63430008060033",
    // arguments: "[]",
    // abi: '[{"inputs":[],"name":"retrieve","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"num","type":"uint256"}],"name":"store","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
    // compilerVersion: "v0.8.6+commit.11564f7e",
    // optimization: "true",
    // runs: "200",
    // target: "petersburg",
    // license: "GPL-3.0"
    abi: '[{"inputs":[],"name":"retrieve","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"num","type":"uint256"}],"name":"store","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
    address: "0xd5Bd58976fEE1914dE352d335E8d82761F96577d",
    arguments: "[]",
    bytecode: "0x608060405234801561001057600080fd5b5061012f806100206000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80632e64cec11460375780636057361d146051575b600080fd5b603d6069565b6040516048919060c2565b60405180910390f35b6067600480360381019060639190608f565b6072565b005b60008054905090565b8060008190555050565b60008135905060898160e5565b92915050565b60006020828403121560a057600080fd5b600060ac84828501607c565b91505092915050565b60bc8160db565b82525050565b600060208201905060d5600083018460b5565b92915050565b6000819050919050565b60ec8160db565b811460f657600080fd5b5056fea2646970667358221220c019e4614043d8adc295c3046ba5142c603ab309adeef171f330c51c38f1498964736f6c63430008040033",
    compilerVersion: "v0.8.4+commit.c7e474f2",
    license: "GPL-3.0",
    name: "Storage",
    optimization: "false",
    runs: "200",
    source: "// SPDX-License-Identifier: GPL-3.0\n\npragma solidity >=0.7.0 <0.9.0;\n\n/**\n * @title Storage\n * @dev Store & retrieve value in a variable\n */\ncontract Storage {\n\n    uint256 number;\n\n    /**\n     * @dev Store value in variable\n     * @param num value to store\n     */\n    function store(uint256 num) public {\n        number = num;\n    }\n\n    /**\n     * @dev Return value \n     * @return value of 'number'\n     */\n    function retrieve() public view returns (uint256){\n        return number;\n    }\n}",
    target: "default",
  })
  .then(res => {
    console.log('status:', res.status)
    console.log('response:', res)
  })
  .catch(error => {
    console.error('error:', error)
  })