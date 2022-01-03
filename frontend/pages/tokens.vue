<template>
  <div class="list-view tokens">
    <Search
      v-model="filter"
      :placeholder="$t('pages.tokens.search_placeholder')"
      :label="`${$t('pages.tokens.title')}<span>${formatNumber(
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
              <Cell>Name</Cell>
              <Cell>Contract Address</Cell>
              <!--              TODO Ziga
              <Cell align="right">Total supply</Cell>
              <Cell align="right">Holders</Cell>-->
            </THead>

            <Row v-for="(item, index) in tokens" :key="index">
              <Cell
                v-if="item.verified_contract && item.verified_contract.name"
                :link="`/token/${item.address}`"
              >
                <img
                  v-if="item.verified_contract.token_icon_url"
                  :src="item.verified_contract.token_icon_url"
                  class="identicon"
                />
                <span>{{ item.verified_contract.name }}</span>
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
              <Cell align="right">{{ getItemSupply(item) }}</Cell>

              <Cell align="right">
                {{ item.holders_aggregate.aggregate.count }}
              </Cell>-->
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
      totalRows: 1,
    }
  },
  apollo: {
    $subscribe: {
      tokens: {
        /* TODO Ziga - missing holders_aggregate in query

        holders_aggregate {
          aggregate {
            count(columns: holder_account_id)
          }
        } */
        query: gql`
          subscription contract(
            $blockHeight: bigint
            $contractAddress: String
            $perPage: Int!
            $offset: Int!
          ) {
            contract(
              limit: $perPage
              offset: $offset
              where: {
                extrinsic: { block_id: { _eq: $blockHeight } }
                address: { _eq: $contractAddress }
                verified_contract: { type: { _eq: "ERC20" } }
              }
              order_by: { extrinsic: { block_id: desc } }
            ) {
              address
              verified_contract {
                address
                name
                args
                source
                compiler_version
                compiled_data
                optimization
                runs
                target
                type
              }
              timestamp
            }
          }
        `,
        variables() {
          return {
            blockHeight: this.isBlockNumber(this.filter)
              ? parseInt(this.filter)
              : undefined,
            contractAddress: this.isContractId(this.filter)
              ? this.filter
              : undefined,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          if (data && data.contract) {
            this.tokens = data.contract
            if (this.filter) {
              this.totalRows = this.tokens.length
            }
          }
          this.loading = false
        },
      },
      /* TODO Ziga
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
      }, */
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
