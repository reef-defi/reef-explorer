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
        <Cell>Transfer</Cell>
        <Cell>Token</Cell>
        <Cell>From</Cell>
        <Cell>To</Cell>
        <Cell>Amount</Cell>
        <Cell>Success</Cell>
      </THead>
      <Row v-for="(item, index) in transfers" :key="'item-' + index">
        <Cell :link="`/transfer/${item.hash}`">{{ shortHash(item.hash) }}</Cell>

        <Cell
          :link="{ url: `/token/${item.tokenAddress}`, fill: false }"
          :title="$t('pages.accounts.account_details')"
        >
          <ReefIdenticon
            :key="item.tokenAddress"
            :address="item.tokenAddress"
            :size="20"
          />
          <span>{{ shortAddress(item.tokenAddress) }}</span>
        </Cell>

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

        <Cell>
          {{ formatShortAmount(item.amount, item.symbol, item.decimals) }}
        </Cell>

        <Cell align="center">
          <font-awesome-icon
            v-if="item.success"
            icon="check"
            class="text-success"
          />
          <font-awesome-icon v-else icon="times" class="text-danger" />
        </Cell>
      </Row>
    </Table>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
// import { network } from '@/frontend.config'

const GET_TRANSFER_EXTRINSIC_EVENTS = gql`
  query extrinsic($exId: bigint!) {
    extrinsic(where: { id: { _eq: $exId } }) {
      id
      hash
      index
      events(where: { method: { _eq: "Transfer" } }) {
        data
        extrinsic_id
      }
    }
  }
`

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
          subscription transfer {
            transfer(limit: 10, order_by: { extrinsic: { id: desc } }) {
              extrinsic {
                id
                hash
                index
                block_id
              }
              from_account {
                address
              }
              to_account {
                address
              }
              token {
                address
                verified_contract {
                  contract_data
                }
              }
              to_evm_address
              from_evm_address
              success
              amount
              timestamp
            }
          }
        `,
        async result({ data }) {
          const processed = data.transfer.map((transfer) => ({
            amount: transfer.amount,
            success: transfer.success,
            hash: transfer.extrinsic.hash,
            timestamp: transfer.timestamp,
            tokenAddress: transfer.token.address,
            symbol:
              transfer.token.verified_contract.contract_data?.symbol || ' ',
            decimals:
              transfer.token.verified_contract.contract_data?.decimals || 1,
            to:
              transfer.to_account !== null
                ? transfer.to_account.address
                : transfer.to_evm_address,
            from:
              transfer.from_account !== null
                ? transfer.from_account.address
                : transfer.from_evm_address,
            extrinsicId: transfer.extrinsic.id,
          }))
          const repaird = processed.map(async (transfer) => {
            if (transfer.to !== 'deleted' && transfer.from !== 'deleted') {
              return transfer
            }
            const res = await this.$apollo.provider.defaultClient.query({
              query: GET_TRANSFER_EXTRINSIC_EVENTS,
              variables: {
                exId: transfer.extrinsicId,
              },
            })
            if (
              res.data &&
              res.data.extrinsic.length > 0 &&
              res.data.extrinsic[0].events &&
              res.data.extrinsic[0].events.length > 0 &&
              res.data.extrinsic[0].events[0].data
            ) {
              const [to, from] = res.data.extrinsic[0].events[0].data
              return { ...transfer, to, from }
            }
            return transfer
          })
          this.transfers = await Promise.all(repaird)
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
