import { hexToU8a, isHex } from '@polkadot/util'
import { BigNumber } from 'bignumber.js'
import { gql } from 'graphql-tag'
import { decodeAddress, encodeAddress } from '@polkadot/keyring'
import moment from 'moment'
import { network } from '@/frontend.config.js'

const isTimestamp = (timestampOrDateString) => {
  return !timestampOrDateString.toString().includes('-')
}
const toMomentDate = (timestampOrDateString) => {
  return isTimestamp(timestampOrDateString)
    ? moment.unix(timestampOrDateString)
    : moment(timestampOrDateString)
}

export default {
  methods: {
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
    formatAmount(amount) {
      return `${new BigNumber(amount)
        .div(new BigNumber(10).pow(network.tokenDecimals))
        .toFixed(2)
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')} ${network.tokenSymbol}`
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
      return toMomentDate(timestamp).format('YYYY/MM/DD HH:mm:ss')
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
