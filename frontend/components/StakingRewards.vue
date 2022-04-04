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
          <Cell :sortable="['hash', activeSort]">Hash</Cell>
          <Cell :sortable="['block_id', activeSort]">Block Number</Cell>
          <Cell :sortable="['timeago', activeSort, true]">Time Ago</Cell>
          <Cell :sortable="['amount', activeSort]">Reward</Cell>
          <Cell :sortable="['fee', activeSort]" align="right">Fee</Cell>
        </THead>

        <Row v-for="(item, index) in list" :key="index">
          <Cell :link="`/extrinsic/${item.block_id}/${item.extrinsicIndex}`">
            {{ shortHash(item.hash) }}
          </Cell>

          <Cell :link="`/block?blockNumber=${item.block_id}`">
            # {{ formatNumber(item.block_id) }}
          </Cell>

          <Cell class="list-view__age">
            <font-awesome-icon :icon="['far', 'clock']" />
            <span>{{ fromNow(item.timeago) }}</span>
          </Cell>

          <Cell>{{ formatAmount(item.amount, 'REEF', 18) }}</Cell>
          <Cell align="right">{{ formatAmount(item.fee, 'REEF', 18) }}</Cell>
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
    Loading,
    JsonCSV,
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
      stakingRewards: [],
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
      const list = this.stakingRewards || []

      if (!this.filter) return list

      return list.filter((item) => {
        const filter = this.filter.toLowerCase()
        const block = item.block_id ? String(item.block_id).toLowerCase() : ''
        const amount = this.formatAmount(item.amount, 6)
        return block.includes(filter) || amount.includes(filter)
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
          subscription staking($accountId: String!) {
            staking(
              order_by: { id: desc }
              where: { signer: { _eq: $accountId } }
            ) {
              id
              signer
              amount
              event {
                index
                block_id
                extrinsic_id
                extrinsic {
                  hash
                  index
                  signed_data
                }
              }
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
          this.stakingRewards = data.staking.map((stakeEv) => {
            const timestamp = new Date(stakeEv.timestamp).getTime() / 1000
            return {
              timestamp,
              timeago: timestamp,
              amount: stakeEv.amount,
              address: stakeEv.signer,
              block_id: stakeEv.event.block_id,
              hash: stakeEv.event.extrinsic.hash,
              fee: stakeEv.event.extrinsic.signed_data?.fee.partialFee || 0,
              extrinsicIndex: stakeEv.event.extrinsic.index,
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
