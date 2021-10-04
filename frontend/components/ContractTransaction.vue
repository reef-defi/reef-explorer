<template>
  <div
    v-if="extrinsic && contract"
    class="contract-transaction table-responsive pb-4"
  >
    <table class="table table-striped extrinsic-table">
      <tbody>
        <tr>
          <td>Hash</td>
          <td>
            {{ extrinsic.hash }}
          </td>
        </tr>
        <tr>
          <td>Status</td>
          <td>
            <font-awesome-icon
              v-if="extrinsic.success"
              icon="check"
              class="text-success"
            />
            <font-awesome-icon v-else icon="times" class="text-danger" />
            <template v-if="!extrinsic.success">
              <Promised
                :promise="
                  getExtrinsicFailedFriendlyError(
                    extrinsic.block_number,
                    extrinsic.extrinsic_index,
                    $apollo.provider.defaultClient
                  )
                "
              >
                <template #default="data"
                  ><span class="text-danger ml-2">{{ data }}</span></template
                >
              </Promised>
            </template>
          </td>
        </tr>
        <tr>
          <td>Signer</td>
          <td>
            <div v-if="extrinsic.signer">
              <Identicon
                :key="extrinsic.signer"
                :address="extrinsic.signer"
                :size="20"
              />
              <nuxt-link :to="`/account/${extrinsic.signer}`">
                {{ shortAddress(extrinsic.signer) }}
              </nuxt-link>
            </div>
          </td>
        </tr>
        <tr>
          <td>Signer EVM address</td>
          <td>
            <div v-if="evmAddress">
              <eth-identicon :address="evmAddress" :size="16" />
              <nuxt-link :to="`/account/${extrinsic.signer}`">
                {{ evmAddress }}
              </nuxt-link>
            </div>
          </td>
        </tr>
        <tr>
          <td>Contract</td>
          <td>
            <eth-identicon :address="contract.contract_id" :size="16" />
            <nuxt-link :to="`/contract/${contract.contract_id}`">
              {{ contract.contract_id }}
            </nuxt-link>
          </td>
        </tr>
        <tr>
          <td>Block number</td>
          <td>
            <nuxt-link :to="`/block?blockNumber=${extrinsic.block_number}`">
              #{{ formatNumber(extrinsic.block_number) }}
            </nuxt-link>
          </td>
        </tr>
        <tr>
          <td>Timestamp</td>
          <td>
            <p class="mb-0">
              <font-awesome-icon :icon="['far', 'clock']" />
              {{ fromNow(extrinsic.timestamp) }}
              ({{ formatTimestamp(extrinsic.timestamp) }})
            </p>
          </td>
        </tr>
        <tr>
          <td>Extrinsic</td>
          <td>
            <p class="mb-0">
              <nuxt-link
                v-b-tooltip.hover
                :to="`/extrinsic/${extrinsic.block_number}/${extrinsic.extrinsic_index}`"
                title="Check extrinsic information"
              >
                #{{ formatNumber(extrinsic.block_number) }}-{{
                  extrinsic.extrinsic_index
                }}
              </nuxt-link>
            </p>
          </td>
        </tr>
        <template v-if="contract.verified || contract.is_erc20">
          <tr>
            <td>Parsed message</td>
            <td>
              <pre class="mb-0">{{
                JSON.stringify(
                  parseMessage(
                    JSON.parse(extrinsic.args)[1],
                    contract.verified ? JSON.parse(contract.abi) : erc20Abi
                  ),
                  null,
                  2
                )
              }}</pre>
            </td>
          </tr>
          <tr>
            <td>Message</td>
            <td>
              {{ JSON.parse(extrinsic.args)[1] }}
            </td>
          </tr>
          <tr>
            <td>Value</td>
            <td>
              {{ JSON.parse(extrinsic.args)[2] }}
            </td>
          </tr>
          <tr>
            <td>Gas limit</td>
            <td>
              {{ JSON.parse(extrinsic.args)[3] }}
            </td>
          </tr>
        </template>
        <template v-else>
          <tr>
            <td>Message</td>
            <td>
              {{ JSON.parse(extrinsic.args)[1] }}
            </td>
          </tr>
          <tr>
            <td>Value</td>
            <td>
              {{ JSON.parse(extrinsic.args)[2] }}
            </td>
          </tr>
          <tr>
            <td>Gas limit</td>
            <td>
              {{ JSON.parse(extrinsic.args)[3] }}
            </td>
          </tr>
        </template>
        <tr>
          <td>Weight</td>
          <td>
            <div v-if="extrinsic.fee_info">
              {{ formatNumber(JSON.parse(extrinsic.fee_info).weight) }}
            </div>
          </td>
        </tr>
        <tr>
          <td>Fee class</td>
          <td>
            <div v-if="extrinsic.fee_info">
              {{ JSON.parse(extrinsic.fee_info).class }}
            </div>
          </td>
        </tr>
        <tr>
          <td>Fee</td>
          <td class="amount">
            <div v-if="extrinsic.fee_info">
              {{ formatAmount(JSON.parse(extrinsic.fee_info).partialFee) }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { Promised } from 'vue-promised'
import InputDataDecoder from 'ethereum-input-data-decoder'
import gql from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import erc20Abi from '@/assets/erc20Abi.json'
export default {
  components: { Promised },
  mixins: [commonMixin],
  props: {
    contract: {
      type: Object,
      default: undefined,
    },
    extrinsic: {
      type: Object,
      default: undefined,
    },
  },
  data() {
    return {
      erc20Abi,
      evmAddress: undefined,
    }
  },
  async created() {
    this.evmAddress = await this.getEVMAddress(this.extrinsic.signer)
  },
  methods: {
    parseMessage(message, abi) {
      // this could fail if contract is erc20 token and
      // it's not verified and the call is not an standard
      // ERC-20 interface method call
      let decoded = ''
      try {
        const decoder = new InputDataDecoder(abi)
        decoded = decoder.decodeData(message)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('decoding error:', error)
      }
      return decoded
    },
    async getEVMAddress(accountId) {
      const client = this.$apolloProvider.defaultClient
      const query = gql`
          query account {
            account(where: {account_id: {_eq: "${accountId}"}}) {
              evm_address
            }
          }
        `
      const response = await client.query({ query })
      if (response.data.account.length > 0) {
        const evmAddress = response.data.account[0].evm_address
        if (evmAddress) {
          return evmAddress
        } else {
          return ''
        }
      } else {
        return ''
      }
    },
  },
}
</script>
<style>
.contract-transaction td {
  word-break: break-all;
}
</style>
