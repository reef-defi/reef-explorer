<template>
  <div class="list-view accounts">
    <Search
      v-model="filter"
      :placeholder="$t('pages.accounts.search_placeholder')"
      :label="`${$t('pages.accounts.active_accounts')}<span>${formatNumber(
        totalRows
      )}</span>`"
    >
      <template slot="label">
        <JsonCSV
          :data="accountsJSON"
          class="accounts__download-csv-btn"
          name="subsocial_accounts.csv"
        >
          <font-awesome-icon icon="file-csv" />
          <span>{{ $t('pages.accounts.download_csv') }}</span>
        </JsonCSV>
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
              <Cell align="center">Rank</Cell>
              <Cell>Account</Cell>
              <Cell>EVM Address</Cell>
              <Cell align="right">Free Balance</Cell>
              <Cell align="right">Locked Balance</Cell>
              <Cell align="right">Available Balance</Cell>
              <Cell width="10" />
            </THead>

            <Row v-for="(item, index) in paginatedAccounts" :key="index">
              <Cell align="center">#{{ item.rank }}</Cell>

              <Cell :link="{ url: `/account/${item.account_id}`, fill: false }">
                <ReefIdenticon
                  :key="item.account_id"
                  :address="item.account_id"
                  :size="20"
                />
                <span>{{ shortAddress(item.account_id) }}</span>
              </Cell>

              <Cell
                v-if="item.evm_address"
                :link="{ url: `/account/${item.account_id}`, fill: false }"
              >
                <eth-identicon :address="item.evm_address" :size="20" />
                <span>{{
                  item.evm_address ? shortHash(item.evm_address) : ''
                }}</span>
              </Cell>
              <Cell v-else />

              <Cell align="right">{{ formatAmount(item.free_balance) }}</Cell>

              <Cell align="right">{{ formatAmount(item.locked_balance) }}</Cell>

              <Cell align="right">{{
                formatAmount(item.available_balance)
              }}</Cell>

              <Cell>
                <a class="favorite" @click="toggleFavorite(item.account_id)">
                  <font-awesome-icon
                    v-if="item.favorite"
                    v-b-tooltip.hover
                    icon="star"
                    style="color: #f1bd23; cursor: pointer"
                    :title="$t('pages.accounts.remove_from_favorites')"
                  />
                  <font-awesome-icon
                    v-else
                    v-b-tooltip.hover
                    icon="star"
                    style="color: #e6dfdf; cursor: pointer"
                    :title="$t('pages.accounts.add_to_favorites')"
                  />
                </a>
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
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import JsonCSV from 'vue-json-csv'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import Search from '@/components/Search'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Loading,
    ReefIdenticon,
    JsonCSV,
    Search,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      paginationOptions,
      perPage: 20,
      currentPage: 1,
      sortBy: `favorite`,
      sortDesc: true,
      filter: null,
      filterOn: [],
      totalRows: 1,
      accounts: [],
      favorites: [],
      polling: null,
    }
  },
  computed: {
    searchResults() {
      const list = this.parsedAccounts || []

      if (!this.filter) return list

      return list.filter((item) => {
        const filter = this.filter.toLowerCase()
        const accountId = item.account_id ? item.account_id.toLowerCase() : ''
        const evmAddress = item.evm_address
          ? item.evm_address.toLowerCase()
          : ''
        return accountId.includes(filter) || evmAddress.includes(filter)
      })
    },
    paginatedAccounts() {
      const paginate = (list) => {
        const start = this.perPage * (this.currentPage - 1)
        const end = start + this.perPage
        return list.slice(start, end)
      }

      return paginate(this.searchResults)
    },
    parsedAccounts() {
      return this.accounts.map((account, index) => {
        return {
          rank: index + 1,
          ...account,
          favorite: this.isFavorite(account.account_id),
        }
      })
    },
    accountsJSON() {
      return this.parsedAccounts
    },
  },
  watch: {
    favorites(val) {
      this.$cookies.set('favorites', val, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    },
  },
  created() {
    // get favorites from cookie
    if (this.$cookies.get('favorites')) {
      this.favorites = this.$cookies.get('favorites')
    }
  },
  beforeDestroy() {
    clearInterval(this.polling)
  },
  methods: {
    toggleFavorite(accountId) {
      if (this.favorites.includes(accountId)) {
        this.favorites.splice(this.favorites.indexOf(accountId), 1)
      } else {
        this.favorites.push(accountId)
      }
      return true
    },
    isFavorite(accountId) {
      return this.favorites.includes(accountId)
    },
  },
  apollo: {
    $subscribe: {
      accounts: {
        query: gql`
          query account {
            account(order_by: { free_balance: desc }, where: {}) {
              account_id
              evm_address
              identity_display
              identity_display_parent
              available_balance
              free_balance
              locked_balance
            }
          }
        `,
        result({ data }) {
          this.accounts = data.account
          this.totalRows = this.accounts.length
          this.loading = false
        },
      },
    },
  },
}
</script>

<style lang="scss">
.accounts {
  .accounts__download-csv-btn {
    margin: 0;
    padding: 5px;
    color: white;
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    user-select: none;

    svg {
      margin-right: 8px;
    }

    &:hover {
      cursor: pointer;
      text-decoration: underline;
    }

    &:active {
      opacity: 0.75;
    }
  }

  @media only screen and (max-width: 576px) {
    .accounts__download-csv-btn {
      margin: 5px 0 0 -5px;
    }
  }
}
</style>
