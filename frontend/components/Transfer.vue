<template>
  <Card v-if="transfer" class="list-view transfer-details">
    <Headline> Transfer {{ shortHash($route.params.hash) }} </Headline>

    <Data>
      <Row>
        <Cell>Block number</Cell>
        <Cell
          ><nuxt-link :to="`/block?blockNumber=${transfer.block_number}`">
            # {{ formatNumber(transfer.block_number) }}
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
            :to="`/extrinsic/${transfer.block_number}/${transfer.extrinsic_index}`"
            title="Check extrinsic information"
          >
            # {{ formatNumber(transfer.block_number) }}-{{
              transfer.extrinsic_index
            }}
          </nuxt-link>
        </Cell>
      </Row>

      <Row>
        <Cell>Hash</Cell>
        <Cell>{{ transfer.hash }}</Cell>
      </Row>

      <Row class="transfer-details__from">
        <Cell>From</Cell>
        <Cell>
          <div v-if="transfer.signer">
            <ReefIdenticon
              :key="transfer.signer"
              :address="transfer.signer"
              :size="20"
            />
            <nuxt-link :to="`/account/${transfer.signer}`">
              {{ transfer.signer }}
            </nuxt-link>
          </div>
        </Cell>
      </Row>

      <Row class="transfer-details__to">
        <Cell>To</Cell>
        <Cell>
          <div v-if="JSON.parse(transfer.args)[0].id">
            <ReefIdenticon
              :key="JSON.parse(transfer.args)[0].id"
              :address="JSON.parse(transfer.args)[0].id"
              :size="20"
            />
            <nuxt-link :to="`/account/${JSON.parse(transfer.args)[0].id}`">
              {{ JSON.parse(transfer.args)[0].id }}
            </nuxt-link>
          </div>
          <div v-if="JSON.parse(transfer.args)[0].address20">
            <eth-identicon
              :address="
                toChecksumAddress(JSON.parse(transfer.args)[0].address20)
              "
              :size="20"
            />
            <nuxt-link
              :to="`/account/${toChecksumAddress(
                JSON.parse(transfer.args)[0].address20
              )}`"
            >
              {{ toChecksumAddress(JSON.parse(transfer.args)[0].address20) }}
            </nuxt-link>
          </div>
        </Cell>
      </Row>

      <Row class="transfer-details__amount">
        <Cell>Amount</Cell>
        <Cell>{{
          formatAmount(
            transfer.section === 'currencies'
              ? JSON.parse(transfer.args)[2]
              : JSON.parse(transfer.args)[1]
          )
        }}</Cell>
      </Row>

      <Row class="transfer-details__fee">
        <Cell>Fee</Cell>
        <Cell>
          <div v-if="transfer.fee_info">
            {{ formatAmount(JSON.parse(transfer.fee_info).partialFee) }}
          </div>
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
          <template v-if="!transfer.success">
            <Promised
              :promise="
                getExtrinsicFailedFriendlyError(
                  transfer.block_number,
                  transfer.extrinsic_index,
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
    </Data>
  </Card>
</template>

<script>
import { Promised } from 'vue-promised'
import { toChecksumAddress } from 'web3-utils'
import commonMixin from '@/mixins/commonMixin.js'
export default {
  components: { Promised },
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
