const { ethers } = require('ethers');
const { Provider } = require('@reef-defi/evm-provider');
const { WsProvider } = require('@polkadot/api');
const nodeWs = 'wss://rpc-testnet.reefscan.com/ws';
const contractId = "0x1786695301da73C77A3428f11e60f2977ED8875c"; // Flipper
const contractAbi = [
  [
    {
      "inputs": [
        {
          "internalType": "bool",
          "name": "initvalue",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "flip",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "get",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
];

const main = async() => {
  const provider = new Provider({
    provider: new WsProvider(nodeWs),
  })
  await provider.api.isReady
  const contract = new ethers.Contract(contractId, contractAbi.flat(), provider);
  console.log(contract);
}

main();