export const network = {
  id: 'reef-testnet',
  name: 'Testnet',
  tokenSymbol: 'REEF',
  tokenDecimals: 18,
  ss58Format: 42,
  coinGeckoDenom: 'reef-finance',
  nodeWs: 'wss://rpc-testnet.reefscan.com/ws',
  backendWs: 'ws://localhost:8080/v1/graphql',
  backendHttp: 'http://localhost:8080/v1/graphql',
  verificatorApi: 'https://testnet.reefscan.com/api/verificator',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/reef.scss',
}
export const paginationOptions = [10, 20, 50, 100]
