<template>
  <div class="list-view accounts">
    <Search
      v-model="filter"
      :placeholder="$t('pages.accounts.search_placeholder')"
      :label="`${$t('pages.accounts.active_accounts')} ${formatNumber(
        totalRows
      )}`"
    >
      <template slot="label">
        <JsonCSV
          :data="accounts"
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
          <Table v-else class="accounts__table">
            <THead>
              <Cell align="center">Rank</Cell>
              <Cell>Account</Cell>
              <Cell>EVM Address</Cell>
              <Cell align="right">Free Balance</Cell>
              <Cell align="right">Locked Balance</Cell>
              <Cell align="right">Available Balance</Cell>
              <Cell width="10" />
            </THead>

            <Row v-for="(item, index) in favoriteAccounts" :key="index">
              <Cell align="center">#{{ item.rank }}</Cell>

              <Cell :link="{ url: `/account/${item.address}`, fill: false }">
                <ReefIdenticon
                  :key="item.address"
                  :address="item.address"
                  :size="20"
                />
                <span>{{ shortAddress(item.address) }}</span>
              </Cell>

              <Cell
                v-if="item.evm_address"
                :link="{ url: `/account/${item.address}`, fill: false }"
              >
                <eth-identicon :address="item.evm_address" :size="20" />
                <span>{{
                  item.evm_address ? shortHash(item.evm_address) : ''
                }}</span>
              </Cell>
              <Cell v-else />

              <Cell align="right">{{
                formatShortAmount(item.free_balance)
              }}</Cell>

              <Cell align="right">{{
                formatShortAmount(item.locked_balance)
              }}</Cell>

              <Cell align="right">{{
                formatShortAmount(item.available_balance)
              }}</Cell>

              <Cell>
                <a class="favorite" @click="toggleFavorite(item.address)">
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
            <THead v-if="favoriteAccounts.length > 0">
              <Cell />
              <Cell>All accounts</Cell>
              <Cell />
              <Cell />
              <Cell />
              <Cell />
              <Cell />
            </THead>
            <Row
              v-for="(item, index) in allAccounts"
              :key="index + favoriteAccounts.length"
            >
              <Cell align="center">#{{ item.rank }}</Cell>

              <Cell :link="{ url: `/account/${item.address}`, fill: false }">
                <ReefIdenticon
                  :key="item.address"
                  :address="item.address"
                  :size="20"
                />
                <span>{{ shortAddress(item.address) }}</span>
              </Cell>

              <Cell
                v-if="item.evm_address"
                :link="{ url: `/account/${item.address}`, fill: false }"
              >
                <eth-identicon :address="item.evm_address" :size="20" />
                <span>{{
                  item.evm_address ? shortHash(item.evm_address) : ''
                }}</span>
              </Cell>
              <Cell v-else />

              <Cell align="right">{{
                formatShortAmount(item.free_balance)
              }}</Cell>

              <Cell align="right">{{
                formatShortAmount(item.locked_balance)
              }}</Cell>

              <Cell align="right">{{
                formatShortAmount(item.available_balance)
              }}</Cell>

              <Cell>
                <a class="favorite" @click="toggleFavorite(item.address)">
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
import JsonCSV from 'vue-json-csv'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import Search from '@/components/Search'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'

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
      perPage: null,
      currentPage: 1,
      sortBy: `favorite`,
      sortDesc: true,
      filter: null,
      filterOn: [],
      totalRows: 1,
      accounts: [],
      favorites: [],
      nAccounts: 0,
      allAccounts: [],
      favoriteAccounts: [],
      polling: null,
    }
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
      const includes = this.favorites.includes(accountId)
      if (includes) {
        this.favorites.splice(this.favorites.indexOf(accountId), 1)
        this.favoritesLength -= 1
        this.$bvToast.toast(
          `Account ${accountId} has been removed from your favorites.`,
          {
            title: 'Removed from Favorites',
            variant: 'danger',
            autoHideDelay: 5000,
            appendToast: false,
          }
        )
      } else {
        this.favorites.push(accountId)
        this.favoritesLength -= 1
        this.$bvToast.toast(
          `Account ${accountId} has been added to your favorites.`,
          {
            title: 'Added to Favorites',
            variant: 'success',
            autoHideDelay: 5000,
            appendToast: false,
          }
        )
      }
      for (const account of this.allAccounts) {
        if (account.address === accountId) {
          account.favorite = !account.favorite
        }
      }
      return true
    },
    isFavorite(accountId) {
      return this.favorites.includes(accountId)
    },
    updateFavoritesRank() {
      for (const account of this.allAccounts) {
        if (this.favorites.includes(account.address)) {
          this.favoriteAccounts = this.favoriteAccounts.map((acc) => ({
            ...acc,
            rank: account.address === acc.address ? account.rank : acc.rank,
          }))
        }
      }
    },
  },
  apollo: {
    $subscribe: {
      favoriteAccounts: {
        query: gql`
          subscription favoritAccount($addresses: String_comparison_exp) {
            account(
              order_by: { free_balance: desc }
              where: { address: $addresses }
            ) {
              address
              evm_address
              available_balance
              free_balance
              locked_balance
            }
          }
        `,
        variables() {
          return {
            addresses: { _in: this.favorites },
          }
        },
        result({ data }) {
          if (data && data.account) {
            this.favoriteAccounts = data.account.map((account) => ({
              ...account,
              favorite: true,
            }))
            this.updateFavoritesRank()
          }
        },
      },
      accounts: {
        query: gql`
          subscription account(
            $perPage: Int!
            $offset: Int!
            $address: String_comparison_exp
            $evmAddress: String_comparison_exp
          ) {
            account(
              order_by: { free_balance: desc }
              limit: $perPage
              offset: $offset
              where: { address: $address, evm_address: $evmAddress }
            ) {
              address
              evm_address
              available_balance
              free_balance
              locked_balance
            }
          }
        `,
        variables() {
          return {
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
            address: this.isAddress(this.filter) ? { _eq: this.filter } : {},
            evmAddress: this.isContractId(this.filter)
              ? { _eq: this.toContractAddress(this.filter) }
              : {},
          }
        },
        result({ data }) {
          if (data && data.account) {
            this.allAccounts = data.account.map((account, index) => ({
              ...account,
              favorite: this.favorites.includes(account.address),
              rank: index + (this.currentPage - 1) * this.perPage + 1,
            }))
            if (!this.filter) {
              this.updateFavoritesRank()
              this.totalRows = this.nAccounts
            } else {
              this.totalRows = this.allAccounts.length
            }
          }
          this.loading = false
        },
      },
      totalAccounts: {
        query: gql`
          subscription chain_info {
            chain_info(where: { name: { _eq: "accounts" } }, limit: 1) {
              count
            }
          }
        `,
        result({ data }) {
          this.nAccounts = data.chain_info[0].count
          this.totalRows = this.nAccounts
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

  .favorite {
    &::after {
      display: none;
    }
  }

  .accounts__list {
    display: none;

    .accounts__list-item {
      padding: 22px 10px 25px 10px;
      text-decoration: none;
      display: flex;
      flex-flow: column nowrap;
      justify-content: flex-start;
      align-items: center;

      .accounts__list-item-rank {
        text-align: center;
        font-size: 13px;
        font-weight: 500;
        color: rgba(#4c4f58, 0.8);
      }

      .accounts__list-item-identicon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 0 10px -10px rgba(#0f233f, 0.5),
          0 5px 15px -5px rgba(#0f233f, 0.25);
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 8px 0 13px 0;
      }

      .accounts__list-item-account {
        text-align: center;
        font-size: 17px;
        font-weight: 600;
        background: linear-gradient(90deg, #a93185, #5531a9);
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .accounts__list-item-info {
        width: 100%;
        margin-top: 20px;

        .accounts__list-item-info-item {
          width: 100%;
          display: flex;
          flex-flow: row nowrap;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          line-height: 15px;
          font-weight: 500;
          color: #3e3f42;
          text-align: right;

          label {
            margin: 0;
            text-align: left;
            font-weight: 600;
          }

          & + .accounts__list-item-info-item {
            margin-top: 8px;
          }
        }
      }

      &:first-child {
        padding-top: 17px;
      }

      & + .accounts__list-item {
        border-top: solid 1px #eaedf3;
      }
    }
  }

  @media only screen and (max-width: 768px) {
    .accounts__list {
      display: block;
    }
  }

  @media only screen and (max-width: 576px) {
    .accounts__download-csv-btn {
      margin-top: 10px;
    }
  }
}
</style>
