import { hexToU8a, isHex } from '@polkadot/util'
import { BigNumber } from 'bignumber.js'
import { gql } from 'graphql-tag'
import { decodeAddress, encodeAddress } from '@polkadot/keyring'
import moment from 'moment'
import { utils } from 'ethers'
import { network } from '@/frontend.config.js'

const isTimestamp = (timestampOrDateString) => {
  return !timestampOrDateString.toString().includes('-')
}
const toMomentDate = (timestampOrDateString) => {
  return isTimestamp(timestampOrDateString)
    ? moment.unix(timestampOrDateString)
    : moment(timestampOrDateString)
}

// Function is ment to accept only whole numbers without decimal point!
const formatLargeNumber = (num, dec = '0') => {
  if (num.includes('.')) {
    throw new Error(
      'formatLargeNumber function is not ment to process decimal numbers!'
    )
  }
  let intAmo = num
  let decAmo = dec
  let postfix = ''
  if (num.length > 12) {
    intAmo = num.slice(0, num.length - 12)
    decAmo = num.slice(num.length - 12, num.length - 9)
    postfix = 'T'
  } else if (num.length > 9) {
    intAmo = num.slice(0, num.length - 9)
    decAmo = num.slice(num.length - 9, num.length - 6)
    postfix = 'B'
  } else if (num.length > 6) {
    intAmo = num.slice(0, num.length - 6)
    decAmo = num.slice(num.length - 6, num.length - 3)
    postfix = 'M'
  } else if (num.length > 3) {
    intAmo = num.slice(0, num.length - 3)
    decAmo = num.slice(num.length - 3)
    postfix = 'k'
  }
  decAmo = decAmo.replace(/0+/, '')
  decAmo = decAmo !== '' ? '.' + decAmo.slice(0, 3) : ''
  return `${intAmo}${decAmo}${postfix}`
}

const formatDecimalNumber = (num) => {
  let firstNumberIndex = 0
  for (; firstNumberIndex < num.length; firstNumberIndex++) {
    if (num[firstNumberIndex] !== '0') {
      break
    }
  }
  num = num
    .slice(0, Math.min(num.length, firstNumberIndex + 3))
    .replace(/0+$/, '')
  return num
}

