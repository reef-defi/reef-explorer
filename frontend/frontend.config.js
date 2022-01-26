export const network = {
  id: 'reef-testnet',
  name: 'Testnet',
  tokenSymbol: 'REEF',
  tokenDecimals: 18,
  ss58Format: 42,
  coinGeckoDenom: undefined,
  nodeWs: 'wss://rpc-testnet.reefscan.com/ws',
  backendWs: 'wss://testnet.reefscan.com/graphql',
  backendHttp: 'https://testnet.reefscan.com/graphql',
  verificatorApi:
    'https://testnet.reefscan.com/graphql/verificator/submit-verification',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/reef.scss',
}
export const paginationOptions = [10, 20, 50, 100]
