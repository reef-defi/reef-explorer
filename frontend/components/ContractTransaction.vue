<template>
  <Data v-if="extrinsic && contract" class="contract-transaction">
    <Row>
      <Cell>Hash</Cell>
      <Cell>{{ extrinsic.hash }}</Cell>
    </Row>

    <Row>
      <Cell>Status</Cell>
      <Cell>
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
      </Cell>
    </Row>

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
          <eth-identicon :address="contract.contract_id" :size="16" />
          <nuxt-link :to="`/contract/${contract.contract_id}`">
            {{ contract.contract_id }}
          </nuxt-link>
        </div>
      </Cell>
    </Row>

    <Row>
      <Cell>Block number</Cell>
      <Cell>
        <nuxt-link :to="`/block?blockNumber=${extrinsic.block_number}`">
          # {{ formatNumber(extrinsic.block_number) }}
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
          :to="`/extrinsic/${extrinsic.block_number}/${extrinsic.extrinsic_index}`"
          title="Check extrinsic information"
        >
          # {{ formatNumber(extrinsic.block_number) }}-{{
            extrinsic.extrinsic_index
          }}
        </nuxt-link>
      </Cell>
    </Row>

    <Row class="contract-transaction__data">
      <Cell>Parsed Message</Cell>
      <Cell>
        <pre>{{
          JSON.stringify(
            parseMessage(
              JSON.parse(extrinsic.args)[1],
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
      <Cell>{{ JSON.parse(extrinsic.args)[1] }}</Cell>
    </Row>

    <Row>
      <Cell>Value</Cell>
      <Cell>{{ JSON.parse(extrinsic.args)[2] }}</Cell>
    </Row>

    <Row>
      <Cell>Gas limit</Cell>
      <Cell>{{ JSON.parse(extrinsic.args)[3] }}</Cell>
    </Row>

    <Row>
      <Cell>Weight</Cell>
      <Cell>
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
import { Promised } from 'vue-promised'
import { ethers } from 'ethers'
import { gql } from 'graphql-tag'
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
