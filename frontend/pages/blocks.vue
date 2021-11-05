<template>
  <div class="list-view">
    <Search
      v-model="filter"
      placeholder="Search by block number"
      :label="`${$t('pages.blocks.title')}<span>${formatNumber(
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
              <Cell>Block</Cell>
              <Cell>Age</Cell>
              <Cell>Status</Cell>
              <Cell>Hash</Cell>
              <Cell align="center">Extrinsics</Cell>
              <Cell align="center">Events</Cell>
            </THead>

            <Row v-for="(item, index) in blocks" :key="index">
              <Cell :link="`/block/${item.block_hash}`"
                ># {{ formatNumber(item.block_number) }}</Cell
              >

              <Cell class="list-view__age">
                <font-awesome-icon :icon="['far', 'clock']" />
                <span>{{ getAge(item.timestamp) }}</span>
                <span>({{ formatTimestamp(item.timestamp) }})</span>
              </Cell>

              <Cell>
                <font-awesome-icon
                  :icon="item.finalized ? 'check' : 'spinner'"
                  :class="
                    item.finalized
                      ? 'text-success'
                      : 'list-view__processing-icon'
                  "
                  style="margin-right: 5px"
                />
                <span>{{ item.finalized ? 'Finalized' : 'Processing' }}</span>
              </Cell>

              <Cell>{{ shortHash(item.block_hash) }}</Cell>

              <Cell align="center">{{ item.total_extrinsics }}</Cell>

              <Cell align="center">{{ item.total_events }}</Cell>
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
import '@/components/Table'
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
      blocks: [],
      paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 1,
    }
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription blocks(
            $blockNumber: bigint
            $perPage: Int!
            $offset: Int!
          ) {
            block(
              limit: $perPage
              offset: $offset
              where: { block_number: { _eq: $blockNumber } }
              order_by: { block_number: desc }
            ) {
              block_number
              finalized
              block_hash
              total_extrinsics
              total_events
              timestamp
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.filter ? parseInt(this.filter) : undefined,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.blocks = data.block
          if (this.filter) {
            this.totalRows = this.blocks.length
          }
          this.loading = false
        },
      },
      totalBlocks: {
        query: gql`
          subscription total {
            total(where: { name: { _eq: "blocks" } }, limit: 1) {
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
