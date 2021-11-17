<template>
  <div class="list-view contracts">
    <Search
      v-model="filter"
      :placeholder="$t('pages.contracts.search_placeholder')"
      :label="`${$t('pages.contracts.title')}<span>${formatNumber(
        totalRows
      )}</span>`"
    >
      <template slot="bottom">
        <b-alert
          variant="info"
          class="contracts__alert text-center"
          show
          dismissible
        >
          <p class="mb-0">
            <font-awesome-icon icon="code" style="margin-right: 5px" />
            Are you a developer? Verify and publish your contract source code
            <nuxt-link to="/verifyContract" class="alert-link">here</nuxt-link>.
          </p>
        </b-alert>
      </template>
    </Search>

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
              <Cell>Created at Block</Cell>
              <Cell align="center">Verified</Cell>
            </THead>

            <Row v-for="(item, index) in contracts" :key="index">
              <Cell v-if="item.name" :link="`/contract/${item.contract_id}`">{{
                item.name
              }}</Cell>
              <Cell v-else />

              <Cell :link="{ url: `/token/${item.contract_id}`, fill: false }">
                <eth-identicon :address="item.contract_id" :size="20" />
                <span>{{ shortHash(item.contract_id) }}</span>
              </Cell>

              <Cell
                :link="{
                  url: `/block?blockNumber=${item.block_height}`,
                  fill: false,
                }"
              >
                # {{ formatNumber(item.block_height) }}
              </Cell>

              <Cell align="center">
                <font-awesome-icon
                  v-if="item.verified"
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
      contracts: [],
      paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 1,
    }
  },
  apollo: {
    $subscribe: {
      contracts: {
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
              }
              order_by: { block_height: desc }
            ) {
              contract_id
              name
              block_height
              timestamp
              verified
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
          this.contracts = data.contract
          if (this.filter) {
            this.totalRows = this.contracts.length
          }
          this.loading = false
        },
      },
      totalContracts: {
        query: gql`
          subscription total {
            total(where: { name: { _eq: "contracts" } }, limit: 1) {
              count
            }
          }
        `,
        result({ data }) {
          if (!this.filter) {
            this.totalRows = data.total[0].count
          }
        },
      },
    },
  },
}
</script>

<style lang="scss">
.contracts {
  .contracts__alert {
    margin-top: 20px;
    background: rgba(#d1ecf1, 0.85);
    border: none;

    .close {
      padding: 0;
      height: 45px;
      width: 55px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>
