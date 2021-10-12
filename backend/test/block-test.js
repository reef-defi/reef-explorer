const { Provider } = require('@reef-defi/evm-provider');
const { WsProvider } = require('@polkadot/api');
const nodeWs = 'wss://rpc-testnet.reefscan.com/ws';

const main = async() => {
  const provider = new Provider({
    provider: new WsProvider(nodeWs),
  });
  await provider.api.isReady;
  const { api } = provider;
  
  const blockNumber = 5026;
  const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
  const { block } = await api.rpc.chain.getBlock(blockHash);
  block.extrinsics.map((extrinsic) => console.log(extrinsic.toHuman()));
  block.extrinsics.map((extrinsic) => extrinsic.args.map(arg => console.log(arg.toHuman())));
}


main().catch((error) => {
  console.error(error);
})
  