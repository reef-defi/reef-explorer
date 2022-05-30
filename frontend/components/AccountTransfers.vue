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
          <Cell :sortable="['extrinsic_hash', activeSort]">Hash</Cell>
          <Cell :sortable="['block_id', activeSort]">Block</Cell>
          <Cell :sortable="['timestamp', activeSort, true]">Date</Cell>
          <Cell :sortable="['from_address', activeSort]">From</Cell>
          <Cell :sortable="['to_address', activeSort]">To</Cell>
          <Cell :sortable="['amount', activeSort]" align="right">Amount</Cell>
          <Cell :sortable="['fee_amount', activeSort]" align="right">Fee</Cell>
          <Cell :sortable="['success', activeSort]" align="center" width="10"
            >Success</Cell
          >
        </THead>

        <Row v-for="(item, index) in list" :key="index">
          <Cell
            align="center"
            class="account-transfers__indicator"
            :class="{
              'account-transfers__indicator--reverse':
                item.from_address !== accountId,
            }"
          >
            <font-awesome-icon :icon="['fas', 'arrow-up']" />
          </Cell>

          <Cell :link="`/transfer/${item.extrinsic.hash}`">{{
            shortHash(item.extrinsic_hash)
          }}</Cell>

          <Cell :link="`/block?blockNumber=${item.block_id}`"
            ># {{ formatNumber(item.block_id) }}</Cell
          >

          <Cell class="list-view__age">
            <font-awesome-icon :icon="['far', 'clock']" />
            <span>{{ fromNow(item.timestamp) }}</span>
          </Cell>

          <Cell
            :link="{ url: `/account/${item.from_address}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.from_address"
              :address="item.from_address"
              :size="20"
            />
            <span>
              {{ shortAddress(item.from_address) }}
            </span>
          </Cell>

          <Cell
            :link="{ url: `/account/${item.to_address}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.to_address"
              :address="item.to_address"
              :size="20"
            />
            <span>
              {{ shortAddress(item.to_address) }}
            </span>
          </Cell>

          <Cell align="right">{{
            formatShortAmount(item.amount, item.symbol, item.decimals)
          }}</Cell>

          <Cell align="right">{{ formatShortAmount(item.fee_amount) }}</Cell>

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
import tableUtils from '@/mixins/tableUtils'

export default {
  components: {
    ReefIdenticon,
    JsonCSV,
    Loading,
    Input,
  },
  mixins: [commonMixin, tableUtils],
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
      perPage: null,
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
        const hash = item.extrinsic.hash
          ? item.extrinsic.hash.toLowerCase()
          : ''
        const block = item.block_id ? String(item.block_id).toLowerCase() : ''
        const from = item.from_address ? item.from_address.toLowerCase() : ''
        const to = item.to_address ? item.to_address.toLowerCase() : ''
        return (
          hash.includes(filter) ||
          block.includes(filter) ||
          from.includes(filter) ||
          to.includes(filter)
        )
      })
    },
    list() {
      return this.paginate(
        this.sort(this.searchResults),
        this.perPage,
        this.currentPage
      )
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
              order_by: { block_id: desc }
              where: {
                _or: [
                  { to_address: { _eq: $accountId } }
                  { from_address: { _eq: $accountId } }
                ]
              }
            ) {
              block_id
              extrinsic {
                index
                section
                method
                hash
                status
              }
              to_address
              from_address
              to_evm_address
              from_evm_address
              amount
              denom
              token {
                address
                verified_contract {
                  contract_data
                }
              }
              fee_amount
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
          this.transfers = data.transfer.map((t) => ({
            ...t,
            extrinsic_hash: t.extrinsic.hash,
            success: t.extrinsic.status === 'success',
            to_address: t.to_address || t.to_evm_address,
            from_address: t.from_address || t.from_evm_address,
            symbol: t.token.verified_contract?.contract_data?.symbol,
            decimals: t.token.verified_contract?.contract_data?.decimals,
          }))
          this.totalRows = this.transfers.length
          this.loading = false
        },
      },
    },
  },
}
</script>

<style lang="scss">
.account-transfers {
  .account-transfers__indicator {
    .table-cell__content-wrapper {
      padding-left: 14px;
    }

    svg {
      font-size: 16px;
      transform: rotate(45deg);
      color: #8792a8;
    }

    &--reverse {
      svg {
        transform: rotate(-135deg);
        color: #14be7d;
      }
    }
  }
}
</style>
