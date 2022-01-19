<template>
  <Data v-if="extrinsic && contract" class="contract-transaction">
    <Row>
      <Cell>Hash</Cell>
      <Cell>{{ extrinsic.hash }}</Cell>
    </Row>

    <template v-if="!!extrinsic.error_message">
      <Row>
        <Cell>Error Description</Cell>
        <Cell>
          {{ extrinsic.error_message }}
        </Cell>
      </Row>
    </template>

    <Row class="contract-transaction__identicon-link">
      <Cell>Signer</Cell>
      <Cell>
        <div v-if="extrinsic.signer">
          <ReefIdenticon
            :key="extrinsic.signer"
            :address="extrinsic.signer"
            :size="20"
          />
          <nuxt-link :to="`/account/${extrinsic.signer}`">
            {{ extrinsic.signer }}
          </nuxt-link>
        </div>
      </Cell>
    </Row>

    <Row class="contract-transaction__identicon-link">
      <Cell>Signer EVM address</Cell>
      <Cell>
        <div v-if="evmAddress">
          <eth-identicon :address="evmAddress" :size="16" />
          <nuxt-link :to="`/account/${extrinsic.signer}`">
            {{ evmAddress }}
          </nuxt-link>
        </div>
      </Cell>
    </Row>

    <Row class="contract-transaction__identicon-link">
      <Cell>Contract</Cell>
      <Cell>
        <div>
          <eth-identicon :address="contract.address" :size="16" />
          <nuxt-link :to="`/contract/${contract.address}`">
            {{ contract.address }}
          </nuxt-link>
        </div>
      </Cell>
    </Row>

    <Row>
      <Cell>Block number</Cell>
      <Cell>
        <nuxt-link :to="`/block?blockNumber=${extrinsic.block_id}`">
          # {{ formatNumber(extrinsic.block_id) }}
        </nuxt-link>
      </Cell>
    </Row>

    <Row>
      <Cell>Timestamop</Cell>
      <Cell class="list-view__age">
        <font-awesome-icon :icon="['far', 'clock']" />
        <span>{{ getAge(extrinsic.timestamp) }}</span>
        <span>({{ formatTimestamp(extrinsic.timestamp) }})</span>
      </Cell>
    </Row>

    <Row>
      <Cell>Extrinsic</Cell>
      <Cell>
        <nuxt-link
          v-b-tooltip.hover
          :to="`/extrinsic/${extrinsic.block_id}/${extrinsic.index}`"
          title="Check extrinsic information"
        >
          # {{ formatNumber(extrinsic.block_id) }}-{{ extrinsic.index }}
        </nuxt-link>
      </Cell>
    </Row>

    <Row class="contract-transaction__data">
      <Cell>Parsed Message</Cell>
      <Cell>
        <pre>{{
          JSON.stringify(
            parseMessage(
              extrinsic.args[1],
              contract.verified ? JSON.parse(contract.abi) : erc20Abi
            ),
            null,
            2
          )
        }}</pre>
      </Cell>
    </Row>

    <Row>
      <Cell>Message</Cell>
      <Cell>{{ extrinsic.args[1] }}</Cell>
    </Row>

    <Row>
      <Cell>Value</Cell>
      <Cell>{{ extrinsic.args[2] }}</Cell>
    </Row>

    <Row>
      <Cell>Gas limit</Cell>
      <Cell>{{ extrinsic.args[3] }}</Cell>
    </Row>

    <Row>
      <Cell>Weight</Cell>
      <Cell>
        <!--        TODO Ziga - fee_info things below -->
        <div v-if="extrinsic.fee_info">
          {{ formatNumber(JSON.parse(extrinsic.fee_info).weight) }}
        </div>
      </Cell>
    </Row>

    <Row>
      <Cell>Fee class</Cell>
      <Cell>
        <div v-if="extrinsic.fee_info">
          {{ JSON.parse(extrinsic.fee_info).class }}
        </div>
      </Cell>
    </Row>

    <Row>
      <Cell>Fee</Cell>
      <Cell class="contract-transaction__fee">
        <div v-if="extrinsic.fee_info">
          {{ formatAmount(JSON.parse(extrinsic.fee_info).partialFee) }}
        </div>
      </Cell>
    </Row>
  </Data>
</template>

<script>
import { ethers } from 'ethers'
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import erc20Abi from '@/assets/erc20Abi.json'
export default {
  components: {},
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
        const iface = new ethers.utils.Interface(abi)
        const value = ethers.utils.parseEther('1.0')
        decoded = iface.parseTransaction({ data: message, value })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('tx data decoding error:', error)
      }
      return decoded
    },
    async getEVMAddress(accountId) {
      const client = this.$apolloProvider.defaultClient
      const query = gql`
          query account {
            account(where: {address: {_eq: "${accountId}"}}) {
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

<style lang="scss">
.contract-transaction {
  .contract-transaction__identicon-link {
    .table-cell__content {
      > div {
        display: flex;
        justify-content: flex-start;
        align-items: center;

        a {
          background: linear-gradient(90deg, #a93185, #5531a9);
          //noinspection CssInvalidPropertyValue
          background-clip: text;
          -webkit-text-fill-color: transparent;
          position: relative;

          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 1px;
            left: 0;
            right: 0;
            margin: 0 auto;
            opacity: 0;
            transform: translateY(3px);
            background: linear-gradient(90deg, #a93185, #5531a9);
            transition: all 0.15s;
          }

          &:hover {
            &::after {
              opacity: 1;
              transform: none;
            }
          }
        }
      }
    }
  }

  .contract-transaction__data {
    .table-cell {
      &:last-child {
        .table-cell__content-wrapper {
          height: unset;
          max-height: unset;

          .table-cell__content {
            padding: 15px 0;
            white-space: initial;
            line-height: 1.6;

            pre {
              font-size: 13px;
              line-height: 15px;
              font-weight: 500;
              color: #3e3f42;
              margin: 0;
            }
          }
        }
      }
    }
  }

  .contract-transaction__fee {
    .table-cell__content {
      font-weight: 600;
    }
  }
}
</style>
