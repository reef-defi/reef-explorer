<template>
  <div class="last-transfers">
    <div class="headline">
      <nuxt-link
        v-b-tooltip.hover
        :to="`/blocks`"
        title="Click to see last transfers"
      >
        Last transfers
      </nuxt-link>
    </div>

    <Table>
      <Row v-for="(item, index) in transfers" :key="'item-' + index">
        <Cell label="Block" :link="`/transfer/${item.hash}`">{{
          shortHash(item.hash)
        }}</Cell>

        <Cell
          label="From"
          :link="{ url: `/account/${item.from}`, fill: false }"
          :title="$t('pages.accounts.account_details')"
        >
          <Identicon :key="item.from" :address="item.from" :size="20" />
          <span>{{ shortAddress(item.from) }}</span>
        </Cell>

        <Cell
          label="To"
          :link="{ url: `/account/${item.to}`, fill: false }"
          :title="$t('pages.accounts.account_details')"
        >
          <Identicon
            v-if="isValidAddressPolkadotAddress(item.to)"
            :key="item.to"
            :address="item.to"
            :size="20"
          />
          <eth-identicon v-else :address="item.to" :size="20" />
          <span>{{
            isValidAddressPolkadotAddress(item.to)
              ? shortAddress(item.to)
              : shortHash(item.to)
          }}</span>
        </Cell>

        <Cell label="Amount">
          {{ formatAmount(item.amount) }}
        </Cell>
      </Row>
    </Table>
  </div>
</template>

<script>
import '@/components/Table'
import gql from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Identicon from '@/components/Identicon.vue'
import { network } from '../frontend.config'

export default {
  components: {
    Identicon,
  },
  mixins: [commonMixin],
  data() {
    return {
      transfers: [],
    }
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsic {
            extrinsic(
              order_by: { block_number: desc }
              where: {
                _or: [
                  {
                    section: { _eq: "currencies" }
                    method: { _like: "transfer" }
                  }
                  {
                    section: { _eq: "balances" }
                    method: { _like: "transfer%" }
                  }
                ]
              }
              limit: 10
            ) {
              block_number
              section
              signer
              hash
              args
            }
          }
        `,
        result({ data }) {
          this.transfers = data.extrinsic.map((transfer) => {
            return {
              block_number: transfer.block_number,
              hash: transfer.hash,
              from: transfer.signer,
              to: JSON.parse(transfer.args)[0].address20
                ? JSON.parse(transfer.args)[0].address20
                : JSON.parse(transfer.args)[0].id,
              amount:
                transfer.section === 'currencies'
                  ? JSON.parse(transfer.args)[2]
                  : JSON.parse(transfer.args)[1],
              token:
                transfer.section === 'currencies'
                  ? JSON.parse(transfer.args)[1].token
                  : network.tokenSymbol,
            }
          })
        },
      },
    },
  },
}
</script>

<style lang="scss">
.last-transfers .table th,
.last-transfers .table td {
  padding: 0.45rem;
}
.last-transfers .table thead th {
  border-bottom: 0;
}

* + .last-transfers {
  margin-top: 30px;
}

.last-transfers {
  .table-cell {
    .identicon,
    .eth-identicon {
      $size: 17px;

      width: $size;
      height: $size;
      min-width: $size;
      min-height: $size;
      max-width: $size;
      max-height: $size;
      border-radius: 50%;
      margin-right: 4px;
      margin-left: -5px;
      overflow: hidden;

      svg {
        width: $size;
        height: $size;
      }
    }
  }
}
</style>
