const axios = require('axios');

// const ApiEndPoint = 'https://testnet.reefscan.com/api/account/tokens';
const ApiEndPoint = 'https://dev.reef.polkastats.io/api/account/tokens';

//
// Endpoint: /api/account/tokens
//
// Method: POST
//
// Params:
//
// account: account id or EVM address
//

axios
  .post(ApiEndPoint, {
    account: "0x4a944a2b85afe9851bea6c33941f8adb85469d41", // https://testnet.reefscan.com/account/5HKFJ94TydnDLLe8Tf5pve4YybksgX1CW55i849tLNGEp7cK
  })
  .then(res => {
    // console.log('status:', res.status);
    // console.log('response:', res);
    console.log('data:', JSON.stringify(res.data, null, 2));
  })
  .catch(error => {
    console.error('error:', error);
  })

// axios
//   .post(ApiEndPoint, {
//     account: "5HKFJ94TydnDLLe8Tf5pve4YybksgX1CW55i849tLNGEp7cK", // https://testnet.reefscan.com/account/5HKFJ94TydnDLLe8Tf5pve4YybksgX1CW55i849tLNGEp7cK
//   })
//   .then(res => {
//     // console.log('status:', res.status);
//     // console.log('response:', res);
//     console.log('data:', JSON.stringify(res.data, null, 2));
//   })
//   .catch(error => {
//     console.error('error:', error);
//   })