<template>
  <div class="list-view">
    <Search
      v-model="filter"
      :placeholder="$t('pages.transfers.search_placeholder')"
      :label="`${$t('pages.transfers.title')}<span>${formatNumber(
        totalRows
      )}</span>`"
    />

    <section>
      <b-container>
        <div class="list-view__table">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <Table v-else>
            <THead>
              <Cell>Transaction</Cell>
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
                formatAmount(item.amount, item.symbol, item.decimals)
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
                from_account: { address: $fromAddress }
              }
              order_by: { extrinsic: { id: desc } }
            ) {
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
        variables() {
          return {
            blockNumber: this.isBlockNumber(this.filter)
              ? { _eq: parseInt(this.filter) }
              : {},
            extrinsicHash: this.isHash(this.filter) ? { _eq: this.filter } : {},
            fromAddress: this.isAddress(this.filter)
              ? { _eq: this.filter }
              : {},
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.transfers = data.transfer.map(
            ({
              success,
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
              success,
              timestamp,
              hash: extrinsic.hash,
              idx: extrinsic.index,
              block_id: extrinsic.block_id,
              to: to === null ? toEvm : to.address,
              from: from === null ? fromEvm : from.address,
              symbol: token.verified_contract?.contract_data?.symbol,
              decimals: token.verified_contract?.contract_data?.decimals,
            })
          )
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
