<template>
  <div>
    <section>
      <b-container class="page-tokens main py-5">
        <b-row class="mb-2">
          <b-col cols="12">
            <h1>
              {{ $t('pages.tokens.title') }}
              <small v-if="totalRows !== 1" class="ml-1" style="font-size: 1rem"
                >[{{ formatNumber(totalRows) }}]</small
              >
            </h1>
          </b-col>
        </b-row>
        <div class="tokens">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <template v-else>
            <!-- Filter -->
            <b-row style="margin-bottom: 1rem">
              <b-col cols="12">
                <b-form-input
                  id="filterInput"
                  v-model="filter"
                  type="search"
                  :placeholder="$t('pages.tokens.search_placeholder')"
                />
              </b-col>
            </b-row>
            <div class="table-responsive">
              <b-table striped hover :fields="fields" :items="tokens">
                <template #cell(token_name)="data">
                  <p class="mb-0">
                    <nuxt-link :to="`/token/${data.item.contract_id}`">
                      {{ data.item.name }}
                    </nuxt-link>
                  </p>
                </template>
                <template #cell(contract_id)="data">
                  <p class="mb-0">
                    <eth-identicon
                      :address="data.item.contract_id"
                      :size="16"
                    />
                    <nuxt-link :to="`/contract/${data.item.contract_id}`">
                      {{ data.item.contract_id }}
                    </nuxt-link>
                  </p>
                </template>
                <template #cell(token_total_supply)="data">
                  <p class="mb-0">
                    {{
                      formatTokenAmount(
                        data.item.token_total_supply,
                        data.item.token_decimals,
                        data.item.token_symbol
                      )
                    }}
                  </p>
                </template>
                <template #cell(holders_aggregate)="data">
                  <p class="mb-0">
                    {{ data.item.holders_aggregate.aggregate.count }}
                  </p>
                </template>
              </b-table>
            </div>
            <!-- pagination -->
            <div class="row">
              <div class="col-6">
                <!-- desktop -->
                <div class="d-none d-sm-none d-md-none d-lg-block d-xl-block">
                  <b-button-group>
                    <b-button
                      v-for="(option, index) in paginationOptions"
                      :key="index"
                      variant="outline-secondary"
                      :class="{ 'selected-per-page': perPage === option }"
                      @click="setPageSize(option)"
                    >
                      {{ option }}
                    </b-button>
                  </b-button-group>
                </div>
                <!-- mobile -->
                <div class="d-block d-sm-block d-md-block d-lg-none d-xl-none">
                  <b-dropdown
                    class="m-md-2"
                    text="Page size"
                    variant="outline-secondary"
                  >
                    <b-dropdown-item
                      v-for="(option, index) in paginationOptions"
                      :key="index"
                      @click="setPageSize(10)"
                    >
                      {{ option }}
                    </b-dropdown-item>
                  </b-dropdown>
                </div>
              </div>
              <div class="col-6">
                <b-pagination
                  v-model="currentPage"
                  :total-rows="totalRows"
                  :per-page="perPage"
                  aria-controls="my-table"
                  variant="dark"
                  align="right"
                ></b-pagination>
              </div>
            </div>
          </template>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import gql from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      filter: '',
      tokens: [],
      paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'token_name',
          label: 'Name',
          sortable: true,
        },
        {
          key: 'contract_id',
          label: 'Contract address',
          sortable: true,
        },
        {
          key: 'token_symbol',
          label: 'Symbol',
          sortable: true,
        },
        {
          key: 'token_decimals',
          label: 'Decimals',
          sortable: true,
        },
        {
          key: 'token_total_supply',
          label: 'TotalSupply',
          sortable: true,
        },
        {
          key: 'holders_aggregate',
          label: 'Holders',
          sortable: true,
        },
      ],
    }
  },
  methods: {
    setPageSize(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
  },
  apollo: {
    $subscribe: {
      tokens: {
        query: gql`
          subscription contract(
            $blockHeight: bigint
            $contractId: String
            $perPage: Int!
            $offset: Int!
          ) {
            contract(
              limit: $perPage
              offset: $offset
              where: {
                block_height: { _eq: $blockHeight }
                contract_id: { _eq: $contractId }
                is_erc20: { _eq: true }
              }
              order_by: { block_height: desc }
            ) {
              contract_id
              name
              signer
              block_height
              token_name
              token_symbol
              token_decimals
              token_total_supply
              timestamp
              holders_aggregate {
                aggregate {
                  count(columns: holder_account_id)
                }
              }
            }
          }
        `,
        variables() {
          return {
            blockHeight: this.isBlockNumber(this.filter)
              ? parseInt(this.filter)
              : undefined,
            contractId: this.isContractId(this.filter)
              ? this.filter
              : undefined,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.tokens = data.contract
          // eslint-disable-next-line no-console
          console.log(this.tokens)
          if (this.filter) {
            this.totalRows = this.tokens.length
          }
          this.loading = false
        },
      },
      totaltokens: {
        query: gql`
          query contract_aggregate {
            contract_aggregate(where: { is_erc20: { _eq: true } }) {
              aggregate {
                count
              }
            }
          }
        `,
        result({ data }) {
          if (!this.filter) {
            this.totalRows = data.contract_aggregate.aggregate.count
          }
        },
      },
    },
  },
}
</script>
