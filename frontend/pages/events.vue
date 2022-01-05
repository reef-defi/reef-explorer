<template>
  <div class="list-view">
    <Search
      v-model="filter"
      :placeholder="$t('pages.events.search_placeholder')"
      :label="`${$t('pages.events.title')}<span>${formatNumber(
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
              <Cell>Event</Cell>
              <Cell>Block</Cell>
              <Cell>Age</Cell>
              <Cell>Section/Method</Cell>
              <Cell>Data</Cell>
            </THead>

            <Row v-for="(item, index) in events" :key="index">
              <Cell :link="`/event/${item.block_id}/${item.index}`"
                ># {{ formatNumber(item.block_id) }}-{{ item.index }}</Cell
              >

              <Cell :link="`/block?blockNumber=${item.block_id}`"
                ># {{ formatNumber(item.block_id) }}</Cell
              >

              <Cell class="list-view__age">
                <font-awesome-icon :icon="['far', 'clock']" />
                <span>{{ getAge(item.timestamp) }}</span>
                <span>({{ formatTimestamp(item.timestamp) }})</span>
              </Cell>

              <Cell>{{ item.section }} ➡ {{ item.method }}</Cell>

              <Cell>{{ item.data }}</Cell>
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
import Search from '@/components/Search'
import Loading from '@/components/Loading.vue'
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
      events: [],
      paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 1,
    }
  },
  apollo: {
    $subscribe: {
      event: {
        query: gql`
          subscription events(
            $blockNumber: bigint_comparison_exp
            $perPage: Int!
            $offset: Int!
          ) {
            event(
              limit: $perPage
              offset: $offset
              where: { block_id: $blockNumber }
              order_by: { block_id: desc, index: desc }
            ) {
              block_id
              index
              data
              method
              phase
              section
              timestamp
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.filter ? { _eq: parseInt(this.filter) } : {},
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.events = data.event
          if (this.filter) {
            this.totalRows = this.events.length
          }
          this.loading = false
        },
      },
      /* TODO
          totalEvents: {
        query: gql`
          subscription total {
            total(where: { name: { _eq: "events" } }, limit: 1) {
              count
            }
          }
        `,
        result({ data }) {
          if (!this.filter) {
            this.totalRows = data.total[0].count
          }
        },
      }, */
    },
  },
}
</script>
