<template>
  <div class="account-token-balances">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="balances.length === 0" class="text-center py-4">
      <h5>{{ $t('components.account_token_balances.no_token_found') }}</h5>
    </div>
    <div v-else>
      <!-- Filter -->
      <b-row style="margin-bottom: 1rem">
        <b-col cols="12">
          <b-form-input
            id="filterInput"
            v-model="filter"
            type="search"
            :placeholder="$t('components.account_token_balances.search')"
          />
        </b-col>
      </b-row>
      <JsonCSV
        :data="balances"
        class="download-csv mb-2"
        :name="`reef_token_balances_${accountId}.csv`"
      >
        <font-awesome-icon icon="file-csv" />
        {{ $t('pages.accounts.download_csv') }}
      </JsonCSV>
      <div class="table-responsive">
        <b-table
          striped
          hover
          :fields="fields"
          :per-page="perPage"
          :current-page="currentPage"
          :items="balances"
          :filter="filter"
          @filtered="onFiltered"
        >
          <template #cell(contract_id)="data">
            <p class="mb-0">
              <eth-identicon :address="data.item.contract_id" :size="16" />
              <nuxt-link
                v-b-tooltip.hover
                :to="`/contract/${data.item.contract_id}`"
                title="Check contract information"
              >
                {{ data.item.contract_id }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(token_name)="data">
            <p class="mb-0">
              <nuxt-link :to="`/token/${data.item.contract_id}`">
                {{ data.item.token_name }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(balance)="data">
            <p class="mb-0">
              {{
                formatTokenAmount(
                  data.item.balance,
                  data.item.token_decimals,
                  data.item.token_symbol
                )
              }}
            </p>
          </template>
        </b-table>
        <div class="mt-4 d-flex">
          <b-pagination
            v-model="currentPage"
            :total-rows="totalRows"
            :per-page="perPage"
            aria-controls="account-token-balances-table"
          />
          <b-button-group class="ml-2">
            <b-button
              v-for="(item, index) in tableOptions"
              :key="index"
              @click="handleNumFields(item)"
            >
              {{ item }}
            </b-button>
          </b-button-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import gql from 'graphql-tag'
import JsonCSV from 'vue-json-csv'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    JsonCSV,
    Loading,
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
      balances: [],
      filter: null,
      filterOn: [],
      tableOptions: paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'token_name',
          label: 'Token',
          sortable: true,
        },
        {
          key: 'contract_id',
          label: 'Address',
          sortable: false,
        },
        {
          key: 'balance',
          label: 'Balance',
          sortable: true,
        },
      ],
    }
  },
  methods: {
    handleNumFields(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
    onFiltered(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length
      this.currentPage = 1
    },
  },
  apollo: {
    $subscribe: {
      token_holder: {
        query: gql`
          subscription token_holder($accountId: String!) {
            token_holder(
              order_by: { balance: desc }
              where: { holder_account_id: { _eq: $accountId } }
            ) {
              contract_id
              holder_account_id
              holder_evm_address
              balance
              contract {
                token_decimals
                token_name
                token_symbol
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
            contract_id: balance.contract_id,
            holder_account_id: balance.holder_account_id,
            holder_evm_address: balance.holder_evm_address,
            balance: balance.balance,
            token_decimals: balance.contract.token_decimals,
            token_name: balance.contract.token_name,
            token_symbol: balance.contract.token_symbol,
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
