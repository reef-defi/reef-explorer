const axios = require('axios');

const ApiEndPoint = 'https://testnet.reefscan.com/api/user-balance';

//
// Endpoint: /api/user-balance
//
// Method: POST
//
// Params:
//
// userAddress: account id or EVM address
//


axios
  .post(ApiEndPoint, {
    userAddress: "5F6ssGuH3Yz2HqZNM5sMocZF5rpr1eCMmccSz7F4MUYNuzic", // https://testnet.reefscan.com/account/5HKFJ94TydnDLLe8Tf5pve4YybksgX1CW55i849tLNGEp7cK
  })
  .then(res => {
    // console.log('status:', res.status);
    // console.log('response:', res);
    console.log('data:', JSON.stringify(res.data, null, 2));
  })
  .catch(error => {
    console.error('error:', error);
  })