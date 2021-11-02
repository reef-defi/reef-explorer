<template>
  <div class="account-transfers list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="transfers.length === 0" class="text-center py-4">
      <h5>{{ $t('components.transfers.no_transfer_found') }}</h5>
    </div>
    <div v-else>
      <div class="list-view__table-head">
        <Input
          v-model="filter"
          :placeholder="$t('components.transfers.search')"
        />
        <JsonCSV
          :data="transfers"
          class="list-view__download-btn"
          :name="`reef_transfers_${accountId}.csv`"
        >
          <font-awesome-icon icon="file-csv" />
          <span>{{ $t('pages.accounts.download_csv') }}</span>
        </JsonCSV>
      </div>
      <Table>
        <THead>
          <Cell width="10" />
          <Cell>Hash</Cell>
          <Cell>Block</Cell>
          <Cell>Date</Cell>
          <Cell>From</Cell>
          <Cell>To</Cell>
          <Cell align="right">Amount</Cell>
          <Cell align="right">Fee</Cell>
          <Cell align="center" width="10">Success</Cell>
        </THead>

        <Row v-for="(item, index) in paginated" :key="index">
          <Cell align="center">
            <font-awesome-icon
              v-if="item.source === accountId"
              :icon="['fas', 'arrow-up']"
            />
            <font-awesome-icon v-else :icon="['fas', 'arrow-down']" />
          </Cell>

          <Cell :link="`/transfer/${item.hash}`">{{
            shortHash(item.hash)
          }}</Cell>

          <Cell :link="`/block?blockNumber=${item.block_number}`"
            ># {{ formatNumber(item.block_number) }}</Cell
          >

          <Cell class="list-view__age">
            <font-awesome-icon :icon="['far', 'clock']" />
            <span>{{ fromNow(item.timestamp) }}</span>
          </Cell>

          <Cell
            :link="{ url: `/account/${item.source}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.source"
              :address="item.source"
              :size="20"
            />
            <span>{{ shortAddress(item.source) }}</span>
          </Cell>

          <Cell
            :link="{ url: `/account/${item.destination}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.destination"
              :address="item.destination"
              :size="20"
            />
            <span>{{ shortAddress(item.destination) }}</span>
          </Cell>

          <Cell align="right">{{ formatAmount(item.amount) }}</Cell>

          <Cell align="right">{{ formatAmount(item.fee_amount) }}</Cell>

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
        <b-pagination
          v-model="currentPage"
          :total-rows="searchResults.length"
          :per-page="perPage"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import JsonCSV from 'vue-json-csv'
import commonMixin from '@/mixins/commonMixin.js'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import Input from '@/components/Input'

export default {
  components: {
    ReefIdenticon,
    JsonCSV,
    Loading,
    Input,
  },
  mixins: [commonMixin],
  props: {
    accountId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      transfers: [],
      filter: null,
      filterOn: [],
      tableOptions: paginationOptions,
      perPage: 20,
      currentPage: 1,
      totalRows: 1,
    }
  },
  computed: {
    searchResults() {
      const list = this.transfers || []

      if (!this.filter) return list

      return list.filter((item) => {
        const filter = this.filter.toLowerCase()
        const hash = item.hash?.toLowerCase() || ''
        const block = item.block_numbeer?.toLowerCase() || ''
        const from = item.source?.toLowerCase() || ''
        const to = item.destination?.toLowerCase() || ''
        return (
          hash.includes(filter) ||
          block.includes(filter) ||
          from.includes(filter) ||
          to.includes(filter)
        )
      })
    },
    paginated() {
      const paginate = (list) => {
        const start = this.perPage * (this.currentPage - 1)
        const end = start + this.perPage
        return list.slice(start, end)
      }

      return paginate(this.searchResults)
    },
  },
  methods: {
    handleNumFields(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
  },
  apollo: {
    $subscribe: {
      transfer: {
        query: gql`
          subscription transfer($accountId: String!) {
            transfer(
              order_by: { block_number: desc }
              where: {
                _or: [
                  { source: { _eq: $accountId } }
                  { destination: { _eq: $accountId } }
                ]
              }
            ) {
              block_number
              extrinsic_index
              section
              method
              hash
              source
              destination
              amount
              denom
              fee_amount
              success
              error_message
              timestamp
            }
          }
        `,
        variables() {
          return {
            accountId: this.accountId,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          this.transfers = data.transfer
          this.totalRows = this.transfers.length
          this.loading = false
        },
      },
    },
  },
}
</script>

<style>
.account-transfers {
  background-color: white;
}
.spinner {
  color: #d3d2d2;
}
</style>
