<template>
  <div class="account-token-balances list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="balances.length === 0" class="text-center py-4">
      <h5>{{ $t('components.account_token_balances.no_token_found') }}</h5>
    </div>
    <div v-else>
      <div class="list-view__table-head">
        <Input
          v-model="filter"
          :placeholder="$t('components.account_token_balances.search')"
        />
        <JsonCSV
          :data="balances"
          class="list-view__download-btn"
          :name="`reef_token_balances_${accountId}.csv`"
        >
          <font-awesome-icon icon="file-csv" />
          <span>{{ $t('pages.accounts.download_csv') }}</span>
        </JsonCSV>
      </div>

      <Table>
        <THead>
          <Cell :sortable="['token_name', activeSort]">Token</Cell>
          <Cell :sortable="['contract_id', activeSort]">Address</Cell>
          <Cell :sortable="['balance', activeSort]" align="right">Balance</Cell>
        </THead>

        <Row v-for="(item, index) in list" :key="index">
          <Cell :link="`/token/${item.contract_id}`">{{
            item.token_name
          }}</Cell>

          <Cell :link="{ url: `/contract/${item.contract_id}`, fill: false }">
            <eth-identicon :address="item.contract_id" :size="20" />
            <span>{{ item.contract_id }}</span>
          </Cell>

          <Cell align="right">
            {{
              formatShortAmount(
                item.balance,
                item.token_symbol,
                item.token_decimals
              )
            }}
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
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import Input from '@/components/Input'
import tableUtils from '@/mixins/tableUtils'

export default {
  components: {
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
      balances: [],
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
      const list = this.balances || []

      if (!this.filter) return list

      return list.filter((item) => {
        const filter = this.filter.toLowerCase()
        const name = item.token_name ? item.token_name.toLowerCase() : ''
        const address = item.contract_id ? item.contract_id.toLowerCase() : ''

        return name.includes(filter) || address.includes(filter)
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
      token_holder: {
        query: gql`
          subscription token_holder($accountId: String!) {
            token_holder(
              order_by: { balance: desc }
              where: { signer: { _eq: $accountId } }
            ) {
              signer
              balance
              info
              token_address
              contract {
                address
                verified_contract {
                  name
                  contract_data
                }
              }
              account {
                evm_address
              }
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
          this.balances = data.token_holder.map((balance) => ({
            contract_id: balance.contract.address,
            holder_account_id: balance.signer,
            holder_evm_address: balance.account.evm_address,
            balance: balance.balance.toLocaleString('fullwide', {
              useGrouping: false,
            }),
            token_name: balance.contract.verified_contract.contract_data.name,
            token_symbol:
              balance.contract.verified_contract.contract_data.symbol, // TODO check
            token_decimals:
              balance.contract.verified_contract.contract_data.decimals,
          }))
          this.totalRows = this.balances.length
          this.loading = false
        },
      },
    },
  },
}
</script>

<style>
.account-token-balances {
  background-color: white;
}
.spinner {
  color: #d3d2d2;
}
</style>