export default {
  methods: {
    toContractAddress(address) {
      return utils.getAddress(address.trim().toLowerCase())
    },
    shortAddress(address) {
      return (
        address.substring(0, 5) + '…' + address.substring(address.length - 5)
      )
    },
    shortHash(hash) {
      if (!hash) {
        return ''
      }
      return `${hash.substr(0, 6)}…${hash.substr(hash.length - 4, 4)}`
    },
    formatNumber(number = '') {
      if (isHex(number)) {
        return parseInt(number, 16)
          .toString()
          .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
      } else {
        return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
      }
    },
    formatShortAmount(amount, symbol, decimals) {
      if (!symbol) {
        symbol = network.tokenSymbol
      }
      if (!decimals) {
        decimals = network.tokenDecimals
      }

      const bn = new BigNumber(amount)
        .div(new BigNumber(10).pow(decimals))
        .toFormat()
        .replaceAll(',', '')

      const decimalPoint = bn.indexOf('.')

      if (decimalPoint === -1) {
        return `${formatLargeNumber(bn)} ${symbol}`
      } else {
        const intAmo = bn.slice(0, decimalPoint)
        const decAmo = bn.slice(decimalPoint + 1, bn.length) + '000'
        if (intAmo === '0') {
          return `0.${formatDecimalNumber(decAmo)} ${symbol}`
        } else {
          return `${formatLargeNumber(intAmo, decAmo)} ${symbol}`
        }
      }
    },
    formatAmount(amount, symbol, decimals) {
      if (!symbol) {
        symbol = network.tokenSymbol
      }
      if (!decimals) {
        decimals = network.tokenDecimals
      }

      const amo = new BigNumber(amount).div(new BigNumber(10).pow(decimals))

      return `${amo.toFormat()} ${symbol}`
    },
    formatTokenAmount(amount, decimals, denom) {
      return `${new BigNumber(amount)
        .div(new BigNumber(10).pow(decimals))
        .toFixed(2)
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')} ${denom}`
    },
    capitalize(s) {
      if (typeof s !== 'string') return ''
      return s.charAt(0).toUpperCase() + s.slice(1)
    },
    isBlockNumber(input) {
      if (!input || !input.toString()) {
        return false
      }
      const polkadotRegexp = /^[0-9]*$/
      return polkadotRegexp.test(input)
    },
    async isBlockHash(input) {
      input = input.trim()
      if (!input || !input.toString()) {
        return false
      }
      // 0xadb2179b1666fef3b56a5762c3db0152b2a0a7f3d4b47737a355262609d867b9
      if (input.length === 66 && input.startsWith('0x')) {
        const client = this.$apollo.provider.defaultClient
        const query = gql`
          query block {
            block(limit: 1, where: {hash: {_eq: "${input}"}}) {
              id
            }
          }
        `
        const response = await client.query({ query })
        return response.data.block.length > 0
      }
      return false
    },
    async isExtrinsicHash(input) {
      input = input.trim()
      if (!input || !input.toString()) {
        return false
      }
      // 0x3eab8af8321eb77e425396d029486739b7563965a4052211d5076a9e80f6010e
      if (input.length === 66 && input.startsWith('0x')) {
        const client = this.$apollo.provider.defaultClient
        const query = gql`
          query extrinsic {
            extrinsic(limit: 1, where: {hash: {_eq: "${input}"}}) {
              block_id
            }
          }
        `
        const response = await client.query({ query })
        return response.data.extrinsic.length > 0
      }
      return false
    },
    isHash(input) {
      if (!input || !input.toString()) {
        return false
      }
      // 0x3eab8af8321eb77e425396d029486739b7563965a4052211d5076a9e80f6010e
      if (input) {
        if (input.length === 66 && input.startsWith('0x')) {
          return true
        }
      }
      return false
    },
    isAddress(input) {
      if (!input || !input.toString()) {
        return false
      }
      const polkadotRegexp = /^(([0-9a-zA-Z]{47})|([0-9a-zA-Z]{48}))$/
      return polkadotRegexp.test(input)
    },
    isEvmAddress(input) {
      if (!input || !input.toString()) {
        return false
      }
      return utils.isAddress(input)
    },
    async isContractAddress(input) {
      input = input.trim()
      if (!input || !input.toString()) {
        return false
      }
      const address = this.toContractAddress(input)
      if (!this.isEvmAddress(address)) {
        return false
      }
      const client = this.$apollo.provider.defaultClient
      const query = gql`
          query contract {
            contract(limit: 1, where: {address: {_eq: "${address}"}}) {
              address
            }
          }
        `
      const response = await client.query({ query })
      return response.data.contract.length > 0
    },
    async isEvmAccountAddress(input) {
      input = input.trim()
      if (!input || !input.toString()) {
        return false
      }
      if (!this.isEvmAddress(input)) {
        return false
      }
      const client = this.$apollo.provider.defaultClient
      const query = gql`
          query account {
            account(limit: 1, where: {evm_address: {_eq: "${input}"}}) {
              evm_address
            }
          }
        `
      const response = await client.query({ query })
      return response.data.account.length > 0
    },
    getDateFromTimestamp(timestamp) {
      if (timestamp === 0) {
        return `--`
      }

      const newDate = toMomentDate(timestamp)
      return newDate.toString()
    },
    isValidAddressPolkadotAddress: (address) => {
      if (!address.toString()) {
        return false
      }
      try {
        encodeAddress(
          isHex(address) ? hexToU8a(address.toString()) : decodeAddress(address)
        )
        return true
      } catch (error) {
        return false
      }
    },
    isContractId: (contractId) => {
      if (!contractId) return false
      if (contractId.length !== 42) return false
      return true
    },
    // TODO gql returns date string so this might not be needed - check
    fromNow: (timestamp) => {
      moment.relativeTimeThreshold('s', 60)
      moment.relativeTimeThreshold('ss', 0)
      const date = toMomentDate(timestamp)
      return moment(date).fromNow()
    },
    formatTimestamp: (timestamp) => {
      return new Date(timestamp).toLocaleString()
    },
    getAge(timestamp) {
      const date = toMomentDate(timestamp)
      let diff = moment().diff(date, 'seconds')

      if (diff === 0) diff = 1
      let text

      if (diff >= 86400) {
        diff = Math.floor(diff / 60 / 60 / 24)
        if (diff === 1) text = 'day'
        else text = 'days'
      } else if (diff >= 3600) {
        diff = Math.floor(diff / 60 / 60)
        if (diff === 1) text = 'hour'
        else text = 'hours'
      } else if (diff >= 60) {
        diff = Math.floor(diff / 60)
        if (diff === 1) text = 'minute'
        else text = 'minutes'
      } else if (diff === 1) text = 'second'
      else text = 'seconds'

      return `${diff} ${text}`
    },
    getUnixTimestamp(value) {
      const mDate = moment(value)
      if (mDate._isValid) {
        return mDate.unix()
      }

      return value
    },
    sourceCode(data) {
      return (acc, current) => [
        ...acc,
        `\n// filename: ${current}\n---------------------------\n${data.contract[0].verified_contract.source[current]}`,
      ]
    },
  },
}
