//
// Get Reef ERC20 token holders
//
const { options } = require('@reef-defi/api');
const { Provider } = require('@reef-defi/evm-provider');
const { WsProvider } = require('@polkadot/api');
const { ethers } = require('ethers');
const fetch = require('node-fetch');

const nodeWs = 'wss://rpc-testnet.reefscan.com/ws';
const contractId = '0xFFD81b3C5F83335675833d494b60095ad2B20aBf'; // PINOCOIN https://testnet.reefscan.com/contract/0xFFD81b3C5F83335675833d494b60095ad2B20aBf
const contractAbi = '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"_decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
const graphQL = 'https://testnet.reefscan.com/api/v3';
const query = `
  query account {
    account(where: { evm_address: { _neq: ""} }) {
      evm_address
    }
  }`;
let evmAddresses = [];

const main = async () => {
  await fetch(graphQL, {
    method: 'POST',
    body: JSON.stringify({query}),
  }).then(res => res.text())
    .then(body => {
      JSON.parse(body).data.account.forEach(account => {
        evmAddresses.push(account.evm_address);
      });
    })
    .catch(error => console.error('Error:', error));
  // console.log('EVM addreses:', evmAddresses);
  const provider = new Provider(
    options({
      provider: new WsProvider(nodeWs),
    })
  );
  await provider.api.isReady;
  const contract = new ethers.Contract(
    contractId,
    contractAbi,
    provider
  )
  const tokenName = await contract['name()']();
  const tokenSymbol = await contract['symbol()']();
  const tokenDecimals = await contract['decimals()']();
  const tokenTotalSupply = await contract['totalSupply()']();
  console.log(`Token ${tokenName} (${contractId}):`);
  console.log(`-> Supply: ${tokenTotalSupply}`);
  console.log(`-> Symbol: ${tokenSymbol}`);
  console.log(`-> Decimals ${tokenDecimals}`);
  console.log('-> Holders:');
  for (const evmAdress of evmAddresses) {
    const balance = await contract['balanceOf'](evmAdress);
    if (balance > 0) {
      console.log(evmAdress, balance.toString());
    }
  }
  await provider.api.disconnect();
};

main().catch((error) => console.log(error));