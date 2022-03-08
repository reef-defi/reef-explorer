<template>
  <div class="list-view tokens">
    <Search
      v-model="filter"
      :placeholder="$t('pages.tokens.search_placeholder')"
      :label="`${$t('pages.tokens.title')} ${formatNumber(totalRows)}`"
    />

    <section>
      <b-container>
        <div class="list-view__table">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <Table v-else>
            <THead>
              <Cell>Name</Cell>
              <Cell>Symbol</Cell>
              <Cell>Contract Address</Cell>
              <Cell>Created at block</Cell>
              <!--              TODO Ziga
              <Cell align="right">Total supply</Cell>-->
              <Cell>Holders</Cell>
            </THead>

            <Row v-for="(item, index) in tokens" :key="index">
              <Cell v-if="item.contract_data" :link="`/token/${item.address}`">
                <img
                  v-if="item.contract_data.token_icon_url"
                  :src="item.contract_data.token_icon_url"
                  class="identicon"
                />
                <span>{{ item.contract_data.name || item.name }}</span>
                <font-awesome-icon
                  v-if="item.verified_contract"
                  v-b-tooltip.hover
                  icon="check"
                  class="validated"
                  title="Validated Token"
                />
              </Cell>
              <Cell
                v-if="item.contract_data && item.contract_data.symbol"
                :link="`/token/${item.address}`"
              >
                <img
                  v-if="item.contract_data.token_icon_url"
                  :src="item.contract_data.token_icon_url"
                  class="identicon"
                />
                <span>{{ item.contract_data.symbol }}</span>
                <font-awesome-icon
                  v-if="item.verified_contract"
                  v-b-tooltip.hover
                  icon="check"
                  class="validated"
                  title="Validated Token"
                />
              </Cell>

              <Cell v-else />

              <Cell :link="{ url: `/token/${item.address}`, fill: false }">
                <eth-identicon :address="item.address" :size="20" />
                <span>{{ shortHash(item.address) }}</span>
              </Cell>

              <!-- TODO Ziga
              <Cell align="right">{{ getItemSupply(item) }}</Cell>-->

              <Cell
                :link="{
                  url: `/block?blockNumber=${item.contract.extrinsic.block_id}`,
                  fill: false,
                }"
              >
                # {{ formatNumber(item.contract.extrinsic.block_id) }}
              </Cell>

              <Cell>
                {{ item.contract.token_holders_aggregate.aggregate.count }}
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
import Search from '@/components/Search'
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Loading,
    Search,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      filter: '',
      tokens: [],
      paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 0,
      nTokens: 0,
    }
  },
  apollo: {
    $subscribe: {
      tokens: {
        query: gql`
          subscription contract(
            $blockHeight: extrinsic_bool_exp
            $contractAddress: String_comparison_exp
            $perPage: Int!
            $offset: Int!
          ) {
            verified_contract(
              limit: $perPage
              offset: $offset
              where: {
                type: { _neq: "other" }
                address: $contractAddress
                contract: { extrinsic: $blockHeight }
              }
              order_by: { contract: { extrinsic: { block_id: desc } } }
            ) {
              address
              contract_data
              name
              contract {
                timestamp
                token_holders_aggregate(where: { balance: { _gt: "0" } }) {
                  aggregate {
                    count(distinct: true)
                  }
                }
                extrinsic {
                  hash
                  block_id
                }
                signer
              }
            }
          }
        `,
        variables() {
          return {
            blockHeight: this.isBlockNumber(this.filter)
              ? { block_id: { _eq: parseInt(this.filter) } }
              : {},
            contractAddress: this.isContractId(this.filter)
              ? { _ilike: this.toContractAddress(this.filter) }
              : {},
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          if (data && data.verified_contract) {
            this.tokens = data.verified_contract
            this.totalRows = this.filter ? this.tokens.length : this.nTokens
          }
          this.loading = false
        },
      },
      totaltokens: {
        query: gql`
          query contract_aggregate {
            verified_contract_aggregate(where: { type: { _neq: "other" } }) {
              aggregate {
                count
              }
            }
          }
        `,
        result({ data }) {
          this.nTokens = data.verified_contract_aggregate.aggregate.count
          this.totalRows = this.nTokens
        },
      },
    },
  },
  methods: {
    getItemSupply(item) {
      const supply = this.formatTokenAmount(
        item.token_total_supply || 0,
        item.token_decimals || 0,
        item.token_symbol || ''
      ).trim()

      if (supply === '0.00') return ''

      return supply
    },
  },
}
</script>

<style lang="scss">
.tokens {
  * + .validated {
    margin-left: 6px;
  }

  .validated {
    color: lightgreen;
  }
}
</style>
