<template>
  <div class="token-holders list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="holders.length === 0" class="text-center py-4">
      <h5>No holders found</h5>
    </div>
    <div v-else>
      <Table>
        <THead>
          <Cell>Account ID</Cell>
          <Cell>EVM Address</Cell>
          <Cell align="right" :sortable="['balance', activeSort]">Balance</Cell>
        </THead>

        <Row v-for="(item, index) in list" :key="index">
          <Cell
            v-if="item.account && item.account.address"
            :link="`/account/${item.account.address}`"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.account.address"
              :address="item.account.address"
              :size="20"
            />
            <span>{{ shortAddress(item.account.address) }}</span>
          </Cell>
          <Cell v-else />

          <Cell
            v-if="item.account && item.account.evm_address"
            :link="{ fill: false, url: `/account/${item.account.address}` }"
          >
            <eth-identicon :address="item.account.evm_address" :size="20" />
            <span>{{ shortHash(item.account.evm_address) }}</span>
          </Cell>
          <Cell v-else />

          <Cell align="right">{{ getBalance(item) }}</Cell>
        </Row>
      </Table>

      <div class="list-view__pagination">
        <PerPage v-model="perPage" />
        <b-pagination
          v-model="currentPage"
          :total-rows="holders.length"
          :per-page="perPage"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import tableUtils from '@/mixins/tableUtils'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin, tableUtils],
  props: {
    tokenId: { type: String, required: true },
    decimals: { type: Number, default: 0 },
    symbol: { type: String, default: '' },
  },
  data() {
    return {
      loading: true,
      holders: [],
      tableOptions: paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 1,
      activeSort: {
        property: 'balance',
        descending: true,
      },
    }
  },
  computed: {
    list() {
      return this.paginate(
        this.sort(this.holders),
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
    getBalance(holder) {
      return this.formatTokenAmount(holder.balance, this.decimals, this.symbol)
    },
  },
  apollo: {
    $subscribe: {
      transfer: {
        query: gql`
          subscription token_holder($tokenId: String!) {
            token_holder(
              order_by: { token_address: desc }
              where: { token_address: { _eq: $tokenId } }
            ) {
              token_address
              signer
              balance
              account {
                address
                evm_address
              }
            }
          }
        `,
        variables() {
          return {
            tokenId: this.tokenId,
          }
        },
        skip() {
          return !this.tokenId
        },
        result({ data }) {
          this.holders =
            data.token_holder.filter((item) => !!item.account) || []
          this.totalRows = this.holders.length
          this.loading = false
        },
      },
    },
  },
}
</script>
