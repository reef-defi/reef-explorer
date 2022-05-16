<template>
  <div class="list-view">
    <Search
      v-model="filter"
      :placeholder="$t('pages.transfers.search_placeholder')"
      :label="`${$t('pages.transfers.title')} ${formatNumber(totalRows)}`"
    />

    <section>
      <b-container>
        <div class="list-view__table">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <Table v-else>
            <THead>
              <Cell>Transfer</Cell>
              <Cell>Extrinsic</Cell>
              <Cell>From</Cell>
              <Cell>To</Cell>
              <Cell>Amount</Cell>
              <Cell>Age</Cell>
              <Cell align="right">Success</Cell>
            </THead>

            <Row v-for="(item, index) in transfers" :key="index">
              <Cell :link="`/transfer/${item.hash}`">{{
                shortHash(item.hash)
              }}</Cell>

              <Cell :link="`/extrinsic/${item.block_id}/${item.idx}`">
                #{{ formatNumber(item.block_id) }}-{{ formatNumber(item.idx) }}
              </Cell>

              <Cell
                :link="{ url: `/account/${item.from}`, fill: false }"
                :title="$t('pages.accounts.account_details')"
              >
                <ReefIdenticon
                  :key="item.from"
                  :address="item.from"
                  :size="20"
                />
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

              <Cell>{{
                formatShortAmount(item.amount, item.symbol, item.decimals)
              }}</Cell>

              <Cell
                v-b-tooltip.hover
                class="list-view__age"
                :title="formatTimestamp(item.timestamp)"
              >
                <font-awesome-icon :icon="['far', 'clock']" />
                <span>{{ getAge(item.timestamp) }}</span>
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

          <div class="list-view__pagination">
            <PerPage v-model="perPage" />
            <b-pagination
              v-model="currentPage"
              :total-rows="totalRows"
              :per-page="perPage"
            />
          </div>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import { paginationOptions } from '@/frontend.config.js'

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
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      filter: null,
      transfers: [],
      paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 1,
      nTransfers: 0,
    }
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription transfer(
            $blockNumber: bigint_comparison_exp
            $extrinsicHash: String_comparison_exp
            $fromAddress: String_comparison_exp
            $perPage: Int!
            $offset: Int!
          ) {
            transfer(
              limit: $perPage
              offset: $offset
              where: {
                extrinsic: { block_id: $blockNumber, hash: $extrinsicHash }
                from_address: $fromAddress
              }
              order_by: { extrinsic: { id: desc } }
            ) {
              extrinsic {
                id
                hash
                index
                block_id
                args
                status
                error_message
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
              amount
              timestamp
              denom
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.isBlockNumber(this.filter)
              ? { _eq: parseInt(this.filter) }
              : {},
            extrinsicHash: this.isHash(this.filter) ? { _eq: this.filter } : {},
            fromAddress: {},
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        async result({ data }) {
          const converted = data.transfer.map(
            ({
              timestamp,
              from_account: from,
              to_account: to,
              amount,
              extrinsic,
              to_evm_address: toEvm,
              from_evm_address: fromEvm,
              token,
            }) => ({
              amount,
              success: extrinsic.status === 'success',
              timestamp,
              hash: extrinsic.hash,
              idx: extrinsic.index,
              extrinsicId: extrinsic.id,
              block_id: extrinsic.block_id,
              to: to === null ? toEvm : to.address, // resolveAddress(toEvm, to, extrinsic.event.data[1]),
              from: from === null ? fromEvm : from.address, // resolveAddress(toEvm, to, extrinsic.event.data[0]), // from === null ? fromEvm : from.address,
              symbol: token.verified_contract?.contract_data?.symbol || ' ',
              decimals: token.verified_contract?.contract_data?.decimals || 1,
            })
          )
          const repared = converted.map(async (transfer) => {
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

          this.transfers = await Promise.all(repared)
          this.totalRows = this.filter ? this.transfers.length : this.nTransfers
          this.loading = false
        },
      },
      totalTransfers: {
        query: gql`
          subscription total {
            transfer_aggregate {
              aggregate {
                count
              }
            }
          }
        `,
        result({ data }) {
          this.nTransfers = data.transfer_aggregate.aggregate.count
          this.totalRows = this.nTransfers
        },
      },
    },
  },
}
</script>
