export const network = {
  id: 'reef-testnet',
  name: 'Testnet',
  tokenSymbol: 'REEF',
  tokenDecimals: 18,
  ss58Format: 42,
  coinGeckoDenom: 'reef',
  nodeWs: 'wss://rpc-testnet.reefscan.com/ws',
  backendWs: 'wss://testnet.reefscan.com/api/v3',
  backendHttp: 'https://testnet.reefscan.com/api/v3',
  verificatorApi:
    'https://testnet.reefscan.com/api/verificator/submit-verification',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/reef.scss',
}
export const paginationOptions = [10, 20, 50, 100]
