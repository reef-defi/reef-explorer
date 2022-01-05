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
              <Cell>Hash</Cell>
              <Cell>Block</Cell>
              <Cell>Age</Cell>
              <Cell>From</Cell>
              <Cell>To</Cell>
              <Cell align="center">Success</Cell>
              <Cell align="right">Amount</Cell>
            </THead>

            <Row v-for="(item, index) in transfers" :key="index">
              <Cell :link="`/transfer/${item.hash}`">{{
                shortHash(item.hash)
              }}</Cell>

              <Cell :link="`/block?blockNumber=${item.block_id}`"
                ># {{ formatNumber(item.block_id) }}</Cell
              >

              <Cell class="list-view__age">
                <font-awesome-icon :icon="['far', 'clock']" />
                <span>{{ getAge(item.timestamp) }}</span>
                <span>({{ formatTimestamp(item.timestamp) }})</span>
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

              <Cell align="center">
                <font-awesome-icon
                  v-if="item.success"
                  icon="check"
                  class="text-success"
                />
                <font-awesome-icon v-else icon="times" class="text-danger" />
              </Cell>

              <Cell align="right">{{ formatAmount(item.amount) }}</Cell>
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
    }
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsic(
            $blockNumber: bigint_comparison_exp
            $extrinsicHash: String_comparison_exp
            $fromAddress: String_comparison_exp
            $perPage: Int!
            $offset: Int!
          ) {
            extrinsic(
              limit: $perPage
              offset: $offset
              order_by: { block_id: desc, index: desc }
              where: {
                _or: [
                  {
                    section: { _eq: "currencies" }
                    method: { _like: "transfer" }
                    block_id: $blockNumber
                    hash: $extrinsicHash
                    signer: $fromAddress
                  }
                  {
                    section: { _eq: "balances" }
                    method: { _like: "transfer%" }
                    block_id: $blockNumber
                    hash: $extrinsicHash
                    signer: $fromAddress
                  }
                ]
              }
            ) {
              block_id
              section
              signer
              hash
              args
              status
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
              success: transfer.status === 'success',
              timestamp: transfer.timestamp,
            }
          })
          this.loading = false
        },
      },
      /* count: {
        query: gql`
          subscription count(
            $blockNumber: bigint
            $extrinsicHash: String
            $fromAddress: String
            $toAddress: String
          ) {
            extrinsic(
              where: {
                _or: [
                  {
                    section: { _eq: "currencies" }
                    method: { _like: "transfer" }
                    block_id: { _eq: $blockNumber }
                    hash: { _eq: $extrinsicHash }
                    signer: { _eq: $fromAddress }
                  }
                  {
                    section: { _eq: "balances" }
                    method: { _like: "transfer%" }
                    block_id: { _eq: $blockNumber }
                    hash: { _eq: $extrinsicHash }
                    signer: { _eq: $fromAddress }
                  }
                ]
              }
            ) {
              aggregate {
                count
              }
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.isBlockNumber(this.filter)
              ? parseInt(this.filter)
              : undefined,
            extrinsicHash: this.isHash(this.filter) ? this.filter : undefined,
            fromAddress: this.isAddress(this.filter) ? this.filter : undefined,
          }
        },
        result({ data }) {
          this.totalRows = data.extrinsic_aggregate.aggregate.count
        },
      }, */
    },
  },
}
</script>
