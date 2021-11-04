<template>
  <div class="staking-rewards list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="stakingRewards.length === 0" class="text-center py-4">
      <h5>{{ $t('components.staking_rewards.no_reward_found') }}</h5>
    </div>
    <div v-else>
      <div class="list-view__table-head">
        <Input
          v-model="filter"
          :placeholder="$t('components.staking_rewards.search')"
        />
        <JsonCSV
          :data="stakingRewards"
          class="list-view__download-btn"
          :name="`polkastats_staking_rewards_${accountId}.csv`"
        >
          <font-awesome-icon icon="file-csv" />
          <span>{{ $t('pages.accounts.download_csv') }}</span>
        </JsonCSV>
      </div>

      <Table>
        <THead>
          <Cell>Block Number</Cell>
          <Cell>Date</Cell>
          <Cell>Time Ago</Cell>
          <Cell align="right">Reward</Cell>
        </THead>

        <Row v-for="(item, index) in paginated" :key="index">
          <Cell :link="`/block?blockNumber=${item.block_number}`">
            # {{ formatNumber(item.block_number) }}
          </Cell>

          <Cell>{{ getDateFromTimestamp(item.timestamp) }}</Cell>

          <Cell>{{ fromNow(item.timeago) }}</Cell>

          <Cell align="right">{{ formatAmount(item.amount, 6) }}</Cell>
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
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import JsonCSV from 'vue-json-csv'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import Input from '@/components/Input'

export default {
  components: {
    Loading,
    JsonCSV,
    Input,
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
      stakingRewards: [],
      filter: null,
      filterOn: [],
      tableOptions: paginationOptions,
      perPage: 20,
      currentPage: 1,
      totalRows: 1,
    }
  },
  computed: {
    searchResults() {
      const list = this.stakingRewards || []

      if (!this.filter) return list

      return list.filter((item) => {
        const filter = this.filter.toLowerCase()
        const block = item.block_number
          ? String(item.block_number).toLowerCase()
          : ''
        const amount = this.formatAmount(item.amount, 6)
        return block.includes(filter) || amount.includes(filter)
      })
    },
    paginated() {
      const paginate = (list) => {
        const start = this.perPage * (this.currentPage - 1)
        const end = start + this.perPage
        return list.slice(start, end)
      }

      return paginate(this.searchResults)
    },
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
      event: {
        query: gql`
          subscription staking_reward($accountId: String!) {
            staking_reward(
              order_by: { block_number: desc }
              where: { account_id: { _eq: $accountId } }
            ) {
              block_number
              event_index
              amount
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
          this.stakingRewards = data.staking_reward.map((event) => {
            return {
              block_number: event.block_number,
              timestamp: event.timestamp,
              timeago: event.timestamp,
              amount: event.amount,
            }
          })
          this.totalRows = this.stakingRewards.length
          this.loading = false
        },
      },
    },
  },
}
</script>
