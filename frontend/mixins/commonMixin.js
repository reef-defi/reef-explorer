import { hexToU8a, isHex } from '@polkadot/util'
import { BigNumber } from 'bignumber.js'
import { gql } from 'graphql-tag'
import { decodeAddress, encodeAddress } from '@polkadot/keyring'
import { checkAddressChecksum } from 'web3-utils'
import moment from 'moment'
import { network } from '@/frontend.config.js'
import { reefChainErrors } from '@/reef-chain-errors.js'

export default {
  methods: {
    shortAddress(address) {
      return (
        address.substring(0, 5) + '…' + address.substring(address.length - 5)
      )
    },
    shortHash(hash) {
      return `${hash.substr(0, 6)}…${hash.substr(hash.length - 4, 4)}`
    },
    formatNumber(number) {
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
      const polkadotRegexp = /^[0-9]*$/
      return polkadotRegexp.test(input)
    },
    async isBlockHash(input) {
      // 0xadb2179b1666fef3b56a5762c3db0152b2a0a7f3d4b47737a355262609d867b9
      if (input.length === 66 && input.startsWith('0x')) {
        const client = this.$apollo.provider.defaultClient
        const query = gql`
          query block {
            block(limit: 1, where: {block_hash: {_eq: "${input}"}}) {
              block_number
            }
          }
        `
        const response = await client.query({ query })
        return response.data.block.length > 0
      }
      return false
    },
    async isExtrinsicHash(input) {
      // 0x3eab8af8321eb77e425396d029486739b7563965a4052211d5076a9e80f6010e
      if (input.length === 66 && input.startsWith('0x')) {
        const client = this.$apollo.provider.defaultClient
        const query = gql`
          query extrinsic {
            extrinsic(limit: 1, where: {hash: {_eq: "${input}"}}) {
              block_number
            }
          }
        `
        const response = await client.query({ query })
        return response.data.extrinsic.length > 0
      }
      return false
    },
    isHash(input) {
      // 0x3eab8af8321eb77e425396d029486739b7563965a4052211d5076a9e80f6010e
      if (input) {
        if (input.length === 66 && input.startsWith('0x')) {
          return true
        }
      }
      return false
    },
    isAddress(input) {
      const polkadotRegexp = /^(([0-9a-zA-Z]{47})|([0-9a-zA-Z]{48}))$/
      return polkadotRegexp.test(input)
    },
    getDateFromTimestamp(timestamp) {
      if (timestamp === 0) {
        return `--`
      }
      const newDate = new Date()
      newDate.setTime(timestamp * 1000)
      return newDate.toUTCString()
    },
    isValidAddressPolkadotAddress: (address) => {
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
      if (!checkAddressChecksum(contractId)) {
        return false
      }
      return true
    },
    //
    // Some error samples:
    //
    // [{"module":{"index":6,"error":5}},{"weight":194407000,"class":"Normal","paysFee":"Yes"}]
    // [{"badOrigin":null},{"weight":204203000,"class":"Normal","paysFee":"Yes"}]
    // [{"other":null},{"weight":98721,"class":"Normal","paysFee":"Yes"}]
    //
    getExtrinsicFailedFriendlyError: async (
      blockNumber,
      extrinsicIndex,
      apolloClient
    ) => {
      const query = gql`
        query event {
          event(
            limit: 1
            where: {
              block_number: { _eq: "${blockNumber}" }
              event_index: { _eq: "${extrinsicIndex}" }
              method: { _eq: "ExtrinsicFailed" }
            }
          ) {
            data
          }
        }
      `
      const response = await apolloClient.query({ query })
      const jsonData = JSON.parse(response.data.event[0].data)
      if (jsonData[0]?.badOrigin === null) {
        return 'Bad origin'
      } else if (jsonData[0]?.other === null) {
        return 'Other error'
      } else if (jsonData[0]?.module) {
        return reefChainErrors
          .find((module) => module.index === jsonData[0].module.index)
          .errors.find((error) => error.index === jsonData[0].module.error)
          .description
      }
      return ''
    },
    fromNow: (timestamp) => {
      moment.relativeTimeThreshold('s', 60)
      moment.relativeTimeThreshold('ss', 0)
      const date = moment.unix(timestamp)
      return moment(date).fromNow()
    },
    formatTimestamp: (timestamp) => {
      return moment.unix(timestamp).format('YYYY/MM/DD HH:mm:ss')
    },
    getAge(timestamp) {
      const date = moment.unix(timestamp)
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
  },
}
