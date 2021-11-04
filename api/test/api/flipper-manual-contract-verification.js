const axios = require('axios');

const source = `
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
`;
const s1 = {
  "Flipper.sol": "\ncontract Flipper {\n    bool private value;\n    /// Constructor that initializes the `bool` value to the given `init_value`.\n    constructor(bool initvalue) public {\n        value = initvalue;\n    }\n    /// A message that can be called on instantiated contracts.\n    /// This one flips the value of the stored `bool` from `true`\n    /// to `false` and vice versa.\n    function flip() public {\n        value = !value;\n    }\n    /// Simply returns the current value of our `bool`.\n    function get() public view returns (bool) {\n        return value;\n    }\n}"
}

const sourceObj = {"Flipper.sol": source};
const test = {
  filename: 'Flipper.sol',
  source: JSON.stringify(s1),
  address: '0x49251e3df078cAAfC803F92cD2F50441eF378868',
  compilerVersion: 'v0.8.4+commit.c7e474f2',
  arguments: '[false]',
  optimization: "false",
  runs: 200,
  name: "Flipper",
  target: 'petersburg',
  license: 'none',
  token: '03AGdBq25hqXMgQ74xXObLBLvR-buH3CCb-wKiahD-taF2OllNlRmVHbb-mYdsziJ4DoGDA7A4HULhoZtqlbdaO0xJ6p1Rw0nl4-_uXBiAYPGujt65mbVea7hr05PjqFEp3L0-pzYlCCnCdNeQLEOl39y2PPewNbHAwIkzXzQwyRixDAKLJN9lGOmO4fmvhqkb0n5UK7DJjsfuc59CFqAAWDwiIEOUpoG8-V6rcfWW5IIKLEWxWJTpNUzB5044nX37Bmb8Fm3zctjxn2neBiwusc2BYPpt22mRYQp6FDbhtWr_YQyu2lyiUb0H6jafnKby0l6_MokR3Ccn-T6fQBYKR-HTEbEI362YA2PoxagO58Hs_gkz2lB5r7lnjh8cZbZM475TDDfx2zCyGaHpKCn_TW3CLse5hy0jlsON6SC_dWCJ5i9gdIQbfu_60u5RCVspuhIX2rEu3S7W'
}


const ApiEndPoint = 'http://localhost:3000/api/verificator/local-manual-contract-verification';
axios
  .post(ApiEndPoint, test)
  .then((res) => res.data)
  .then(res => {
    console.log('response:', res)
  })
  .catch(error => {
    console.error('error:', error.response.data)
  });