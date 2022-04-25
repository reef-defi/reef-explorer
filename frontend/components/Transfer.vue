<template>
  <Card v-if="transfer" class="list-view transfer-details">
    <Headline> Transfer {{ shortHash($route.params.hash) }} </Headline>

    <Data>
      <Row>
        <Cell>Block number</Cell>
        <Cell
          ><nuxt-link :to="`/block?blockNumber=${transfer.block_id}`">
            # {{ formatNumber(transfer.block_id) }}
          </nuxt-link>
        </Cell>
      </Row>

      <Row>
        <Cell>Timestamp</Cell>
        <Cell>
          {{ fromNow(transfer.timestamp) }}
          ({{ formatTimestamp(transfer.timestamp) }})
        </Cell>
      </Row>

      <Row>
        <Cell>Extrinsic</Cell>
        <Cell>
          <nuxt-link
            :to="`/extrinsic/${transfer.block_id}/${transfer.extrinsic.index}`"
            title="Check extrinsic information"
          >
            # {{ formatNumber(transfer.block_id) }}-{{
              transfer.extrinsic.index
            }}
          </nuxt-link>
        </Cell>
      </Row>

      <Row>
        <Cell>Hash</Cell>
        <Cell>{{ transfer.extrinsic.hash }}</Cell>
      </Row>

      <Row class="transfer-details__from">
        <Cell>From</Cell>
        <Cell>
          <div v-if="transfer.from_address">
            <ReefIdenticon
              :key="transfer.from_address"
              :address="transfer.from_address"
              :size="20"
            />
            <nuxt-link :to="`/account/${transfer.from_address}`">
              {{ transfer.from_address }}
            </nuxt-link>
          </div>
        </Cell>
      </Row>

      <Row class="transfer-details__to">
        <Cell>To</Cell>
        <Cell>
          <div v-if="transfer.to_address">
            <ReefIdenticon
              :key="transfer.to_address"
              :address="transfer.to_address"
              :size="20"
            />
            <nuxt-link :to="`/account/${transfer.to_address}`">
              {{ transfer.to_address }}
            </nuxt-link>
          </div>
        </Cell>
      </Row>

      <Row class="transfer-details__deamon">
        <Cell>Token name</Cell>
        <Cell>
          <div v-if="transfer.denom && transfer.token_address">
            <nuxt-link :to="`/token/${transfer.token_address}`">
              {{ transfer.tokenName || transfer.denom }}
            </nuxt-link>
          </div>
        </Cell>
      </Row>

      <Row class="transfer-details__token_address">
        <Cell>Token address</Cell>
        <Cell>
          <div v-if="transfer.token_address">
            <eth-identicon :address="transfer.token_address" :size="20" />
            <nuxt-link :to="`/token/${transfer.token_address}`">
              {{ transfer.token_address }}
            </nuxt-link>
          </div>
        </Cell>
      </Row>

      <Row class="transfer-details__amount">
        <Cell>Amount</Cell>
        <Cell>{{
          formatAmount(transfer.amount, transfer.symbol, transfer.decimals)
        }}</Cell>
      </Row>

      <Row class="transfer-details__fee">
        <Cell>Fee</Cell>
        <Cell>
          {{ formatAmount(transfer.fee_amount) }}
        </Cell>
      </Row>

      <Row>
        <Cell>Status</Cell>
        <Cell>
          <font-awesome-icon
            v-if="transfer.success"
            icon="check"
            class="text-success"
          />
          <font-awesome-icon v-else icon="times" class="text-danger" />
        </Cell>
      </Row>

      <template v-if="transfer.extrinsic && !!transfer.extrinsic.error_message">
        <Row>
          <Cell>Error Description</Cell>
          <Cell>
            {{ transfer.extrinsic.error_message }}
          </Cell>
        </Row>
      </template>
    </Data>
  </Card>
</template>

<script>
import { toChecksumAddress } from 'web3-utils'
import commonMixin from '@/mixins/commonMixin.js'
export default {
  components: {},
  mixins: [commonMixin],
  props: {
    transfer: {
      type: Object,
      default: () => undefined,
    },
  },
  methods: {
    toChecksumAddress(address) {
      return toChecksumAddress(address)
    },
  },
}
</script>

<style lang="scss">
.transfer-details {
  .transfer-details__from,
  .transfer-details__to {
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

  .transfer-details__amount,
  .transfer-details__fee {
    .table-cell__content {
      font-weight: 600;
    }
  }
}
</style>
