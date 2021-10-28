const axios = require('axios');

const ApiEndPoint = 'https://dev.reef.polkastats.io/api/verificator/test-manual-contract-verification';

const source = `
contract Flipper {
	bool private value;

	/// Constructor that initializes the \`bool\` value to the given \`init_value\`.
	constructor(bool initvalue) public {
		value = initvalue;
	}

	/// A message that can be called on instantiated contracts.
	/// This one flips the value of the stored \`bool\` from \`true\`
	/// to \`false\` and vice versa.
	function flip() public {
		value = !value;
	}

	/// Simply returns the current value of our \`bool\`.
	function get() public view returns (bool) {
		return value;
	}
}
`;
const sourceObj = {
  "Flipper.sol": source
}
const test = {
  filename: 'Flipper.sol',
  source: JSON.stringify(sourceObj),
  address: '0x15982dC4DDf3eED54C9D749a5b3108064E98C35b', // https://dev.reef.polkastats.io/contract/0x15982dC4DDf3eED54C9D749a5b3108064E98C35b
  compilerVersion: 'v0.7.3+commit.9bfce1f6',
  arguments: '[true]',
  optimization: "false",
  runs: 200,
  name: "Flipper",
  target: 'petersburg',
  license: 'none',
  token: '1234' // any value will autenticate
}

axios
  .post(ApiEndPoint, test)
  .then((res) => res.data)
  .then(res => {
    console.log('response:', res)
  })
  .catch(error => {
    console.error('error:', error.response.data)
  });