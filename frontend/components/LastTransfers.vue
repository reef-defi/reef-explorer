<template>
  <div class="last-transfers">
    <div class="headline">
      <nuxt-link
        v-b-tooltip.hover
        :to="`/transfers`"
        title="Click to see last transfers"
      >
        Last Transfers
      </nuxt-link>
    </div>

    <Table>
      <THead>
        <Cell>Hash</Cell>
        <Cell>From</Cell>
        <Cell>To</Cell>
        <Cell align="right">Amount</Cell>
      </THead>
      <Row v-for="(item, index) in transfers" :key="'item-' + index">
        <Cell :link="`/transfer/${item.hash}`">{{ shortHash(item.hash) }}</Cell>

        <Cell
          :link="{ url: `/account/${item.from}`, fill: false }"
          :title="$t('pages.accounts.account_details')"
        >
          <ReefIdenticon :key="item.from" :address="item.from" :size="20" />
          <span>{{ shortAddress(item.from) }}</span>
        </Cell>

        <Cell
          :link="{ url: `/account/${item.to}`, fill: false }"
          :title="$t('pages.accounts.account_details')"
        >
          <ReefIdenticon
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

        <Cell align="right">
          {{ formatAmount(item.amount) }}
        </Cell>
      </Row>
    </Table>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import { network } from '@/frontend.config'

export default {
  components: {
    ReefIdenticon,
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
              order_by: { block_id: desc }
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
              block_id
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
              block_id: transfer.block_id,
              hash: transfer.hash,
              from: transfer.signer,
              to: transfer.args[0].address20
                ? transfer.args[0].address20
                : transfer.args[0].id,
              amount:
                transfer.section === 'currencies'
                  ? transfer.args[2]
                  : transfer.args[1],
              token:
                transfer.section === 'currencies'
                  ? transfer.args[1].token
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
  margin-top: 50px;
}
</style>
